import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { mpEnv } from "@/lib/mercadopago/env";
import { validateWebhookSignature } from "@/lib/mercadopago/webhook-signature";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";

type MpOrderResponse = {
  id: string;
  status?: string;
  transactions?: { payments?: { id?: string; reference_id?: string | number; status?: string }[] };
};

function mapMpStatus(raw?: string): string {
  if (!raw) return "created";
  const s = raw.toLowerCase();
  if (s === "processed") return "processed";
  if (s === "expired") return "expired";
  if (s === "cancelled" || s === "canceled") return "canceled";
  if (s === "failed") return "failed";
  return "created";
}

async function reconcileOrder(mpOrderId: string) {
  const svc = createServiceClient();
  const { data: session } = await svc
    .from("payment_sessions")
    .select("id, business_id, order_id, status")
    .eq("mp_order_id", mpOrderId)
    .maybeSingle();
  if (!session) return;

  const token = await getAccessTokenForBusiness(session.business_id);
  const remote = await mpFetch<MpOrderResponse>(token, `/v1/orders/${encodeURIComponent(mpOrderId)}`, {
    method: "GET",
  });
  const mapped = mapMpStatus(remote.status);
  const paymentId = remote.transactions?.payments?.[0]?.reference_id;

  if (mapped === session.status) return;

  await svc
    .from("payment_sessions")
    .update({
      status: mapped,
      payment_id: paymentId != null ? String(paymentId) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (session.order_id && mapped === "processed") {
    await svc
      .from("orders")
      .update({
        payment_status: "paid",
        mp_payment_id: paymentId != null ? String(paymentId) : null,
        paid_at: new Date().toISOString(),
      })
      .eq("id", session.order_id);
  } else if (session.order_id && (mapped === "expired" || mapped === "canceled")) {
    await svc.from("orders").update({ payment_status: "expired" }).eq("id", session.order_id);
  }
}

export async function POST(req: NextRequest) {
  const { webhookSecret } = mpEnv();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const xSignature = req.headers.get("x-signature") ?? undefined;
  const xRequestId = req.headers.get("x-request-id") ?? undefined;
  const dataId =
    req.nextUrl.searchParams.get("data.id") ??
    req.nextUrl.searchParams.get("id") ??
    undefined;
  const type = req.nextUrl.searchParams.get("type") ?? undefined;

  let body: { type?: string; data?: { id?: string } } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const orderId = dataId ?? body.data?.id;
  const eventType = type ?? body.type;

  if (
    !validateWebhookSignature(xSignature, xRequestId, orderId, webhookSecret)
  ) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (eventType !== "order" || !orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const svc = createServiceClient();
  const reqId = xRequestId ?? `no-req-${randomUUID()}`;
  const { error: insErr } = await svc.from("mp_webhook_events").insert({
    x_request_id: reqId,
    data_id: orderId,
    event_type: eventType,
    payload: body,
  });
  if (insErr?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (insErr) {
    return NextResponse.json({ error: "No se pudo persistir evento" }, { status: 500 });
  }

  try {
    await reconcileOrder(orderId);
    await svc.from("mp_webhook_events").update({ processed: true }).eq("x_request_id", reqId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await svc
      .from("mp_webhook_events")
      .update({ last_error: message, attempts: 1 })
      .eq("x_request_id", reqId);
  }

  return NextResponse.json({ ok: true });
}
