"use client";

import type { ReactNode, Ref } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { UserAvatarView } from "@/components/UserAvatarView";
import type { OrderItemDetail, OrderLifecycleStatus } from "@/lib/orders/lifecycle";
import type { UserAvatar } from "@/lib/userProfile";
import { DEFAULT_USER_PROFILE } from "@/lib/userProfile";
import { cn } from "@/lib/utils";
import {
  BADGE_ACCENT,
  formatCents,
  paymentLabel,
  STATUS_LABEL,
  STUB_ACCENT,
} from "./comandaTicketShared";

export type ComandaTicketVisualData = {
  orderNumber: number;
  status: OrderLifecycleStatus;
  nameLine: string;
  nameVerified?: boolean;
  nameIcon?: "store";
  buyerAvatar?: UserAvatar | null;
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

export function ComandaTicketReadOnlyStub({
  status,
  orderNumber,
}: {
  status: OrderLifecycleStatus;
  orderNumber: number;
}) {
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

function BuyerMark({ data }: { data: ComandaTicketVisualData }) {
  if (data.nameIcon === "store") {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-200/80 text-stone-600">
        <MaterialSymbol icon="storefront" size={22} />
      </div>
    );
  }
  const avatar = data.buyerAvatar ?? {
    type: "initials" as const,
    value: "?",
    gradientId: DEFAULT_USER_PROFILE.avatar.gradientId,
  };
  return <UserAvatarView avatar={avatar} variant="button" className="h-12 w-12" />;
}

function itemAddonsCents(item: OrderItemDetail) {
  return (item.optionsDetail ?? []).reduce((sum, opt) => sum + opt.priceCents, 0);
}

function ComandaItemLines({
  items,
  compact,
}: {
  items: OrderItemDetail[];
  compact?: boolean;
}) {
  return (
    <ul
      className={cn(
        "mb-2 space-y-2 font-mono text-[13px] text-stone-800",
        compact ? "max-h-[min(52vh,360px)] overflow-y-auto" : "max-h-[min(42vh,280px)] overflow-y-auto",
      )}
    >
      {items.length === 0 ? (
        <li className="font-sans text-xs italic text-stone-400">Sin ítems</li>
      ) : (
        items.map((item, i) => {
          const lineTotal = item.quantity * item.unitPriceCents;
          const addons = (item.optionsDetail ?? []).filter((opt) => opt.priceCents > 0);
          const baseUnit = item.unitPriceCents - itemAddonsCents(item);
          return (
            <li key={i} className="leading-snug">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold">
                  {item.quantity}× {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-[12px] font-bold text-stone-800">
                  {formatCents(lineTotal)}
                </span>
              </div>
              {addons.length > 0 ? (
                <div className="mt-0.5 space-y-0.5 pl-2 font-sans">
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
              ) : null}
              {item.note ? (
                <span className="mt-0.5 block pl-2 font-sans text-[11px] text-stone-500">↳ {item.note}</span>
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );
}

function DashRule() {
  return <div className="my-2.5 border-t border-dashed border-stone-300" aria-hidden />;
}

function ComandaTicketBody({
  data,
  elapsed,
  showStatusBadge,
  compactItems,
}: {
  data: ComandaTicketVisualData;
  elapsed: number;
  showStatusBadge?: boolean;
  compactItems?: boolean;
}) {
  const timeStr = new Date(data.createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <BuyerMark data={data} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1">
                <p className="truncate text-[14px] font-bold text-stone-900">{data.nameLine}</p>
                {data.nameVerified && data.nameIcon !== "store" ? (
                  <MaterialSymbol icon="verified" size={15} className="shrink-0 text-emerald-600" fill />
                ) : null}
              </div>
              {data.fulfillmentType === "pickup" ? (
                <p className="mt-0.5 flex items-center gap-0.5 text-[11px] font-medium text-stone-500">
                  <MaterialSymbol icon="storefront" size={13} />
                  Retiro
                </p>
              ) : data.deliveryAddress ? (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-stone-500">
                  {data.deliveryAddress}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-[22px] font-black leading-none tabular-nums text-stone-900">
            #{data.orderNumber}
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-stone-500">{timeStr}</p>
          <p className="font-mono text-[11px] font-semibold tabular-nums text-stone-600">{elapsed} min</p>
          <div className="mt-1.5 flex items-center justify-end gap-1">
            {showStatusBadge ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  BADGE_ACCENT[data.status],
                )}
              >
                {STATUS_LABEL[data.status]}
              </span>
            ) : null}
            {data.whatsappUrl ? (
              <a
                href={data.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E]"
                aria-label="WhatsApp"
              >
                <MaterialSymbol icon="chat" size={16} />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <DashRule />

      <ComandaItemLines items={data.items} compact={compactItems} />

      <DashRule />

      <footer className="flex items-end justify-between pt-0.5">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Total</p>
          <p className="font-mono text-lg font-black tabular-nums text-[#9a0002]">
            {formatCents(data.totalCents)}
          </p>
        </div>
        <p className="text-right font-mono text-[10px] text-stone-500">
          {paymentLabel(data.paymentMethod)}
          {data.paymentStatus === "paid" ? " ✓" : ""}
        </p>
      </footer>
      {data.rejectionReason ? (
        <p className="mt-2 text-[11px] text-red-600">{data.rejectionReason}</p>
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
  actions,
}: {
  data: ComandaTicketVisualData;
  stub?: ReactNode;
  className?: string;
  innerRef?: Ref<HTMLElement>;
  highlightPending?: boolean;
  variant?: "full" | "body" | "kitchen";
  actions?: ReactNode;
}) {
  const elapsed =
    data.elapsedMinutes ??
    Math.max(0, Math.floor((Date.now() - new Date(data.createdAt).getTime()) / 60000));

  const pending = highlightPending && data.status === "pending";

  if (variant === "body" || variant === "kitchen") {
    return (
      <article
        ref={innerRef}
        className={cn(
          "flex w-[min(340px,88vw)] shrink-0 flex-col overflow-hidden rounded-2xl bg-[#fffef8] text-stone-900 shadow-[0_12px_32px_-14px_rgba(61,43,31,0.4)]",
          pending && variant === "kitchen" && "ring-2 ring-[#9a0002] ring-offset-2 ring-offset-[#f3efe8]",
          className,
        )}
      >
        {pending && variant === "kitchen" ? (
          <div className="flex items-center justify-between bg-[#9a0002] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            <span>Nuevo · sin aceptar</span>
            <span className="font-mono tabular-nums opacity-90">{elapsed} min</span>
          </div>
        ) : null}
        <div className="flex flex-col px-4 pb-4 pt-3">
          <ComandaTicketBody
            data={data}
            elapsed={elapsed}
            showStatusBadge={variant === "body"}
            compactItems={variant === "kitchen"}
          />
        </div>
        {variant === "kitchen" && actions ? (
          <div className="border-t border-dashed border-stone-300 bg-[#f7f3ea] px-3 py-2.5">{actions}</div>
        ) : null}
      </article>
    );
  }

  return (
    <article
      ref={innerRef}
      className={cn(
        "flex min-h-[248px] w-[min(400px,88vw)] shrink-0 overflow-hidden drop-shadow-md",
        pending && "ring-2 ring-[#9a0002]/40 ring-offset-2 ring-offset-[#f3efe8]",
        className,
      )}
    >
      <div className="relative flex min-w-0 flex-1 flex-col bg-[#fffef8] px-4 py-3">
        <ComandaTicketBody data={data} elapsed={elapsed} showStatusBadge compactItems />
      </div>

      <div
        className="relative z-10 w-0 shrink-0 border-l-[3px] border-dashed border-stone-300/80"
        aria-hidden
      />

      {stub ?? <ComandaTicketReadOnlyStub status={data.status} orderNumber={data.orderNumber} />}
    </article>
  );
}
