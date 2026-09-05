"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { LogoutNavRail } from "@/components/shared/LogoutNavRail";
import { FieldHint } from "@/components/ui/FieldHint";
import { useCart } from "@/components/CartProvider";
import { type FeaturedChain } from "@/lib/business/types";
import { cartSubtotal, type CartLine } from "@/lib/cart";
import { qrDisplaySrc } from "@/lib/qr-display";
import {
  checkoutAmountCents,
  fastPaySurchargeCents,
  qrDiscountCents,
  type PayChannel,
} from "@/lib/payments/pricing";
import type { PendingCustomerOrder } from "@/lib/orders/pending";
import { createClient } from "@/lib/supabase/client";
import { cn, safeRandomUUID } from "@/lib/utils";
import { listUserAddressesAction } from "@/lib/addresses/actions";
import { formatAddressLabel } from "@/lib/addresses/display";
import type { UserAddress } from "@/lib/addresses/types";

const OPEN_ADDRESS_EVENT = "bolivarpide:open-address";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function linesToPayload(lines: CartLine[]) {
  return lines.map((l) => ({
    name: l.name,
    quantity: l.qty,
    unitPriceCents: Math.round(l.unitPrice * 100),
    productId: l.productId,
    note: l.note,
    optionsDetail: l.optionsDetail,
  }));
}

type PayMethod = PayChannel;
type Phase = "pay" | "qr_display" | "redirect_resume" | "cash_ok" | "paid";

type CheckoutOptions = {
  mpReady: boolean;
  acceptsCash: boolean;
  offerQrPay: boolean;
  absorbFastPayFee: boolean;
  canPayCash?: boolean;
  cashDisabledReason?: string | null;
  completedOrdersCount?: number;
};

export function CheckoutSheet({
  chain,
  onClose,
  resumePending,
  pendingOrder,
  onPendingChange,
}: {
  chain: FeaturedChain;
  onClose: () => void;
  resumePending?: boolean;
  pendingOrder: PendingCustomerOrder | null;
  onPendingChange: (order: PendingCustomerOrder | null) => void;
}) {
  const { cart, clear, refreshPendingOrder, refreshActiveOrder, scheduleOrderCancel } = useCart();
  const sub = cartSubtotal(cart.lines);
  const subtotalCents = Math.round(sub * 100);

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>("fast_pay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pay");
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [chargeCents, setChargeCents] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [initPoint, setInitPoint] = useState<string | null>(null);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const cancelFooterRef = useRef<HTMLDivElement>(null);
  const [pickupLocal, setPickupLocal] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const list = await listUserAddressesAction();
      setAddresses(list);
      setSelectedAddressId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null;
      });
    } catch {
      setAddresses([]);
      setSelectedAddressId(null);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadAddresses());
  }, [loadAddresses]);

  useEffect(() => {
    const onFocus = () => void loadAddresses();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadAddresses]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const needsAddress = !pickupLocal && !selectedAddressId;

  const applyPending = useCallback((po: PendingCustomerOrder) => {
    setOrderId(po.orderId);
    setChargeCents(po.amountCents);
    if (po.paymentMethod === "cash") {
      setPhase("cash_ok");
      return;
    }
    if (po.channel === "checkout_pro" && po.qrData) {
      setInitPoint(po.qrData);
      setExpiresAt(po.expiresAt);
      setPhase("redirect_resume");
      return;
    }
    if (po.qrData) {
      setQrSrc(qrDisplaySrc(po.qrData));
      setExpiresAt(po.expiresAt);
      setPhase("qr_display");
    }
  }, []);

  useEffect(() => {
    if (!resumePending || !pendingOrder || pendingOrder.businessSlug !== chain.id) return;
    queueMicrotask(() => applyPending(pendingOrder));
  }, [resumePending, pendingOrder, chain.id, applyPending]);

  const baseCents = subtotalCents - discountCents;

  const payAmountCents = useMemo(() => {
    if (!options) return baseCents;
    return checkoutAmountCents(baseCents, method, options.absorbFastPayFee);
  }, [baseCents, method, options]);

  const payTotal = payAmountCents / 100;
  const fastSurcharge = fastPaySurchargeCents(baseCents) / 100;
  const qrSaving = qrDiscountCents(baseCents) / 100;

  useEffect(() => {
    fetch(`/api/payments/checkout-options?businessSlug=${encodeURIComponent(chain.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: CheckoutOptions | null) => {
        if (!j) return;
        setOptions(j);
        if (j.mpReady) setMethod("fast_pay");
        else if (j.offerQrPay) setMethod("qr");
        else if (j.acceptsCash) setMethod("cash");
      })
      .catch(() => {});
  }, [chain.id]);

  const payOptions = useMemo(() => {
    if (!options) return [];
    const out: {
      id: PayMethod;
      label: string;
      subtitle?: string;
      icon: string;
      badge?: { text: string; tone: "free" | "extra" | "save" };
      disabled?: boolean;
      disabledReason?: string;
    }[] = [];
    if (options.mpReady) {
      out.push({
        id: "fast_pay",
        label: "Pagar online / Transferencia",
        subtitle: "Débito, crédito o dinero en cuenta con Mercado Pago",
        icon: "bolt",
      });
    }
    if (options.offerQrPay) {
      out.push({
        id: "qr",
        label: "Pagar con QR",
        icon: "qr_code_2",
        badge: { text: `Ahorrá ${money(qrSaving)}`, tone: "save" },
      });
    }
    if (options.acceptsCash) {
      const isCashAllowed = options.canPayCash ?? false;
      out.push({
        id: "cash",
        label: "Pago en efectivo",
        subtitle: "Abonás contra entrega al recibir el pedido",
        icon: "payments",
        disabled: !isCashAllowed,
        disabledReason: options.cashDisabledReason ?? "No disponible temporalmente",
      });
    }
    return out;
  }, [options, qrSaving]);

  useEffect(() => {
    if (!payOptions.length) return;
    const available = payOptions.filter((o) => !o.disabled);
    if (available.length > 0 && !available.some((o) => o.id === method)) {
      queueMicrotask(() => setMethod(available[0].id));
    }
  }, [payOptions, method]);

  const canSubmit =
    payOptions.length > 0 && !needsAddress && !(method === "cash" && !options?.canPayCash);

  const applyCoupon = async () => {
    setCouponError(null);
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug: chain.id,
        code: couponCode.trim(),
        subtotalCents,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setCouponError(j.error ?? "Cupón inválido");
      setDiscountCents(0);
      return;
    }
    setDiscountCents(j.discountCents);
    setCouponOpen(false);
  };

  const submit = async () => {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const params = new URLSearchParams(window.location.search);
      params.set("openCheckout", "1");
      const returnPath =
        window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.location.assign(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (method === "cash" && !options?.canPayCash) {
      setError(options?.cashDisabledReason ?? "El pago en efectivo no está disponible");
      return;
    }
    if (!pickupLocal && !selectedAddressId) {
      setError("Agregá una dirección de entrega para continuar");
      return;
    }

    setLoading(true);
    try {
      const paymentMethod =
        method === "cash" ? "cash" : method === "fast_pay" ? "mercadopago_fast" : "mercadopago_qr";

      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: chain.id,
          lines: linesToPayload(cart.lines),
          paymentMethod,
          couponCode: discountCents > 0 ? couponCode.trim() : undefined,
          idempotencyKey: safeRandomUUID(),
          fulfillmentType: pickupLocal ? "pickup" : "delivery",
          deliveryAddressId: pickupLocal ? undefined : selectedAddressId ?? undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Error al pagar");

      if (j.kind === "cash") {
        setOrderId(j.orderId);
        setPhase("cash_ok");
        clear();
        onPendingChange(null);
        void refreshActiveOrder();
        return;
      }

      if (j.kind === "redirect") {
        clear();
        onPendingChange({
          orderId: j.orderId,
          businessSlug: chain.id,
          businessName: chain.name,
          amountCents: j.amountCents,
          paymentMethod: "mercadopago_fast",
          channel: "checkout_pro",
          qrData: j.initPoint,
          expiresAt: j.expiresAt,
        });
        window.location.assign(j.initPoint);
        return;
      }

      setOrderId(j.orderId);
      setQrSrc(qrDisplaySrc(j.qrData));
      setExpiresAt(j.expiresAt);
      setChargeCents(j.amountCents);
      setPhase("qr_display");
      clear();
      onPendingChange({
        orderId: j.orderId,
        businessSlug: chain.id,
        businessName: chain.name,
        amountCents: j.amountCents,
        paymentMethod: "mercadopago_qr",
        channel: "qr_dynamic",
        qrData: j.qrData,
        expiresAt: j.expiresAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const pollPaid = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}/payment/status`);
    if (!res.ok) return;
    const j = await res.json();
    if (j.order?.payment_status === "paid") {
      setPhase("paid");
      clear();
      onPendingChange(null);
      void refreshPendingOrder();
      void refreshActiveOrder();
    }
  }, [orderId, clear, onPendingChange, refreshPendingOrder, refreshActiveOrder]);

  useEffect(() => {
    if (!expiresAt || phase === "pay" || phase === "cash_ok" || phase === "paid") return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, expiresAt]);

  useEffect(() => {
    if (phase === "qr_display" || phase === "redirect_resume") {
      const id = setInterval(() => void pollPaid(), 4000);
      return () => clearInterval(id);
    }
  }, [phase, pollPaid]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [secondsLeft]);

  const title =
    phase === "qr_display"
      ? "Código QR"
      : phase === "redirect_resume"
        ? "Pago pendiente"
      : phase === "paid"
        ? "¡Listo!"
        : phase === "cash_ok"
          ? "Pedido listo"
          : "Ir a pagar";

  const adjustmentLabel = method === "qr" ? "Descuento QR" : null;
  const adjustmentAmount = method === "qr" ? -qrSaving : 0;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Cerrar"
        className="fixed inset-0 z-[80] bg-black/45 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal
        className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-lg rounded-t-3xl bg-[#faf6f1] dark:bg-[#1c1917] shadow-2xl max-h-[92vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
      >
        <div className="flex items-center justify-between border-b border-[#e8e0d6] px-5 pt-5 pb-3 dark:border-[#3d3732]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-gray-400" aria-label="Cerrar">
            <MaterialSymbol icon="close" size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {phase === "pay" && (
            <>
              <div className="rounded-2xl border border-[#e8e0d6] bg-white px-4 py-3 dark:border-[#3d3732] dark:bg-[#231f1c] space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{money(sub)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-[13px] text-emerald-600">
                    <span>Cupón</span>
                    <span>−{money(discountCents / 100)}</span>
                  </div>
                )}
                {adjustmentLabel && adjustmentAmount !== 0 && (
                  <div
                    className={cn(
                      "flex justify-between text-[13px]",
                      adjustmentAmount > 0 ? "text-amber-700" : "text-emerald-600",
                    )}
                  >
                    <span>{adjustmentLabel}</span>
                    <span>
                      {adjustmentAmount > 0 ? "+" : "−"}
                      {money(Math.abs(adjustmentAmount))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] font-bold pt-1 border-t border-[#f0ebe4] dark:border-[#2a2623]">
                  <span>Total a pagar</span>
                  <span className="text-[#9a0002]">{money(payTotal)}</span>
                </div>
              </div>

              {!couponOpen ? (
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="text-[12px] font-semibold text-[#9a0002] cursor-pointer flex items-center gap-1"
                >
                  <MaterialSymbol icon="sell" size={16} />
                  ¿Tenés un cupón?
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Código"
                    className="flex-1 rounded-xl border border-[#e8e0d6] dark:border-[#3d3732] bg-white dark:bg-[#231f1c] px-3 py-2 text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => void applyCoupon()}
                    className="px-3 rounded-full bg-[#9a0002] text-white text-xs font-bold cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-600">{couponError}</p>}

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Método de pago</p>
                {payOptions.map((opt) => {
                  const active = method === opt.id && !opt.disabled;
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                        opt.disabled
                          ? "border-[#e8e0d6]/70 bg-stone-100/60 dark:border-[#3d3732]/70 dark:bg-[#201d1a]/50 opacity-75 cursor-not-allowed select-none"
                          : "cursor-pointer",
                        active
                          ? "border-[#9a0002]/45 bg-[#9a0002]/5"
                          : !opt.disabled && "border-[#e8e0d6] bg-white dark:border-[#3d3732] dark:bg-[#231f1c]",
                      )}
                    >
                      <input
                        type="radio"
                        name="pay"
                        disabled={opt.disabled}
                        checked={active}
                        onChange={() => {
                          if (!opt.disabled) setMethod(opt.id);
                        }}
                        className="mt-1 shrink-0"
                      />
                      <MaterialSymbol
                        icon={opt.icon}
                        size={22}
                        className={cn(
                          "mt-0.5 shrink-0",
                          active
                            ? "text-[#9a0002]"
                            : opt.disabled
                              ? "text-stone-300 dark:text-stone-600"
                              : "text-stone-400",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-[13px] font-semibold",
                              opt.disabled
                                ? "text-stone-500 dark:text-stone-400"
                                : "text-gray-900 dark:text-gray-100",
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.disabled && opt.disabledReason && (
                            <FieldHint text={opt.disabledReason} title="Seguridad" />
                          )}
                        </div>
                        {opt.subtitle && (
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{opt.subtitle}</p>
                        )}
                      </div>
                      {opt.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                            opt.badge.tone === "free" && "bg-emerald-100 text-emerald-700",
                            opt.badge.tone === "extra" && "bg-amber-100 text-amber-800",
                            opt.badge.tone === "save" && "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {opt.badge.text}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="space-y-2 rounded-xl border border-[#e8e0d6] bg-[#faf8f5] px-3 py-2.5 dark:border-[#3d3732] dark:bg-[#231f1c]/60">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickupLocal}
                    onChange={(e) => {
                      setPickupLocal(e.target.checked);
                      setError(null);
                    }}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                      Retiro en local
                    </span>
                    <p className="text-[11px] text-stone-500">Pasás a buscar el pedido al comercio</p>
                  </div>
                  <MaterialSymbol icon="storefront" size={20} className="shrink-0 text-stone-400" />
                </label>

                {!pickupLocal && (
                  <div className="border-t border-dashed border-[#e8e0d6] pt-2 dark:border-[#3d3732]">
                    {addressesLoading ? (
                      <p className="text-[11px] text-stone-400">Cargando dirección…</p>
                    ) : selectedAddress ? (
                      <div className="flex items-start gap-2">
                        <MaterialSymbol icon="location_on" size={18} className="mt-0.5 shrink-0 text-[#9a0002]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                            Enviar a
                          </p>
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                            {formatAddressLabel(selectedAddress)}
                            {selectedAddress.city ? `, ${selectedAddress.city}` : ""}
                          </p>
                          {addresses.length > 1 ? (
                            <select
                              value={selectedAddressId ?? ""}
                              onChange={(e) => setSelectedAddressId(e.target.value || null)}
                              className="mt-1 w-full rounded-lg border border-[#e8e0d6] bg-white px-2 py-1 text-[11px] dark:border-[#3d3732] dark:bg-[#231f1c]"
                            >
                              {addresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {formatAddressLabel(a)}
                                  {a.city ? `, ${a.city}` : ""}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <MaterialSymbol icon="location_off" size={18} className="mt-0.5 shrink-0 text-amber-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                            Sin dirección de entrega
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Agregá una dirección para que te enviemos el pedido.
                          </p>
                          <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ADDRESS_EVENT))}
                            className="mt-1 text-[11px] font-bold text-[#9a0002] cursor-pointer"
                          >
                            Agregar dirección
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {phase === "redirect_resume" && initPoint && (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <MaterialSymbol icon="account_balance_wallet" size={48} className="text-[#9a0002]" />
              <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
                Pagá {money((chargeCents || payAmountCents) / 100)}
              </p>
              <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">
                Tu pedido está guardado. Continuá en Mercado Pago para completar el pago.
              </p>
              {expiresAt && (
                <p className={cn("text-lg font-bold tabular", secondsLeft < 60 && "text-amber-600")}>{mmss}</p>
              )}
              <button
                type="button"
                onClick={() => window.location.assign(initPoint)}
                className="w-full rounded-full bg-[#9a0002] py-3.5 text-sm font-bold text-white cursor-pointer"
              >
                Continuar en Mercado Pago
              </button>
            </div>
          )}

          {phase === "qr_display" && qrSrc && (
            <div className="flex flex-col items-center gap-3 text-center">
              <img
                src={qrSrc}
                alt="QR de pago"
                className="w-[260px] h-[260px] rounded-xl border border-[#e8e0d6]"
              />
              <p className={cn("text-2xl font-bold tabular", secondsLeft < 60 && "text-amber-600")}>{mmss}</p>
              <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
                Pagá {money((chargeCents || payAmountCents) / 100)}
              </p>
              <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">
                Abrí Mercado Pago u otra billetera y escaneá este código.
              </p>
            </div>
          )}

          {phase === "cash_ok" && (
            <div className="text-center py-6 space-y-2">
              <MaterialSymbol icon="check_circle" size={48} className="text-emerald-500 mx-auto" />
              <p className="font-bold">Pedido registrado</p>
              <p className="text-sm text-gray-500">Pagás en efectivo al recibir.</p>
              {orderId ? (
                <Link
                  href={`/pedido/${orderId}`}
                  className="inline-block mt-3 rounded-full bg-[#9a0002] px-5 py-2 text-sm font-bold text-white"
                >
                  Seguir pedido
                </Link>
              ) : null}
            </div>
          )}

          {phase === "paid" && (
            <div className="text-center py-6 space-y-2">
              <MaterialSymbol icon="celebration" size={48} className="text-[#9a0002] mx-auto" />
              <p className="font-bold">Pago confirmado</p>
              <p className="text-sm text-gray-500">Tu pedido fue recibido.</p>
              {orderId ? (
                <Link
                  href={`/pedido/${orderId}`}
                  className="inline-block mt-3 rounded-full bg-[#9a0002] px-5 py-2 text-sm font-bold text-white"
                >
                  Seguir pedido
                </Link>
              ) : null}
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {phase === "pay" && (
          <div className="border-t border-[#e8e0d6] p-5 dark:border-[#3d3732]">
            <button
              type="button"
              disabled={loading || !canSubmit}
              onClick={() => void submit()}
              className="w-full rounded-full bg-[#9a0002] py-3.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer shadow-md shadow-[#9a0002]/20"
            >
              {loading
                ? "Procesando…"
                : method === "cash"
                  ? `Confirmar en efectivo · ${money(payTotal)}`
                  : `Pagar con Mercado Pago · ${money(payTotal)}`}
            </button>
          </div>
        )}

        {(phase === "qr_display" || phase === "redirect_resume" || phase === "cash_ok") &&
          (orderId ?? pendingOrder?.orderId) && (
            <div
              ref={cancelFooterRef}
              className={cn(
                "shrink-0 border-t px-5 py-4 transition-colors duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                cancelConfirm ? "border-white/20 bg-[#9a0002]" : "border-[#e8e0d6] dark:border-[#3d3732]",
              )}
            >
              {cancelConfirm ? (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-white">¿Cancelar pedido?</p>
                    <p className="text-[11px] text-white/75">Podés deshacerlo después</p>
                  </div>
                  <LogoutNavRail
                    confirm
                    onAccent
                    boundaryRef={cancelFooterRef}
                    onAsk={() => {}}
                    onCancel={() => setCancelConfirm(false)}
                    onConfirm={() => {
                      const id = orderId ?? pendingOrder?.orderId;
                      if (!id) return;
                      setCancelConfirm(false);
                      onPendingChange(null);
                      scheduleOrderCancel(id);
                      onClose();
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCancelConfirm(true)}
                  className="w-full py-1 text-sm font-semibold text-stone-500 hover:text-[#9a0002] cursor-pointer"
                >
                  Cancelar pedido
                </button>
              )}
            </div>
          )}
      </motion.div>
    </>
  );
}
