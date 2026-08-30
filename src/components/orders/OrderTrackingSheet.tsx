"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { OrderTrackingView } from "@/lib/orders/lifecycle";
import { DeliveryPinDisplay } from "./DeliveryPinDisplay";
import { OrderStepper } from "./OrderStepper";
import { cn } from "@/lib/utils";

export function OrderTrackingSheet({ view }: { view: OrderTrackingView }) {
  const tel = view.businessPhone?.replace(/\D/g, "");

  return (
    <div
      className={cn(
        "relative z-30 shrink-0 max-h-[42vh] overflow-y-auto rounded-t-[24px] px-4 pb-6 pt-4 shadow-2xl",
        "bg-white dark:bg-[#1c1917]",
        "border-t border-[#e8e0d6] dark:border-[#3d3732]",
      )}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />

      {view.status === "rejected" ? (
        <div className="mb-3 flex items-start gap-3 rounded-xl bg-red-50 p-3 dark:bg-red-950/40">
          <MaterialSymbol icon="error" size={22} className="shrink-0 text-red-500" />
          <div>
            <p className="text-[15px] font-bold text-red-700 dark:text-red-200">{view.statusTitle}</p>
            <p className="mt-0.5 text-[13px] text-red-600/90 dark:text-red-300/90">{view.statusSubtitle}</p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{view.statusTitle}</h2>
          <p className="mt-0.5 text-[13px] text-stone-500 dark:text-stone-400">{view.statusSubtitle}</p>
          {view.map?.fulfillmentType === "delivery" && view.map.destination?.label ? (
            <p className="mt-1.5 flex items-start gap-1 text-[11px] text-stone-600 dark:text-stone-400">
              <MaterialSymbol icon="location_on" size={14} className="mt-0.5 shrink-0 text-[#9a0002]" />
              <span className="line-clamp-1">{view.map.destination.label}</span>
            </p>
          ) : view.map?.fulfillmentType === "pickup" ? (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-400">
              <MaterialSymbol icon="storefront" size={14} className="text-[#9a0002]" />
              Retiro en local
            </p>
          ) : null}
          <div className="my-4">
            <OrderStepper
              step={view.stepperStep}
              pickup={view.map?.fulfillmentType === "pickup"}
              status={view.status}
            />
          </div>
          {view.status === "delivering" && view.deliveryPin && view.map?.fulfillmentType !== "pickup" ? (
            <div className="mb-3">
              <DeliveryPinDisplay pin={view.deliveryPin} />
            </div>
          ) : null}
        </>
      )}

      <div className="flex items-center gap-3 border-t border-[#e8e0d6] pt-3 dark:border-stone-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f1eb] text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {view.businessName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">{view.businessName}</p>
          <p className="text-[11px] text-stone-500">Pedido #{view.orderNumber}</p>
        </div>
        {tel ? (
          <a
            href={`tel:${tel}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f1eb] text-[#9a0002] dark:bg-stone-800 dark:text-white"
            aria-label="Llamar al local"
          >
            <MaterialSymbol icon="call" size={18} />
          </a>
        ) : null}
      </div>
    </div>
  );
}
