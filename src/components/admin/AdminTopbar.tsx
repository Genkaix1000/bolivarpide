"use client";

import { SignOut } from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/actions";
import { AdminInstallButton } from "@/components/pwa/AdminInstallButton";
import { cn } from "@/lib/utils";
import type { PlatformRole } from "@/lib/admin/platform";

export function AdminTopbar({
  title,
  platformRole,
}: {
  title: string;
  platformRole: PlatformRole;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e0d6] bg-[#faf6f1]/80 px-4 py-3.5 backdrop-blur dark:border-[#3d3732] dark:bg-[#1c1917]/80 md:px-8">
      <div className="min-w-0 pl-12 md:pl-0">
        <h1 className="truncate text-[1.25rem] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h1>
        <p
          className={cn(
            "mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#9a0002]",
          )}
        >
          {platformRole === "superadmin" ? "Panel Superadmin" : "Panel Soporte"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <AdminInstallButton />
        <form action={signOut}>
          <input type="hidden" name="next" value="/admin/login" />
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-stone-200"
          >
            <SignOut weight="regular" size={16} />
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
