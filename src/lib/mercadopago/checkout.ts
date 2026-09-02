import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness } from "@/lib/mercadopago/repository";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";
import { mpCheckoutBackUrls, checkoutReturnOrigin } from "@/lib/mercadopago/env";
import { checkoutAmountCents, type PayChannel } from "@/lib/payments/pricing";
import { getBusinessPaymentSettings } from "@/lib/payments/businessSettings";
import { formatFullDeliveryAddress } from "@/lib/addresses/display";
import { rowToAddress, type AddressRow } from "@/lib/addresses/db";

const QR_EXPIRATION_MS = 15 * 60 * 1000;

export type CheckoutLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  productId?: string;
  note?: string;
  optionsDetail?: { label: string; priceCents: number }[];
};

import { packOrderItemNote } from "@/lib/orders/itemOptionsNote";

export type FulfillmentType = "delivery" | "pickup";

function orderItemRows(orderId: string, lines: CheckoutLine[]) {
  return lines.map((l) => ({
    order_id: orderId,
    product_id: l.productId ?? null,
    name: l.name,
    quantity: l.quantity,
    unit_price_cents: l.unitPriceCents,
    note: packOrderItemNote(l.note, l.optionsDetail),
  }));
}

export type CheckoutInput = {
  businessSlug: string;
  userId: string;
  lines: CheckoutLine[];
  paymentMethod: "mercadopago_qr" | "mercadopago_fast" | "cash";
  couponCode?: string;
  idempotencyKey?: string;
  /** Origin del request (ej. https://bolivarpide.com) para back_urls de Checkout Pro. */
  returnOrigin?: string;
  fulfillmentType?: FulfillmentType;
  deliveryAddressId?: string;
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
      kind: "redirect";
      orderId: string;
      paymentSessionId: string;
      initPoint: string;
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

async function resolveFulfillment(
  userId: string,
  fulfillmentType: FulfillmentType,
  deliveryAddressId?: string,
): Promise<{ fulfillment_type: FulfillmentType; delivery_address: string | null }> {
  if (fulfillmentType === "pickup") {
    return { fulfillment_type: "pickup", delivery_address: null };
  }
  if (!deliveryAddressId?.trim()) {
    throw new Error("Agregá una dirección de entrega para continuar");
  }
  const svc = createServiceClient();
  const { data: row, error } = await svc
    .from("user_addresses")
    .select("*")
    .eq("id", deliveryAddressId.trim())
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("Dirección no encontrada");
  return {
    fulfillment_type: "delivery",
    delivery_address: formatFullDeliveryAddress(rowToAddress(row as AddressRow)),
  };
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

  const baseCents = subtotalCents - discountCents;
  if (baseCents <= 0) throw new Error("El total debe ser mayor a cero");

  const paySettings = await getBusinessPaymentSettings(business.id);

  const channel: PayChannel =
    input.paymentMethod === "cash"
      ? "cash"
      : input.paymentMethod === "mercadopago_fast"
        ? "fast_pay"
        : "qr";
  const amountCents = checkoutAmountCents(
    baseCents,
    channel,
    paySettings.absorbFastPayFee,
  );
  if (amountCents <= 0) throw new Error("El total debe ser mayor a cero");

  const svc = createServiceClient();

  const { data: customerProfile } = await svc
    .from("user_profiles")
    .select("first_name, last_name, display_name, phone")
    .eq("user_id", input.userId)
    .maybeSingle();
  const customerName = [customerProfile?.first_name, customerProfile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || customerProfile?.display_name?.trim() || null;
  const customerPhone = customerProfile?.phone?.trim() || null;

  const fulfillmentType: FulfillmentType =
    input.fulfillmentType === "pickup" ? "pickup" : "delivery";
  const fulfillment = await resolveFulfillment(
    input.userId,
    fulfillmentType,
    input.deliveryAddressId,
  );

  if (input.paymentMethod === "cash") {
    if (!business.accepts_cash) throw new Error("Este comercio no acepta efectivo");
    const { data: order, error } = await svc
      .from("orders")
      .insert({
        business_id: business.id,
        customer_user_id: input.userId,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: "pending",
        payment_method: "cash",
        payment_status: "awaiting_payment",
        subtotal_cents: amountCents,
        total_cents: amountCents,
        coupon_id: couponId,
        fulfillment_type: fulfillment.fulfillment_type,
        delivery_address: fulfillment.delivery_address,
      })
      .select("id")
      .single();
    if (error) throw error;

    await svc.from("order_items").insert(orderItemRows(order.id, input.lines));

    const { emitCashOrderNotifications } = await import("@/lib/notifications/emit");
    void emitCashOrderNotifications(order.id);

    return {
      kind: "cash",
      orderId: order.id,
      amountCents,
      subtotalCents,
      discountCents,
    };
  }

  if (input.paymentMethod === "mercadopago_fast") {
    if (!business.mp_ready) {
      throw new Error("Este comercio aún no configuró Mercado Pago. Pedile que vincule desde el panel Pagos.");
    }

    const idempotencyKey = input.idempotencyKey ?? randomUUID();
    const { data: existingSession } = await svc
      .from("payment_sessions")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingSession?.qr_data && existingSession.status === "created" && existingSession.channel === "checkout_pro") {
      return {
        kind: "redirect",
        orderId: existingSession.order_id!,
        paymentSessionId: existingSession.id,
        initPoint: existingSession.qr_data,
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
        customer_name: customerName,
        customer_phone: customerPhone,
        status: "pending",
        payment_method: "mercadopago_fast",
        payment_status: "awaiting_payment",
        subtotal_cents: amountCents,
        total_cents: amountCents,
        coupon_id: couponId,
        fulfillment_type: fulfillment.fulfillment_type,
        delivery_address: fulfillment.delivery_address,
      })
      .select("id")
      .single();
    if (orderErr) throw orderErr;

    await svc.from("order_items").insert(orderItemRows(order.id, input.lines));

    const token = await getAccessTokenForBusiness(business.id);
    const externalRef = `BP-${order.id}`.slice(0, 64);
    const origin = checkoutReturnOrigin(input.returnOrigin);
    const returnConfig = mpCheckoutBackUrls(origin, order.id);

    const preferenceBody: Record<string, unknown> = {
      items: [
        {
          title: `Pedido · ${business.name}`.slice(0, 150),
          quantity: 1,
          unit_price: amountCents / 100,
          currency_id: "ARS",
        },
      ],
      external_reference: externalRef,
    };
    if (returnConfig) {
      preferenceBody.back_urls = returnConfig.back_urls;
      preferenceBody.auto_return = returnConfig.auto_return;
    }

    const preference = await mpFetch<{
      id: string;
      init_point: string;
      sandbox_init_point?: string;
    }>(token, "/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(preferenceBody),
    });

    const initPoint = preference.init_point || preference.sandbox_init_point;
    if (!initPoint) throw new Error("Mercado Pago no devolvió URL de pago");

    const expiresAt = new Date(Date.now() + QR_EXPIRATION_MS).toISOString();
    const { data: session, error: sessErr } = await svc
      .from("payment_sessions")
      .insert({
        order_id: order.id,
        business_id: business.id,
        channel: "checkout_pro",
        mp_order_id: preference.id,
        external_reference: externalRef,
        idempotency_key: idempotencyKey,
        amount_cents: amountCents,
        qr_data: initPoint,
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
      kind: "redirect",
      orderId: order.id,
      paymentSessionId: session.id,
      initPoint,
      expiresAt,
      amountCents,
      subtotalCents,
      discountCents,
    };
  }

  if (!business.mp_ready) {
    throw new Error("Este comercio aún no configuró Mercado Pago. Pedile que vincule desde el panel Pagos.");
  }

  if (input.paymentMethod === "mercadopago_qr" && !paySettings.offerQrPay) {
    throw new Error("Este comercio no ofrece pago con QR en este momento.");
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
      customer_name: customerName,
      customer_phone: customerPhone,
      status: "pending",
      payment_method: "mercadopago_qr",
      payment_status: "awaiting_payment",
      subtotal_cents: amountCents,
      total_cents: amountCents,
      coupon_id: couponId,
      fulfillment_type: fulfillment.fulfillment_type,
      delivery_address: fulfillment.delivery_address,
    })
    .select("id")
    .single();
  if (orderErr) throw orderErr;

  await svc.from("order_items").insert(orderItemRows(order.id, input.lines));

  const token = await getAccessTokenForBusiness(business.id);
  const amountStr = (amountCents / 100).toFixed(2);
  const externalRef = `BP-${order.id}`.slice(0, 64);

  let mpOrder: {
    id: string;
    type_response?: { qr_data?: string };
    transactions?: { payments?: { id?: string }[] };
  };
  try {
    mpOrder = await mpFetch(token, "/v1/orders", {
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
        items: [
          {
            title: `Pedido · ${business.name}`.slice(0, 150),
            unit_price: amountStr,
            quantity: 1,
            unit_measure: "unit",
          },
        ],
      }),
    });
  } catch (err) {
    await svc
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", order.id);
    throw err;
  }

  const qrData = mpOrder.type_response?.qr_data?.trim();
  if (!qrData) {
    await svc
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", order.id);
    throw new Error("Mercado Pago no devolvió qr_data");
  }

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
