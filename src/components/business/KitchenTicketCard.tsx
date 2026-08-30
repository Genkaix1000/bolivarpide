"use client";

import { useState, useTransition } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { advanceOrderStatus } from "@/lib/orders/actions";
import { stubLabel, type KitchenOrderTicket, type OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { cn } from "@/lib/utils";
import { PinConfirmInput } from "./PinConfirmInput";
import { RejectOrderModal } from "./RejectOrderModal";

const STATUS_LABEL: Record<OrderLifecycleStatus, string> = {
  pending: "Pendiente",
  preparing: "En cocina",
  delivering: "En reparto",
  delivered: "Entregado",
  rejected: "Rechazado",
};

/** Color del talón derecho según etapa */
const STUB_ACCENT: Record<OrderLifecycleStatus, string> = {
  pending: "bg-[#9a0002]",
  preparing: "bg-amber-600",
  delivering: "bg-[#1a1210]",
  delivered: "bg-stone-400",
  rejected: "bg-stone-500",
};

const BADGE_ACCENT: Record<OrderLifecycleStatus, string> = {
  pending: "bg-[#9a0002]/10 text-[#9a0002]",
  preparing: "bg-amber-100 text-amber-800",
  delivering: "bg-stone-800/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200",
  delivered: "bg-stone-100 text-stone-600",
  rejected: "bg-red-100 text-red-700",
};

function paymentLabel(method: string | null) {
  if (method === "cash") return "Efectivo";
  if (method === "mercadopago_fast") return "Mercado Pago";
  if (method === "mercadopago_qr") return "QR MP";
  return "—";
}

/** Borde festoneado tipo ticket (referencia mockup horizontal) */
const SCALLOP =
  "radial-gradient(circle at 0 50%, transparent 5px, #000 5px) repeat-y left / 10px 14px";

function BarcodeDecor({ orderNumber }: { orderNumber: number }) {
  const seed = orderNumber % 97;
  return (
    <div className="flex h-14 items-end justify-center gap-[3px] opacity-90" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm bg-white/90"
          style={{ height: `${12 + ((seed + i * 7) % 5) * 6}px` }}
        />
      ))}
    </div>
  );
}

export function KitchenTicketCard({
  ticket,
  businessId,
  onUpdated,
}: {
  ticket: KitchenOrderTicket;
  businessId: string;
  onUpdated?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [pinOpen, setPinOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forwardTarget =
    ticket.status === "pending"
      ? "preparing"
      : ticket.status === "preparing"
        ? "delivering"
        : ticket.status === "delivering"
          ? "delivered"
          : null;

  const stub = stubLabel(ticket.status);
  const terminal = ticket.status === "delivered" || ticket.status === "rejected";

  function runAdvance(target: OrderLifecycleStatus | "rejected", extra?: { pin?: string; reason?: string }) {
    setError(null);
    startTransition(async () => {
      const res = await advanceOrderStatus({
        businessId,
        orderId: ticket.id,
        targetStatus: target,
        deliveryPin: extra?.pin,
        rejectionReason: extra?.reason,
      });
      if (!res.ok) setError(res.error);
      else {
        if (target === "delivered") setPinOpen(false);
        onUpdated?.();
      }
    });
  }

  return (
    <>
      <article
        className={cn(
          "flex h-[248px] w-[min(400px,88vw)] shrink-0 overflow-hidden drop-shadow-md",
          ticket.status === "pending" && "ring-2 ring-[#9a0002]/40 ring-offset-2 ring-offset-[#f3efe8]",
        )}
      >
        {/* Cuerpo blanco */}
        <div
          className="relative flex min-w-0 flex-1 flex-col bg-white px-4 py-3 dark:bg-[#faf6f1]"
          style={{
            WebkitMaskImage: SCALLOP,
            maskImage: SCALLOP,
            borderRadius: "4px 0 0 4px",
          }}
        >
          <header className="mb-2 flex items-start justify-between gap-2 border-b border-dashed border-stone-200 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Comanda</p>
              <p className="text-xl font-black tabular-nums text-stone-900">#{ticket.orderNumber}</p>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                  BADGE_ACCENT[ticket.status],
                )}
              >
                {STATUS_LABEL[ticket.status]}
              </span>
              <p className="mt-1 text-[10px] text-stone-500">
                {new Date(ticket.createdAt).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {ticket.elapsedMinutes} min
              </p>
            </div>
          </header>

          <div className="mb-2 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="truncate font-bold text-stone-900">{ticket.customerName}</p>
                {ticket.customerVerified ? (
                  <MaterialSymbol
                    icon="verified"
                    size={16}
                    className="shrink-0 text-emerald-600"
                    fill
                  />
                ) : null}
              </div>
            </div>
            {ticket.whatsappUrl ? (
              <a
                href={ticket.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25"
                aria-label="WhatsApp cliente"
              >
                <MaterialSymbol icon="chat" size={18} />
              </a>
            ) : null}
          </div>

          {ticket.fulfillmentType === "pickup" ? (
            <p className="mb-2 flex items-center gap-1 text-[11px] font-medium text-stone-500">
              <MaterialSymbol icon="storefront" size={14} className="shrink-0" />
              Retiro en local
            </p>
          ) : ticket.deliveryAddress ? (
            <p className="mb-2 flex items-start gap-1 text-[11px] text-stone-600">
              <MaterialSymbol icon="location_on" size={14} className="mt-0.5 shrink-0 text-[#9a0002]" />
              <span className="line-clamp-2 leading-snug">{ticket.deliveryAddress}</span>
            </p>
          ) : null}

          <ul className="mb-2 max-h-[72px] flex-1 space-y-0.5 overflow-y-auto text-[13px] text-stone-700">
            {ticket.items.length === 0 ? (
              <li className="text-stone-400 italic text-xs">Sin ítems</li>
            ) : (
              ticket.items.map((item, i) => (
                <li key={i} className="leading-snug">
                  <span className="font-semibold">
                    {item.quantity}× {item.name}
                  </span>
                  {item.note ? (
                    <span className="block text-[11px] text-stone-500">↳ {item.note}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>

          <footer className="mt-auto flex items-end justify-between border-t border-dashed border-stone-200 pt-2 text-xs">
            <div>
              <p className="text-[10px] uppercase text-stone-400">Total</p>
              <p className="text-base font-black text-[#9a0002]">
                ${(ticket.totalCents / 100).toLocaleString("es-AR")}
              </p>
            </div>
            <p className="text-right text-[10px] text-stone-500">
              {paymentLabel(ticket.paymentMethod)}
              {ticket.paymentStatus === "paid" ? " ✓" : ""}
            </p>
          </footer>
          {ticket.rejectionReason ? (
            <p className="mt-1 text-[11px] text-red-600">{ticket.rejectionReason}</p>
          ) : null}
          {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
        </div>

        {/* Perforación */}
        <div
          className="relative z-10 w-0 shrink-0 border-l-[3px] border-dashed border-stone-300/80"
          aria-hidden
        />

        {/* Talón cherry */}
        {!terminal && stub ? (
          <div
            className={cn(
              "relative flex w-[84px] shrink-0 flex-col items-center justify-between py-3 text-white",
              STUB_ACCENT[ticket.status],
            )}
          >
            <div className="flex flex-col items-center gap-0.5 opacity-75" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-[9px] leading-none">
                  ★
                </span>
              ))}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (ticket.status === "delivering") setPinOpen(true);
                  else if (forwardTarget) runAdvance(forwardTarget);
                }}
                className="flex w-full flex-col items-center gap-1 rounded-lg bg-white/15 px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide hover:bg-white/25 disabled:opacity-50 cursor-pointer"
              >
                <MaterialSymbol
                  icon={
                    ticket.status === "pending"
                      ? "skillet"
                      : ticket.status === "preparing"
                        ? "moped"
                        : "check_circle"
                  }
                  size={22}
                />
                {stub}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setRejectOpen(true)}
                className="text-[9px] font-semibold text-white/80 underline cursor-pointer disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>

            <BarcodeDecor orderNumber={ticket.orderNumber} />
          </div>
        ) : (
          <div className="flex w-[84px] shrink-0 flex-col items-center justify-center bg-stone-300/50 py-3 text-stone-500">
            <MaterialSymbol icon="done_all" size={28} />
          </div>
        )}
      </article>

      {pinOpen ? (
        <PinConfirmInput
          onClose={() => setPinOpen(false)}
          onConfirm={(pin) => runAdvance("delivered", { pin })}
          pending={pending}
        />
      ) : null}

      {rejectOpen ? (
        <RejectOrderModal
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) => {
            runAdvance("rejected", { reason });
            setRejectOpen(false);
          }}
          pending={pending}
        />
      ) : null}
    </>
  );
}
