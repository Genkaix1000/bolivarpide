"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import { FEATURED_CHAINS, type FeaturedChain } from "@/lib/mockData";
import { cartSubtotal, type CartLine } from "@/lib/cart";
import { qrDisplaySrc } from "@/lib/qr-display";
import { openWalletPay } from "@/lib/payments/walletDeepLinks";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  }));
}

type PayMethod = "mercadopago" | "wallet_qr" | "cash";
type Phase = "pay" | "wallet_pick" | "mp_wait" | "qr_display" | "cash_ok" | "paid";

const PAY_OPTIONS: { id: PayMethod; label: string; icon: string }[] = [
  { id: "mercadopago", label: "Mercado Pago", icon: "account_balance_wallet" },
  { id: "wallet_qr", label: "QR / otra billetera", icon: "qr_code_2" },
  { id: "cash", label: "Efectivo al recibir", icon: "payments" },
];

export function CheckoutSheet({
  chain,
  onClose,
}: {
  chain: FeaturedChain;
  onClose: () => void;
}) {
  const { cart, clear } = useCart();
  const sub = cartSubtotal(cart.lines);
  const subtotalCents = Math.round(sub * 100);

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>("mercadopago");
  const [cashAck, setCashAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pay");
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const totalCents = subtotalCents - discountCents;
  const total = totalCents / 100;

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

  const afterQrOrder = (j: { qrData: string; expiresAt: string; orderId: string }, payMethod: PayMethod) => {
    setOrderId(j.orderId);
    setQrData(j.qrData);
    setQrSrc(qrDisplaySrc(j.qrData));
    setExpiresAt(j.expiresAt);
    if (payMethod === "mercadopago") {
      setPhase("mp_wait");
      openWalletPay("mercadopago", j.qrData);
    } else {
      setPhase("wallet_pick");
    }
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
    if (method === "cash" && !cashAck) {
      setError("Marca la casilla para confirmar efectivo");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: chain.id,
          lines: linesToPayload(cart.lines),
          paymentMethod: method === "cash" ? "cash" : "mercadopago_qr",
          couponCode: discountCents > 0 ? couponCode.trim() : undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Error al pagar");

      if (j.kind === "cash") {
        setOrderId(j.orderId);
        setPhase("cash_ok");
        clear();
        return;
      }

      afterQrOrder(j, method);
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
    }
  }, [orderId, clear]);

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
    if (phase === "mp_wait" || phase === "qr_display" || phase === "wallet_pick") {
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
    phase === "mp_wait"
      ? "Mercado Pago"
      : phase === "wallet_pick"
        ? "Elegí billetera"
        : phase === "qr_display"
          ? "Código QR"
          : phase === "paid"
            ? "¡Listo!"
            : phase === "cash_ok"
              ? "Pedido listo"
              : "Ir a pagar";

  const submitLabel =
    method === "cash"
      ? "Confirmar pedido"
      : method === "mercadopago"
        ? "Pagar con Mercado Pago"
        : "Continuar";

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
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400"
            aria-label="Cerrar"
          >
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
                <div className="flex justify-between text-[15px] font-bold pt-1 border-t border-[#f0ebe4] dark:border-[#2a2623]">
                  <span>Total</span>
                  <span className="text-[#9a0002]">{money(total)}</span>
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

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Pago</p>
                {PAY_OPTIONS.map((opt) => {
                  const active = method === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                        active
                          ? "border-[#9a0002]/45 bg-[#9a0002]/5"
                          : "border-[#e8e0d6] bg-white dark:border-[#3d3732] dark:bg-[#231f1c]",
                      )}
                    >
                      <input
                        type="radio"
                        name="pay"
                        checked={active}
                        onChange={() => {
                          setMethod(opt.id);
                          if (opt.id !== "cash") setCashAck(false);
                        }}
                        className="shrink-0"
                      />
                      <MaterialSymbol
                        icon={opt.icon}
                        size={20}
                        className={cn(active ? "text-[#9a0002]" : "text-stone-400")}
                      />
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
                {method === "cash" && (
                  <label
                    className="flex items-start gap-2.5 rounded-xl border border-[#e8e0d6] bg-white px-3 py-2.5 cursor-pointer dark:border-[#3d3732] dark:bg-[#231f1c]"
                  >
                    <input
                      type="checkbox"
                      checked={cashAck}
                      onChange={(e) => setCashAck(e.target.checked)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] leading-snug text-stone-600 dark:text-stone-400">
                      Acepto que el comercio puede rechazar pedidos en efectivo por motivos de
                      seguridad o disponibilidad.
                    </span>
                  </label>
                )}
              </div>
            </>
          )}

          {phase === "mp_wait" && qrData && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00bcff]/10">
                <MaterialSymbol icon="account_balance_wallet" size={32} className="text-[#009ee3]" />
              </div>
              <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                Abrí Mercado Pago para completar el pago
              </p>
              <p className="text-[12px] text-gray-500">
                Total {money(total)} · {mmss}
              </p>
              <button
                type="button"
                onClick={() => openWalletPay("mercadopago", qrData)}
                className="w-full rounded-full bg-[#009ee3] py-3 text-[13px] font-bold text-white cursor-pointer"
              >
                Abrir Mercado Pago
              </button>
              <button
                type="button"
                onClick={() => setPhase("wallet_pick")}
                className="text-[12px] font-semibold text-[#9a0002] cursor-pointer"
              >
                Usar otra billetera
              </button>
            </div>
          )}

          {phase === "wallet_pick" && qrData && (
            <div className="space-y-3">
              <p className="text-[13px] text-gray-600 dark:text-gray-300 text-center">
                Pagá {money(total)} desde tu billetera
              </p>
              <button
                type="button"
                onClick={() => openWalletPay("modo", qrData)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#e8e0d6] bg-white px-4 py-3 cursor-pointer dark:border-[#3d3732] dark:bg-[#231f1c]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#008859]/10 text-[#008859] font-bold text-sm">
                  M
                </span>
                <span className="text-[13px] font-semibold">MODO</span>
                <MaterialSymbol icon="open_in_new" size={18} className="ml-auto text-stone-400" />
              </button>
              <button
                type="button"
                onClick={() => openWalletPay("mercadopago", qrData)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#e8e0d6] bg-white px-4 py-3 cursor-pointer dark:border-[#3d3732] dark:bg-[#231f1c]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#009ee3]/10">
                  <MaterialSymbol icon="account_balance_wallet" size={22} className="text-[#009ee3]" />
                </span>
                <span className="text-[13px] font-semibold">Mercado Pago</span>
                <MaterialSymbol icon="open_in_new" size={18} className="ml-auto text-stone-400" />
              </button>
              <button
                type="button"
                onClick={() => setPhase("qr_display")}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#e8e0d6] px-4 py-3 cursor-pointer dark:border-[#3d3732]"
              >
                <MaterialSymbol icon="qr_code_2" size={22} className="text-stone-500" />
                <span className="text-[13px] font-semibold">Ver código QR</span>
              </button>
              <p className={cn("text-center text-2xl font-bold tabular", secondsLeft < 60 && "text-amber-600")}>
                {mmss}
              </p>
            </div>
          )}

          {phase === "qr_display" && qrSrc && (
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={qrSrc} alt="QR de pago" className="w-[260px] h-[260px] rounded-xl border border-[#e8e0d6]" />
              <p className={cn("text-2xl font-bold tabular", secondsLeft < 60 && "text-amber-600")}>{mmss}</p>
              <p className="text-[12px] text-gray-500">Total {money(total)}</p>
              <button
                type="button"
                onClick={() => setPhase("wallet_pick")}
                className="text-[12px] font-semibold text-[#9a0002] cursor-pointer"
              >
                Abrir billetera
              </button>
            </div>
          )}

          {phase === "cash_ok" && (
            <div className="text-center py-6 space-y-2">
              <MaterialSymbol icon="check_circle" size={48} className="text-emerald-500 mx-auto" />
              <p className="font-bold">Pedido registrado</p>
              <p className="text-sm text-gray-500">Pagás en efectivo al recibir.</p>
            </div>
          )}

          {phase === "paid" && (
            <div className="text-center py-6 space-y-2">
              <MaterialSymbol icon="celebration" size={48} className="text-[#9a0002] mx-auto" />
              <p className="font-bold">Pago confirmado</p>
              <p className="text-sm text-gray-500">Tu pedido fue recibido.</p>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {phase === "pay" && (
          <div className="border-t border-[#e8e0d6] p-5 dark:border-[#3d3732]">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="w-full rounded-full bg-[#9a0002] py-3.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer shadow-md shadow-[#9a0002]/20"
            >
              {loading ? "Procesando…" : submitLabel}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
