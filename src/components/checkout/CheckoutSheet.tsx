"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import { FEATURED_CHAINS, type FeaturedChain } from "@/lib/mockData";
import { cartSubtotal, type CartLine } from "@/lib/cart";
import { qrDisplaySrc } from "@/lib/qr-display";
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

type Phase = "pay" | "qr" | "cash_ok" | "paid";

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
  const [method, setMethod] = useState<"mercadopago_qr" | "cash">("mercadopago_qr");
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

  const submit = async () => {
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Iniciá sesión para completar el pedido");
      return;
    }
    if (method === "cash" && !cashAck) {
      setError("Confirmá que entendés el aviso sobre pagos en efectivo");
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
          paymentMethod: method,
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

      setOrderId(j.orderId);
      setQrData(j.qrData);
      setQrSrc(qrDisplaySrc(j.qrData));
      setExpiresAt(j.expiresAt);
      setPhase("qr");
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
    if (phase !== "qr" || !expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, expiresAt]);

  useEffect(() => {
    if (phase !== "qr" || !orderId) return;
    const id = setInterval(() => void pollPaid(), 4000);
    return () => clearInterval(id);
  }, [phase, orderId, pollPaid]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [secondsLeft]);

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
        className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-lg rounded-t-3xl bg-white dark:bg-[#1c1917] shadow-2xl max-h-[92vh] flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
      >
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-[#3d3732] flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {phase === "qr" ? "Pagá con QR" : phase === "paid" ? "¡Listo!" : "Ir a pagar"}
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-gray-400" aria-label="Cerrar">
            <MaterialSymbol icon="close" size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {phase === "pay" && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">{money(sub)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Cupón</span>
                  <span>−{money(discountCents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black">
                <span>Total (sin envío)</span>
                <span className="text-[#9a0002]">{money(total)}</span>
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
                    className="flex-1 rounded-xl border border-gray-200 dark:border-[#3d3732] px-3 py-2 text-sm uppercase"
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

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Método de pago</p>
                <label className="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer border-[#9a0002]/40 bg-[#9a0002]/5">
                  <input
                    type="radio"
                    name="pay"
                    checked={method === "mercadopago_qr"}
                    onChange={() => setMethod("mercadopago_qr")}
                  />
                  <div>
                    <p className="text-sm font-semibold">Mercado Pago (QR)</p>
                    <p className="text-[11px] text-gray-500">Escaneá con la app · comisión presencial</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border cursor-pointer border-gray-200 dark:border-[#3d3732]">
                  <input
                    type="radio"
                    name="pay"
                    checked={method === "cash"}
                    onChange={() => setMethod("cash")}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold">Efectivo al recibir</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      El comercio puede rechazar pedidos en efectivo por motivos de seguridad o disponibilidad.
                    </p>
                    {method === "cash" && (
                      <label className="mt-2 flex items-center gap-2 text-[11px] cursor-pointer">
                        <input type="checkbox" checked={cashAck} onChange={(e) => setCashAck(e.target.checked)} />
                        Entiendo y acepto
                      </label>
                    )}
                  </div>
                </label>
              </div>
            </>
          )}

          {phase === "qr" && qrSrc && (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-gray-600">
                Abrí Mercado Pago (u otra billetera) y escaneá este código
              </p>
              <img src={qrSrc} alt="QR de pago" className="w-[280px] h-[280px] rounded-xl border" />
              <p className={cn("text-2xl font-black tabular", secondsLeft < 60 && "text-amber-600")}>{mmss}</p>
              <p className="text-xs text-gray-400">Total {money(total)} · expira en 15 min</p>
            </div>
          )}

          {phase === "cash_ok" && (
            <div className="text-center py-6 space-y-2">
              <MaterialSymbol icon="check_circle" size={48} className="text-emerald-500 mx-auto" />
              <p className="font-bold">Pedido registrado</p>
              <p className="text-sm text-gray-500">Pagás en efectivo al recibir. El comercio confirmará tu pedido.</p>
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
          {!error && phase === "pay" && (
            <p className="text-[11px] text-gray-400">
              <Link href="/login" className="text-[#9a0002] font-semibold">
                Iniciá sesión
              </Link>{" "}
              si aún no lo hiciste.
            </p>
          )}
        </div>

        {phase === "pay" && (
          <div className="p-5 border-t border-gray-100 dark:border-[#3d3732]">
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="w-full rounded-full bg-[#9a0002] py-3 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
            >
              {loading ? "Procesando…" : method === "cash" ? "Confirmar pedido" : "Generar QR de pago"}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
