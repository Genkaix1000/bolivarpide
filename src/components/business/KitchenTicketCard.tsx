"use client";

import { useState, useTransition } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ComandaTicketVisual } from "@/components/orders/ComandaTicketVisual";
import { STUB_ACCENT } from "@/components/orders/comandaTicketShared";
import { advanceOrderStatus } from "@/lib/orders/actions";
import { stubLabel, type KitchenOrderTicket, type OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { cn } from "@/lib/utils";
import { PinConfirmInput } from "./PinConfirmInput";
import { RejectOrderModal } from "./RejectOrderModal";

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

  const actionStub =
    !terminal && stub ? (
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
            className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg bg-white/15 px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide hover:bg-white/25 disabled:opacity-50"
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
            className="cursor-pointer text-[9px] font-semibold text-white/80 underline disabled:opacity-50"
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
    );

  return (
    <>
      <div className="relative">
        <ComandaTicketVisual
          data={{
            orderNumber: ticket.orderNumber,
            status: ticket.status,
            nameLine: ticket.customerName,
            nameVerified: ticket.customerVerified,
            fulfillmentType: ticket.fulfillmentType,
            deliveryAddress: ticket.deliveryAddress,
            items: ticket.items,
            totalCents: ticket.totalCents,
            paymentMethod: ticket.paymentMethod,
            paymentStatus: ticket.paymentStatus,
            createdAt: ticket.createdAt,
            elapsedMinutes: ticket.elapsedMinutes,
            rejectionReason: ticket.rejectionReason,
            whatsappUrl: ticket.whatsappUrl,
          }}
          stub={actionStub}
          highlightPending
        />
        {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
      </div>

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
