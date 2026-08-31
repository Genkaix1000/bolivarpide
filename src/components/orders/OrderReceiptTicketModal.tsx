"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ComandaTicketVisual } from "@/components/orders/ComandaTicketVisual";
import { flashToast } from "@/components/FlashToast";
import { shareComandaJpeg } from "@/lib/orders/comandaImage";
import type { OrderTrackingView } from "@/lib/orders/lifecycle";

export function OrderReceiptTicketModal({
  view,
  open,
  onClose,
}: {
  view: OrderTrackingView;
  open: boolean;
  onClose: () => void;
}) {
  const ticketRef = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const createdAt = view.createdAt ?? new Date().toISOString();
  const ticketData = {
    orderNumber: view.orderNumber,
    status: view.status,
    nameLine: view.businessName,
    nameIcon: "store" as const,
    fulfillmentType: view.map?.fulfillmentType,
    deliveryAddress: view.map?.destination?.label ?? null,
    items: view.items ?? [],
    totalCents: view.totalCents ?? 0,
    paymentMethod: view.paymentMethod ?? null,
    paymentStatus: view.paymentStatus,
    createdAt,
    rejectionReason: view.rejectionReason,
  };

  async function captureAndShare(mode: "whatsapp" | "save") {
    if (!ticketRef.current || busy) return;
    setBusy(true);
    try {
      const result = await shareComandaJpeg(ticketRef.current, view.orderNumber);
      if (result === "cancelled") return;
      if (mode === "whatsapp") {
        if (result === "shared") {
          flashToast("Elegí WhatsApp para enviar la comanda.");
        } else {
          flashToast("Imagen guardada — adjuntala en WhatsApp.");
          window.open("https://api.whatsapp.com/", "_blank");
        }
      } else if (result === "shared") {
        flashToast("Comanda compartida.");
      } else {
        flashToast("Comanda guardada en tu dispositivo.");
      }
    } catch (err) {
      console.error("shareComandaJpeg failed", err);
      flashToast("No pudimos generar la imagen. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          aria-label="Cerrar"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md px-4 pb-8 pt-3 sm:pb-4"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Tu comanda</p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-black/5 hover:text-stone-600"
              aria-label="Cerrar"
            >
              <MaterialSymbol icon="close" size={18} />
            </button>
          </div>

          <div className="flex justify-center">
            <ComandaTicketVisual innerRef={ticketRef} data={ticketData} variant="body" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => captureAndShare("whatsapp")}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700 hover:border-[#25D366]/40 hover:text-[#128C7E] disabled:opacity-50"
            >
              <MaterialSymbol icon="share" size={16} />
              WhatsApp
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => captureAndShare("save")}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700 hover:border-[#9a0002]/30 hover:text-[#9a0002] disabled:opacity-50"
            >
              <MaterialSymbol icon="download" size={16} />
              Guardar imagen
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
