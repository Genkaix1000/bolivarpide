import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";

const QR_EXPIRATION_MS = 15 * 60 * 1000;

export type CheckoutLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  productId?: string;
  note?: string;
};

export type CheckoutInput = {
  businessSlug: string;
  userId: string;
  lines: CheckoutLine[];
  paymentMethod: "mercadopago_qr" | "cash";
  couponCode?: string;
  idempotencyKey?: string;
};

export type CheckoutResult =
  | {
      kind: "qr";
      orderId: string;
      paymentSessionId: string;
      qrData: string;
      expiresAt: string;
      amountCents: number;
      subtotalCents: number;
      discountCents: number;
    }
  | {
      kind: "cash";
      orderId: string;
      amountCents: number;
      subtotalCents: number;
      discountCents: number;
    };

async function resolveBusiness(slug: string) {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("businesses")
    .select("id, slug, name, mp_ready, accepts_cash")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function applyCoupon(
  businessId: string,
  code: string,
  subtotalCents: number,
): Promise<{ discountCents: number; couponId: string | null }> {
  const svc = createServiceClient();
  const { data: coupon } = await svc
    .from("coupons")
    .select("*")
    .eq("business_id", businessId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) throw new Error("Cupón inválido o expirado");
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error("Cupón expirado");
  }
  if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses) {
    throw new Error("Cupón agotado");
  }
  const minOrder = coupon.min_order_cents ?? 0;
  if (subtotalCents < minOrder) {
    throw new Error(`Pedido mínimo para este cupón: $${(minOrder / 100).toLocaleString("es-AR")}`);
  }

  let discountCents = 0;
  if (coupon.type === "percent") {
    discountCents = Math.round(subtotalCents * (Number(coupon.value) / 100));
  } else if (coupon.type === "fixed") {
    discountCents = Math.min(subtotalCents, Math.round(Number(coupon.value) * 100));
  }
  return { discountCents, couponId: coupon.id };
}

export async function validateCouponPublic(businessSlug: string, code: string, subtotalCents: number) {
  const business = await resolveBusiness(businessSlug);
  if (!business) throw new Error("Comercio no encontrado");
  const { discountCents, couponId } = await applyCoupon(business.id, code, subtotalCents);
  return {
    valid: true,
    discountCents,
    couponId,
    finalCents: subtotalCents - discountCents,
  };
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const business = await resolveBusiness(input.businessSlug);
  if (!business) {
    throw new Error("Este local todavía no está registrado en BolivarPide. Usá un comercio real del panel negocio.");
  }

  if (input.lines.length === 0) throw new Error("Carrito vacío");

  const subtotalCents = input.lines.reduce(
    (s, l) => s + l.unitPriceCents * l.quantity,
    0,
  );
  if (subtotalCents <= 0) throw new Error("Monto inválido");

  let discountCents = 0;
  let couponId: string | null = null;
  if (input.couponCode?.trim()) {
    const applied = await applyCoupon(business.id, input.couponCode.trim(), subtotalCents);
    discountCents = applied.discountCents;
    couponId = applied.couponId;
  }

  const amountCents = subtotalCents - discountCents;
  if (amountCents <= 0) throw new Error("El total debe ser mayor a cero");

  const svc = createServiceClient();

  if (input.paymentMethod === "cash") {
    if (!business.accepts_cash) throw new Error("Este comercio no acepta efectivo");
    const { data: order, error } = await svc
      .from("orders")
      .insert({
        business_id: business.id,
        customer_user_id: input.userId,
        status: "pending",
        payment_method: "cash",
        payment_status: "awaiting_payment",
        subtotal_cents: amountCents,
        total_cents: amountCents,
        coupon_id: couponId,
      })
      .select("id")
      .single();
    if (error) throw error;

    await svc.from("order_items").insert(
      input.lines.map((l) => ({
        order_id: order.id,
        product_id: l.productId ?? null,
        name: l.name,
        quantity: l.quantity,
        unit_price_cents: l.unitPriceCents,
      })),
    );

    return {
      kind: "cash",
      orderId: order.id,
      amountCents,
      subtotalCents,
      discountCents,
    };
  }

  if (!business.mp_ready) {
    throw new Error("Este comercio aún no configuró Mercado Pago. Pedile que vincule desde el panel Pagos.");
  }

  const { data: pos } = await svc
    .from("mp_pos")
    .select("external_pos_id")
    .eq("business_id", business.id)
    .single();
  if (!pos?.external_pos_id) throw new Error("Caja MP no provisionada");

  const idempotencyKey = input.idempotencyKey ?? randomUUID();
  const { data: existingSession } = await svc
    .from("payment_sessions")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingSession?.qr_data && existingSession.status === "created") {
    return {
      kind: "qr",
      orderId: existingSession.order_id!,
      paymentSessionId: existingSession.id,
      qrData: existingSession.qr_data,
      expiresAt: existingSession.expires_at!,
      amountCents: existingSession.amount_cents,
      subtotalCents,
      discountCents,
    };
  }

  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      business_id: business.id,
      customer_user_id: input.userId,
      status: "pending",
      payment_method: "mercadopago_qr",
      payment_status: "awaiting_payment",
      subtotal_cents: amountCents,
      total_cents: amountCents,
      coupon_id: couponId,
    })
    .select("id")
    .single();
  if (orderErr) throw orderErr;

  await svc.from("order_items").insert(
    input.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId ?? null,
      name: l.name,
      quantity: l.quantity,
      unit_price_cents: l.unitPriceCents,
    })),
  );

  const token = await getAccessTokenForBusiness(business.id);
  const amountStr = (amountCents / 100).toFixed(2);
  const externalRef = `BP-${order.id}`.slice(0, 64);

  const mpOrder = await mpFetch<{
    id: string;
    type_response?: { qr_data?: string };
    transactions?: { payments?: { id?: string }[] };
  }>(token, "/v1/orders", {
    method: "POST",
    idempotencyKey,
    body: JSON.stringify({
      type: "qr",
      external_reference: externalRef,
      total_amount: amountStr,
      description: `Pedido BolivarPide · ${business.name}`,
      expiration_time: "PT15M",
      config: {
        qr: {
          external_pos_id: pos.external_pos_id,
          mode: "dynamic",
        },
      },
      transactions: { payments: [{ amount: amountStr }] },
      items: input.lines.map((l) => ({
        title: l.name.slice(0, 150),
        unit_price: (l.unitPriceCents / 100).toFixed(2),
        quantity: l.quantity,
        unit_measure: "unit",
      })),
    }),
  });

  const qrData = mpOrder.type_response?.qr_data?.trim();
  if (!qrData) throw new Error("Mercado Pago no devolvió qr_data");

  const expiresAt = new Date(Date.now() + QR_EXPIRATION_MS).toISOString();
  const { data: session, error: sessErr } = await svc
    .from("payment_sessions")
    .insert({
      order_id: order.id,
      business_id: business.id,
      channel: "qr_dynamic",
      mp_order_id: mpOrder.id,
      external_reference: externalRef,
      idempotency_key: idempotencyKey,
      payment_transaction_id: mpOrder.transactions?.payments?.[0]?.id ?? null,
      amount_cents: amountCents,
      qr_data: qrData,
      status: "created",
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (sessErr) throw sessErr;

  await svc
    .from("orders")
    .update({ active_payment_session_id: session.id })
    .eq("id", order.id);

  return {
    kind: "qr",
    orderId: order.id,
    paymentSessionId: session.id,
    qrData,
    expiresAt,
    amountCents,
    subtotalCents,
    discountCents,
  };
}

export async function getPaymentStatus(orderId: string, userId: string) {
  const svc = createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("id, payment_status, payment_method, customer_user_id, active_payment_session_id")
    .eq("id", orderId)
    .single();
  if (!order || order.customer_user_id !== userId) return null;

  const { data: session } = order.active_payment_session_id
    ? await svc
        .from("payment_sessions")
        .select("*")
        .eq("id", order.active_payment_session_id)
        .maybeSingle()
    : { data: null };

  return { order, session };
}
