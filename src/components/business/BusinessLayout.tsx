"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BusinessSidebar } from "./BusinessSidebar";
import { BusinessTopbar } from "./BusinessTopbar";
import { BrandSplash, useBrandSplash } from "@/components/BrandSplash";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { SPLASH_NEGOCIO } from "@/lib/firstVisit";
import { useOrderAlerts } from "@/hooks/useOrderAlerts";
import { cn } from "@/lib/utils";
import type { BusinessShellData } from "@/lib/business/queries";

export function BusinessLayout({
  children,
  businessId,
  shell,
}: {
  children: React.ReactNode;
  businessId: string;
  shell: BusinessShellData;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { show: showSplash, skip: skipSplash } = useBrandSplash(SPLASH_NEGOCIO);
  const { alerts, pendingCount, dismiss } = useOrderAlerts(businessId);
  const isChatWorkspace = pathname.includes("/whatsapp");

  return (
    <div
      className={cn(
        "flex flex-col bg-[#f3efe8] dark:bg-[#1c1917]",
        isChatWorkspace ? "h-dvh overflow-hidden" : "min-h-screen",
      )}
    >
      {shell.impersonating && (
        <ImpersonationBanner businessName={shell.business.name} />
      )}
      <div className={cn("flex flex-1", isChatWorkspace && "min-h-0 overflow-hidden")}>
      <BrandSplash show={showSplash} onSkip={skipSplash} />

      <BusinessSidebar
        businessId={businessId}
        planLabel={shell.planLabel}
        planCommission={shell.planCommission}
        pendingCount={pendingCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        members={shell.members}
        memberCount={shell.memberCount}
      />

      <div className={cn("flex min-w-0 flex-1 flex-col", isChatWorkspace && "min-h-0 overflow-hidden")}>
        <BusinessTopbar
          businessId={businessId}
          orderAlerts={alerts}
          onDismissOrderAlerts={dismiss}
          onMenuClick={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isChatWorkspace
              ? "overflow-hidden p-0"
              : "overflow-x-hidden px-4 py-5 md:px-8 md:py-7",
          )}
        >
          <motion.div
            initial={showSplash ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={cn(isChatWorkspace && "flex min-h-0 flex-1 flex-col")}
          >
            {children}
          </motion.div>
        </main>
      </div>
      </div>
    </div>
  );
}
