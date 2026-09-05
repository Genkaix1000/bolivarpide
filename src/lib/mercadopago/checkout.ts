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
const MAX_LINE_QUANTITY = 99;

export type CheckoutLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  productId: string;
  note?: string;
  optionsDetail?: { label: string; priceCents: number }[];
};

/** Línea con precio verificado contra la DB (products.price_cents + opciones). */
type PricedLine = {
  productId: string;
  quantity: number;
  name: string;
  unitPriceCents: number;
  note?: string;
  optionsDetail?: { label: string; priceCents: number }[];
};

import { packOrderItemNote } from "@/lib/orders/itemOptionsNote";
import { parseMenuOptionGroups } from "@/lib/business/menuOptionTypes";
import { maybeAutoRejectStaleOrder } from "@/lib/orders/acceptanceTimeout";
import { expirePaymentSession, type ExpirableSession } from "@/lib/mercadopago/expire";

export type FulfillmentType = "delivery" | "pickup";

function orderItemRows(orderId: string, lines: PricedLine[]) {
  return lines.map((l) => ({
    order_id: orderId,
    product_id: l.productId,
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
    .select("id, slug, name, mp_ready, accepts_cash, published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data?.published) {
    throw new Error("Este local todavía no está publicado en BolivarPide.");
  }
  return data;
}

/**
 * Recalcula el precio de cada línea de forma server-side: el precio base sale de
 * products.price_cents y las opciones se validan contra el jsonb options del
 * producto. El cliente NO es fuente de verdad para precios (P0 #1).
 */
async function resolvePricedLines(
  businessId: string,
  lines: CheckoutLine[],
): Promise<PricedLine[]> {
  const svc = createServiceClient();
  const priced: PricedLine[] = [];

  for (const line of lines) {
    if (!line.productId?.trim()) {
      throw new Error("Falta el producto de una línea del carrito");
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      throw new Error("Cantidad inválida");
    }

    const { data: product, error: productErr } = await svc
      .from("products")
      .select("id, name, price_cents, options")
      .eq("id", line.productId.trim())
      .eq("business_id", businessId)
      .maybeSingle();
    if (productErr) throw new Error("No se pudo validar el pedido");
    if (!product) {
      throw new Error("Producto no disponible en este local");
    }
    if (typeof product.price_cents !== "number" || product.price_cents < 0) {
      throw new Error("Producto inválido");
    }

    // Opciones: validar cada ítem contra los choices reales del producto.
    const expectedByLabel = new Map<string, number>();
    for (const group of parseMenuOptionGroups(product.options)) {
      for (const choice of group.choices) {
        expectedByLabel.set(choice.label, choice.price_cents);
      }
    }

    let extraCents = 0;
    for (const opt of line.optionsDetail ?? []) {
      if (opt.priceCents < 0) throw new Error("Opción inválida");
      const expected = expectedByLabel.get(opt.label);
      if (expected == null) {
        throw new Error(`Opción desconocida: ${opt.label}`);
      }
      if (opt.priceCents !== expected) {
        throw new Error(`Precio inválido en opción ${opt.label}`);
      }
      extraCents += opt.priceCents;
    }

    const unitPriceCents = product.price_cents + extraCents;
    if (line.unitPriceCents !== unitPriceCents) {
      throw new Error(`Precio desactualizado para ${product.name}. Revisá tu carrito.`);
    }

    priced.push({
      productId: product.id,
      quantity: line.quantity,
      name: product.name,
      unitPriceCents,
      note: line.note,
      optionsDetail: line.optionsDetail,
    });
  }

  return priced;
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

/**
 * P0 #5: reserva atómica de un uso de cupón (RPC con chequeo + incremento en una
 * sola instrucción). Sin esto, `max_uses` no se enforcea nunca (solo se leía
 * uses_count sin escribirlo). Tradeoff asumido: un checkout que reserva y luego
 * aborta quema un uso del cupón.
 */
async function reserveCouponUse(couponId: string | null): Promise<void> {
  if (!couponId) return;
  const svc = createServiceClient();
  const { data: reserved, error } = await svc.rpc("reserve_coupon_use", {
    p_coupon_id: couponId,
  });
  if (error) throw new Error("No se pudo aplicar el cupón");
  if (!reserved) throw new Error("Cupón agotado");
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

  // Los precios se recalculan server-side (P0 #1): el cliente no define montos.
  const pricedLines = await resolvePricedLines(business.id, input.lines);

  const subtotalCents = pricedLines.reduce(
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
    // P0 #5: consumir un uso del cupón al confirmar el checkout.
    await reserveCouponUse(couponId);
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

    // BP-9: Escalera de confianza y anti-spam para efectivo
    const { count: completedOrdersCount } = await svc
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_user_id", input.userId)
      .eq("status", "delivered")
      .eq("payment_status", "paid");

    if ((completedOrdersCount ?? 0) === 0) {
      throw new Error(
        "El pago en efectivo se habilita a partir de tu segunda compra completada en la plataforma.",
      );
    }

    const { data: activeCashOrder } = await svc
      .from("orders")
      .select("id")
      .eq("customer_user_id", input.userId)
      .eq("payment_method", "cash")
      .in("status", ["pending", "accepted", "preparing", "ready_for_pickup", "delivering"])
      .maybeSingle();

    if (activeCashOrder) {
      throw new Error(
        "Ya tenés un pedido en efectivo en curso. Podrás realizar otro cuando se complete la entrega.",
      );
    }

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

    await svc.from("order_items").insert(orderItemRows(order.id, pricedLines));

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

    await svc.from("order_items").insert(orderItemRows(order.id, pricedLines));

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

  await svc.from("order_items").insert(orderItemRows(order.id, pricedLines));

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
      .update({ payment_status: "failed", status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", order.id);
    throw err;
  }

  const qrData = mpOrder.type_response?.qr_data?.trim();
  if (!qrData) {
    await svc
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled", cancelled_at: new Date().toISOString() })
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
  // Lazy expiry (WS4): al consultar, se barren las sesiones vencidas y el
  // timeout de aceptación de 3 min (solo sobre pedidos propios del usuario).
  await maybeAutoRejectStaleOrder(orderId, userId);

  const svc = createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select(
      "id, status, payment_status, payment_method, customer_user_id, active_payment_session_id",
    )
    .eq("id", orderId)
    .single();
  if (!order || order.customer_user_id !== userId) return null;

  let session: (ExpirableSession & Record<string, unknown>) | null = null;
  if (order.active_payment_session_id) {
    const { data: sessionRow } = await svc
      .from("payment_sessions")
      .select("*")
      .eq("id", order.active_payment_session_id)
      .maybeSingle();
    if (sessionRow) {
      if (
        sessionRow.status === "created" &&
        sessionRow.expires_at &&
        new Date(sessionRow.expires_at) <= new Date()
      ) {
        await expirePaymentSession(sessionRow);
        sessionRow.status = "expired";
      }
      session = sessionRow;
    }
  }

  // Serialización acotada: no exponer filas crudas de la DB al cliente.
  return {
    order: {
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
    },
    session: session
      ? {
          id: session.id,
          status: session.status,
          channel: session.channel,
          qr_data: session.qr_data,
          expires_at: session.expires_at,
          amount_cents: session.amount_cents,
        }
      : null,
  };
}
