import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { mpEnv } from "@/lib/mercadopago/env";
import { validateWebhookSignature } from "@/lib/mercadopago/webhook-signature";
import { reconcileOrder, reconcilePayment } from "@/lib/mercadopago/reconcile";

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

  if (!validateWebhookSignature(xSignature, xRequestId, resourceId, webhookSecret)) {
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
    event_type: eventType,
    payload: body,
  });
  if (insErr?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (insErr) {
    return NextResponse.json({ error: "No se pudo persistir evento" }, { status: 500 });
  }

  // Reconcilia el evento contra el estado local (dominio en src/lib/mercadopago/reconcile).
  try {
    const businessId =
      eventType === "order"
        ? await reconcileOrder(resourceId)
        : await reconcilePayment(resourceId, mpUserId);
    await svc
      .from("mp_webhook_events")
      .update({
        processed: true,
        ...(businessId ? { business_id: businessId } : {}),
      })
      .eq("x_request_id", reqId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await svc
      .from("mp_webhook_events")
      .update({ last_error: message, attempts: 1 })
      .eq("x_request_id", reqId);
  }

  return NextResponse.json({ ok: true });
}