"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

const CARD =
  "bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[16px]";

type MpStatusLite = {
  linked: boolean;
  status: "active" | "expired" | "revoked" | null;
  mpReady: boolean;
};

export function MpPaymentsNotice({ businessId }: { businessId: string }) {
  const [status, setStatus] = useState<MpStatusLite | null>(null);

  useEffect(() => {
    fetch(`/api/payments/mp/status?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setStatus(j))
      .catch(() => {});
  }, [businessId]);

  if (!status) return null;

  const active = status.linked && status.status === "active";
  if (active && status.mpReady) return null;

  const expired = status.linked && status.status === "expired";
  const unlinked = !status.linked || status.status === "revoked";

  const icon = unlinked ? "link_off" : expired ? "schedule" : "qr_code_2";
  const title = unlinked
    ? "Mercado Pago sin vincular"
    : expired
      ? "Reconectá Mercado Pago"
      : "Completá la configuración de cobros";
  const subtitle = unlinked
    ? "Conectá tu cuenta para recibir pagos con QR"
    : expired
      ? "La vinculación venció — volvé a autorizar la app"
      : "Falta un paso para activar cobros con QR";

  return (
    <Link
      href={`/negocio/${businessId}/pagos`}
      className={cn(
        CARD,
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#faf8f5] dark:hover:bg-[#231f1c]/50 group",
        unlinked || expired
          ? "border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/15"
          : "border-[#9a0002]/15 bg-[#9a0002]/[0.04]",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          unlinked || expired ? "bg-amber-100 dark:bg-amber-900/40" : "bg-[#9a0002]/10",
        )}
      >
        <MaterialSymbol
          icon={icon}
          size={22}
          className={unlinked || expired ? "text-amber-600" : "text-[#9a0002]"}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-gray-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
      </div>
      <MaterialSymbol
        icon="chevron_right"
        size={20}
        className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors"
      />
    </Link>
  );
}
