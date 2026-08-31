"use client";

import { useState, useTransition } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ComandaTicketVisual } from "@/components/orders/ComandaTicketVisual";
import { advanceOrderStatus } from "@/lib/orders/actions";
import { stubLabel, type KitchenOrderTicket, type OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { cn } from "@/lib/utils";
import { PinConfirmInput } from "./PinConfirmInput";
import { RejectOrderModal } from "./RejectOrderModal";

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

  const primaryIcon =
    ticket.status === "pending"
      ? "skillet"
      : ticket.status === "preparing"
        ? "moped"
        : "check_circle";

  const actions =
    !terminal && stub ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (ticket.status === "delivering") setPinOpen(true);
            else if (forwardTarget) runAdvance(forwardTarget);
          }}
          className={cn(
            "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-bold text-white disabled:opacity-50",
            ticket.status === "pending"
              ? "bg-[#9a0002] hover:bg-[#850002]"
              : ticket.status === "preparing"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-stone-900 hover:bg-stone-800",
          )}
        >
          <MaterialSymbol icon={primaryIcon} size={18} />
          {stub}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
          className="shrink-0 cursor-pointer rounded-xl px-3 py-2.5 text-[11px] font-semibold text-stone-500 hover:bg-stone-200/80 hover:text-red-700 disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
    ) : terminal ? (
      <div className="flex items-center justify-center gap-1.5 py-0.5 text-[11px] font-semibold text-stone-400">
        <MaterialSymbol icon="done_all" size={16} />
        {ticket.status === "rejected" ? "Rechazado" : "Finalizado"}
      </div>
    ) : null;

  return (
    <>
      <div className="relative">
        <ComandaTicketVisual
          data={{
            orderNumber: ticket.orderNumber,
            status: ticket.status,
            nameLine: ticket.customerName,
            nameVerified: ticket.customerVerified,
            buyerAvatar: ticket.customerAvatar,
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
          variant="kitchen"
          highlightPending
          actions={actions}
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
