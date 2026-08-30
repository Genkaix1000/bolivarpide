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

type MpPaymentResponse = {
  id: number | string;
  status?: string;
  external_reference?: string;
};

function mapMpStatus(raw?: string): string {
  if (!raw) return "created";
  const s = raw.toLowerCase();
  if (s === "processed" || s === "approved") return "processed";
  if (s === "expired") return "expired";
  if (s === "cancelled" || s === "canceled" || s === "rejected") return "canceled";
  if (s === "failed") return "failed";
  return "created";
}

function orderIdFromExternalRef(ref?: string | null): string | null {
  if (!ref?.startsWith("BP-")) return null;
  return ref.slice(3);
}

async function markOrderPaid(
  orderId: string,
  paymentId: string | number | null,
  sessionId?: string,
) {
  const svc = createServiceClient();
  if (sessionId) {
    await svc
      .from("payment_sessions")
      .update({
        status: "processed",
        payment_id: paymentId != null ? String(paymentId) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }
  await svc
    .from("orders")
    .update({
      payment_status: "paid",
      mp_payment_id: paymentId != null ? String(paymentId) : null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  const { emitOrderPaidNotifications } = await import("@/lib/notifications/emit");
  void emitOrderPaidNotifications(orderId);
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
    await markOrderPaid(session.order_id, paymentId ?? null, session.id);
  } else if (session.order_id && (mapped === "expired" || mapped === "canceled")) {
    await svc.from("orders").update({ payment_status: "expired" }).eq("id", session.order_id);
  }
}

async function reconcilePayment(paymentId: string, mpUserId: string | null) {
  const svc = createServiceClient();
  let businessId: string | null = null;

  if (mpUserId) {
    const { data: conn } = await svc
      .from("mp_merchant_connections")
      .select("business_id")
      .eq("mp_user_id", mpUserId)
      .eq("status", "active")
      .maybeSingle();
    businessId = conn?.business_id ?? null;
  }

  if (!businessId) {
    const { data: fallbackSession } = await svc
      .from("payment_sessions")
      .select("business_id")
      .eq("channel", "checkout_pro")
      .eq("status", "created")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    businessId = fallbackSession?.business_id ?? null;
  }

  if (!businessId) return;

  const token = await getAccessTokenForBusiness(businessId);
  const payment = await mpFetch<MpPaymentResponse>(
    token,
    `/v1/payments/${encodeURIComponent(paymentId)}`,
    { method: "GET" },
  );

  const orderId = orderIdFromExternalRef(payment.external_reference);
  if (!orderId) return;

  const { data: session } = await svc
    .from("payment_sessions")
    .select("id, status, order_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const mapped = mapMpStatus(payment.status);
  if (session && mapped !== session.status) {
    await svc
      .from("payment_sessions")
      .update({
        status: mapped,
        payment_id: String(payment.id),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  if (mapped === "processed") {
    await markOrderPaid(orderId, payment.id, session?.id);
  } else if (mapped === "expired" || mapped === "canceled") {
    await svc.from("orders").update({ payment_status: "expired" }).eq("id", orderId);
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
  const mpUserId = req.nextUrl.searchParams.get("user_id") ?? null;

  let body: { type?: string; data?: { id?: string } } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const resourceId = dataId ?? body.data?.id;
  const eventType = type ?? body.type;

  if (
    !validateWebhookSignature(xSignature, xRequestId, resourceId, webhookSecret)
  ) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (!resourceId || (eventType !== "order" && eventType !== "payment")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const svc = createServiceClient();
  const reqId = xRequestId ?? `no-req-${randomUUID()}`;
  const { error: insErr } = await svc.from("mp_webhook_events").insert({
    x_request_id: reqId,
    data_id: resourceId,
    event_type: eventType ?? "unknown",
    payload: body,
  });
  if (insErr?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (insErr) {
    return NextResponse.json({ error: "No se pudo persistir evento" }, { status: 500 });
  }

  try {
    if (eventType === "order") {
      await reconcileOrder(resourceId);
    } else {
      await reconcilePayment(resourceId, mpUserId);
    }
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
