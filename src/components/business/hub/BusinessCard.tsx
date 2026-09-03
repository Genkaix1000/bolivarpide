"use client";

import Link from "next/link";
import Image from "next/image";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";
import { BUSINESS_PLANS } from "@/lib/business/plans";
import type { MembershipRow } from "@/lib/business/queries";

export function BusinessCard({ membership }: { membership: MembershipRow }) {
  const business = membership.businesses;
  if (!business) return null;

  const logoUrl = resolveBusinessAssetUrl(business.logo_path);
  const bannerUrl = resolveBusinessAssetUrl(business.banner_path);
  const planInfo = BUSINESS_PLANS.find((p) => p.id === business.plan) || BUSINESS_PLANS[0];

  const roleLabels: Record<string, string> = {
    owner: "Dueño / Titular",
    manager: "Encargado",
    kitchen: "Cocina / Pedidos",
    driver: "Repartidor",
  };
  const roleLabel = roleLabels[membership.role] || membership.role;

  // Stats
  const followersCount = 0; // Followers count
  const productsCount = (business.products as any)?.[0]?.count ?? 0;
  const ratingValue = business.rating && business.rating > 0 ? Number(business.rating).toFixed(1) : "5.0";

  return (
    <Link
      href={`/negocio/${membership.business_id}/dashboard`}
      className="group relative flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-[#332e2a] hover:border-[#9a0002]/40 dark:hover:border-[#9a0002]/40 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Top Banner with cover image, tagline and open badge */}
      <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden bg-[#2a201c]">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={business.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-tr from-[#3a2019] via-[#5d4037] to-[#2a1d18]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />

        {/* Top badges inside banner */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between z-10">
          {/* Open/Closed indicator */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
              business.is_open
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                : "bg-black/60 text-stone-300 border border-white/10"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                business.is_open ? "bg-emerald-400 animate-pulse" : "bg-stone-400"
              }`}
            />
            {business.is_open ? "Abierto" : "Cerrado"}
          </span>

          {/* Plan pill */}
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full">
            {planInfo.name}
          </span>
        </div>

        {/* Tagline centered on banner, like customer menu showcase */}
        {business.tagline && (
          <p className="absolute bottom-6 inset-x-4 text-center text-xs font-semibold text-white/95 drop-shadow line-clamp-1">
            {business.tagline}
          </p>
        )}
      </div>

      {/* Profile Avatar overlapping banner */}
      <div className="relative -mt-9 z-10 flex flex-col items-center px-5 text-center">
        <div className="relative w-[72px] h-[72px] rounded-full p-1 bg-white dark:bg-[#1c1917] shadow-lg group-hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full rounded-full overflow-hidden bg-stone-100 dark:bg-[#2a2623] flex items-center justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={business.name}
                width={72}
                height={72}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-xl font-black text-[#9a0002]">
                {business.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Business Name */}
        <h3 className="mt-2.5 text-base font-black text-stone-900 dark:text-stone-100 group-hover:text-[#9a0002] transition-colors line-clamp-1">
          {business.name}
        </h3>

        {/* 3 Stats: Seguidores | Productos | Rating (Identical to reference screenshot) */}
        <div className="flex w-full items-center justify-center mt-3 pt-3 border-t border-stone-100 dark:border-[#2a2623]">
          <div className="flex flex-1 flex-col items-center">
            <span className="text-[15px] font-extrabold text-stone-900 dark:text-stone-100">
              {followersCount}
            </span>
            <span className="text-[10px] font-medium text-stone-400">Seguidores</span>
          </div>

          <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />

          <div className="flex flex-1 flex-col items-center">
            <span className="text-[15px] font-extrabold text-stone-900 dark:text-stone-100">
              {productsCount}
            </span>
            <span className="text-[10px] font-medium text-stone-400">Productos</span>
          </div>

          <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />

          <div className="flex flex-1 flex-col items-center">
            <span className="flex items-center gap-0.5 text-[15px] font-extrabold text-stone-900 dark:text-stone-100">
              {ratingValue}
              <MaterialSymbol icon="star" size={13} fill className="text-amber-500" />
            </span>
            <span className="text-[10px] font-medium text-stone-400">Rating</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Role & Enter button */}
      <div className="mt-4 px-5 py-3 border-t border-stone-100 dark:border-[#2a2623] bg-stone-50/50 dark:bg-[#231f1c]/40 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
          <MaterialSymbol icon="badge" size={14} className="text-stone-400" />
          {roleLabel}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#9a0002] group-hover:translate-x-0.5 transition-transform">
          <span>Gestionar</span>
          <MaterialSymbol icon="arrow_forward" size={14} />
        </span>
      </div>
    </Link>
  );
}
