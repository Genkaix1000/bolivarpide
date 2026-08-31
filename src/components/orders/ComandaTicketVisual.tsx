"use client";

import type { ReactNode, Ref } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { OrderItemDetail, OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import { cn } from "@/lib/utils";
import {
  BADGE_ACCENT,
  formatCents,
  paymentLabel,
  SCALLOP,
  STATUS_LABEL,
  STUB_ACCENT,
} from "./comandaTicketShared";

export type ComandaTicketVisualData = {
  orderNumber: number;
  status: OrderLifecycleStatus;
  nameLine: string;
  nameVerified?: boolean;
  nameIcon?: "store";
  fulfillmentType?: "delivery" | "pickup";
  deliveryAddress?: string | null;
  items: OrderItemDetail[];
  totalCents: number;
  paymentMethod: string | null;
  paymentStatus?: string;
  createdAt: string;
  elapsedMinutes?: number;
  rejectionReason?: string | null;
  whatsappUrl?: string | null;
};

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

export function ComandaTicketReadOnlyStub({ status, orderNumber }: { status: OrderLifecycleStatus; orderNumber: number }) {
  return (
    <div
      className={cn(
        "relative flex w-[84px] shrink-0 flex-col items-center justify-between py-3 text-white",
        STUB_ACCENT[status],
      )}
    >
      <div className="flex flex-col items-center gap-0.5 opacity-75" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-[9px] leading-none">
            ★
          </span>
        ))}
      </div>
      <p className="px-1 text-center text-[10px] font-bold uppercase leading-tight tracking-wide">
        {STATUS_LABEL[status]}
      </p>
      <BarcodeDecor orderNumber={orderNumber} />
    </div>
  );
}

function itemAddonsCents(item: OrderItemDetail) {
  return (item.optionsDetail ?? []).reduce((sum, opt) => sum + opt.priceCents, 0);
}

function ComandaItemLines({ items, roomy }: { items: OrderItemDetail[]; roomy?: boolean }) {
  return (
    <ul
      className={cn(
        "mb-2 flex-1 space-y-1.5 overflow-y-auto text-[13px] text-stone-700",
        roomy ? "max-h-[min(42vh,280px)]" : "max-h-[72px]",
      )}
    >
      {items.length === 0 ? (
        <li className="text-xs italic text-stone-400">Sin ítems</li>
      ) : (
        items.map((item, i) => {
          const lineTotal = item.quantity * item.unitPriceCents;
          const addons = (item.optionsDetail ?? []).filter((opt) => opt.priceCents > 0);
          const baseUnit = item.unitPriceCents - itemAddonsCents(item);
          return (
            <li key={i} className="leading-snug">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">
                  {item.quantity}× {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-[12px] font-bold text-stone-800">
                  {formatCents(lineTotal)}
                </span>
              </div>
              {addons.length > 0 ? (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {baseUnit > 0 ? (
                    <div className="flex justify-between gap-2 text-[11px] text-stone-500">
                      <span>Base</span>
                      <span className="tabular-nums">{formatCents(baseUnit * item.quantity)}</span>
                    </div>
                  ) : null}
                  {addons.map((opt, j) => (
                    <div key={j} className="flex justify-between gap-2 text-[11px] text-stone-500">
                      <span>{opt.priceCents > 0 ? `+ ${opt.label}` : opt.label}</span>
                      {opt.priceCents > 0 ? (
                        <span className="tabular-nums">{formatCents(opt.priceCents * item.quantity)}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pl-2 text-[11px] tabular-nums text-stone-500">
                  {formatCents(item.unitPriceCents)} c/u
                </p>
              )}
              {item.note ? (
                <span className="mt-0.5 block pl-2 text-[11px] text-stone-500">↳ {item.note}</span>
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );
}

function ComandaTicketBody({
  data,
  elapsed,
  roomy,
}: {
  data: ComandaTicketVisualData;
  elapsed: number;
  roomy?: boolean;
}) {
  return (
    <>
      <header className="mb-2 flex items-start justify-between gap-2 border-b border-dashed border-stone-200 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Comanda</p>
          <p className="text-xl font-black tabular-nums text-stone-900">#{data.orderNumber}</p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
              BADGE_ACCENT[data.status],
            )}
          >
            {STATUS_LABEL[data.status]}
          </span>
          <p className="mt-1 text-[10px] text-stone-500">
            {new Date(data.createdAt).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {elapsed} min
          </p>
        </div>
      </header>

      <div className="mb-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate font-bold text-stone-900">{data.nameLine}</p>
            {data.nameIcon === "store" ? (
              <MaterialSymbol icon="storefront" size={16} className="shrink-0 text-stone-500" />
            ) : data.nameVerified ? (
              <MaterialSymbol icon="verified" size={16} className="shrink-0 text-emerald-600" fill />
            ) : null}
          </div>
        </div>
        {data.whatsappUrl ? (
          <a
            href={data.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E]"
            aria-label="WhatsApp"
          >
            <MaterialSymbol icon="chat" size={18} />
          </a>
        ) : null}
      </div>

      {data.fulfillmentType === "pickup" ? (
        <p className="mb-2 flex items-center gap-1 text-[11px] font-medium text-stone-500">
          <MaterialSymbol icon="storefront" size={14} className="shrink-0" />
          Retiro en local
        </p>
      ) : data.deliveryAddress ? (
        <p className="mb-2 flex items-start gap-1 text-[11px] text-stone-600">
          <MaterialSymbol icon="location_on" size={14} className="mt-0.5 shrink-0 text-[#9a0002]" />
          <span className="line-clamp-2 leading-snug">{data.deliveryAddress}</span>
        </p>
      ) : null}

      <ComandaItemLines items={data.items} roomy={roomy} />

      <footer className="mt-auto flex items-end justify-between border-t border-dashed border-stone-200 pt-2 text-xs">
        <div>
          <p className="text-[10px] uppercase text-stone-400">Total</p>
          <p className="text-base font-black text-[#9a0002]">{formatCents(data.totalCents)}</p>
        </div>
        <p className="text-right text-[10px] text-stone-500">
          {paymentLabel(data.paymentMethod)}
          {data.paymentStatus === "paid" ? " ✓" : ""}
        </p>
      </footer>
      {data.rejectionReason ? (
        <p className="mt-1 text-[11px] text-red-600">{data.rejectionReason}</p>
      ) : null}
    </>
  );
}

export function ComandaTicketVisual({
  data,
  stub,
  className,
  innerRef,
  highlightPending,
  variant = "full",
}: {
  data: ComandaTicketVisualData;
  stub?: ReactNode;
  className?: string;
  innerRef?: Ref<HTMLElement>;
  highlightPending?: boolean;
  variant?: "full" | "body";
}) {
  const elapsed =
    data.elapsedMinutes ??
    Math.max(0, Math.floor((Date.now() - new Date(data.createdAt).getTime()) / 60000));

  if (variant === "body") {
    return (
      <article
        ref={innerRef}
        className={cn(
          "flex w-[min(360px,92vw)] flex-col bg-white px-4 py-3",
          className,
        )}
      >
        <ComandaTicketBody data={data} elapsed={elapsed} roomy />
      </article>
    );
  }

  return (
    <article
      ref={innerRef}
      className={cn(
        "flex h-[248px] w-[min(400px,88vw)] shrink-0 overflow-hidden drop-shadow-md",
        highlightPending && data.status === "pending" && "ring-2 ring-[#9a0002]/40 ring-offset-2 ring-offset-[#f3efe8]",
        className,
      )}
    >
      <div
        className="relative flex min-w-0 flex-1 flex-col bg-white px-4 py-3"
        style={{
          WebkitMaskImage: SCALLOP,
          maskImage: SCALLOP,
          borderRadius: "4px 0 0 4px",
        }}
      >
        <ComandaTicketBody data={data} elapsed={elapsed} />
      </div>

      <div
        className="relative z-10 w-0 shrink-0 border-l-[3px] border-dashed border-stone-300/80"
        aria-hidden
      />

      {stub ?? <ComandaTicketReadOnlyStub status={data.status} orderNumber={data.orderNumber} />}
    </article>
  );
}
