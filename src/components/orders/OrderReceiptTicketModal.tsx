"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { OrderTrackingView } from "@/lib/orders/lifecycle";
import { flashToast } from "@/components/FlashToast";

export function OrderReceiptTicketModal({
  view,
  open,
  onClose,
}: {
  view: OrderTrackingView;
  open: boolean;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const totalStr = `$${((view.totalCents ?? 0) / 100).toLocaleString("es-AR")}`;
  const dateFormatted = view.createdAt
    ? new Date(view.createdAt).toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("es-AR");

  function handleShareWhatsApp() {
    const lines = (view.items ?? []).map(
      (i) => `• ${i.quantity}x ${i.name} — $${((i.unitPriceCents * i.quantity) / 100).toLocaleString("es-AR")}`,
    );

    const text = [
      `🧾 *Comprobante de Pedido — BolívarPide*`,
      `🏬 *Local:* ${view.businessName}`,
      `📦 *Pedido #:* ${view.orderNumber}`,
      `📅 *Fecha:* ${dateFormatted}`,
      ``,
      `*Detalle:*`,
      ...lines,
      ``,
      `💰 *Total:* ${totalStr}`,
      view.paymentMethod === "cash" ? `💵 *Pago:* Efectivo en mano` : `💳 *Pago:* Mercado Pago (Acreditado)`,
      view.notes ? `📝 *Nota:* ${view.notes}` : "",
      ``,
      `Seguí tu pedido en vivo: ${typeof window !== "undefined" ? window.location.href : ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  async function handleSaveOrShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Pedido #${view.orderNumber} - ${view.businessName}`,
          text: `Ticket de compra en ${view.businessName} por ${totalStr} en BolívarPide.`,
          url: window.location.href,
        });
        return;
      } catch {
        /* fallback to print/toast */
      }
    }

    setDownloading(true);
    try {
      window.print();
      flashToast("Listo para guardar o imprimir el comprobante.");
    } catch {
      flashToast("Copia los datos de tu pedido.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Ticket Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] bg-[#faf6f1] dark:bg-[#1a1715] shadow-2xl border border-black/10 dark:border-white/10"
        >
          {/* Header Close */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9a0002]">
              <MaterialSymbol icon="receipt_long" size={16} />
              <span>Ticket Digital</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-gray-500 dark:text-gray-300 transition-colors"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          </div>

          {/* Ticket Body with Perforation effect */}
          <div className="px-5 py-3">
            {/* Store & Order Number */}
            <div className="text-center pb-4 border-b border-dashed border-stone-300 dark:border-stone-700">
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                {view.businessName}
              </h3>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                Pedido #{view.orderNumber} · {dateFormatted}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#f0e8dc] dark:bg-[#28231f] px-3 py-1 text-[11px] font-bold text-[#9a0002] dark:text-[#f87171]">
                <MaterialSymbol icon="verified" size={13} fill />
                <span>{view.statusTitle}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-4 space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
              {view.items && view.items.length > 0 ? (
                view.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {item.quantity}× {item.name}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                          Nota: {item.note}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 shrink-0">
                      ${((item.unitPriceCents * item.quantity) / 100).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Detalle del pedido</p>
              )}
            </div>

            {/* Totals & Notes */}
            <div className="pt-3 border-t border-dashed border-stone-300 dark:border-stone-700 space-y-1.5">
              {view.notes && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Aclaraciones:</span> {view.notes}
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="font-bold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-base font-black text-[#9a0002] dark:text-red-400">{totalStr}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>Método de pago:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {view.paymentMethod === "cash" ? "Efectivo 💵" : "Mercado Pago ✅"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons in Footer */}
          <div className="p-4 bg-[#f3ece2] dark:bg-[#201c19] border-t border-stone-200 dark:border-stone-800 flex gap-2.5">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-3 text-xs font-bold shadow-md shadow-green-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleSaveOrShare}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#9a0002] hover:bg-[#800002] text-white py-2.5 px-3 text-xs font-bold shadow-md shadow-[#9a0002]/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MaterialSymbol icon="download" size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
