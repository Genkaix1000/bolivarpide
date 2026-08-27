"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BusinessSidebar } from "./BusinessSidebar";
import { BusinessTopbar } from "./BusinessTopbar";
import { BrandSplash, useBrandSplash } from "@/components/BrandSplash";
import { SPLASH_NEGOCIO } from "@/lib/firstVisit";

export function BusinessLayout({
  children,
  businessId,
}: {
  children: React.ReactNode;
  businessId: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { show: showSplash, skip: skipSplash } = useBrandSplash(SPLASH_NEGOCIO);

  return (
    <div className="flex min-h-screen bg-[#f3efe8] dark:bg-[#1c1917]">
      <BrandSplash show={showSplash} onSkip={skipSplash} />

      <BusinessSidebar
        businessId={businessId}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <BusinessTopbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-x-hidden px-4 py-5 md:px-8 md:py-7">
          {/* Solo fade-in: exit+enter se sentía como doble parpadeo */}
          <motion.div
            key={pathname}
            initial={showSplash ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
