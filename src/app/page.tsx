"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import Navbar from "@/components/Navbar";
import CurvedHomeHeader from "@/components/CurvedHomeHeader";
import { SmoothInput } from "@/components/SmoothInput";
import { cn } from "@/lib/utils";
import {
  FEATURED_CHAINS,
  TRENDING_ITEMS,
  FeaturedChain,
  TrendingItem
} from "@/lib/mockData";
import { useCart } from "@/components/CartProvider";
import { BrandSplash, useBrandSplash } from "@/components/BrandSplash";
import { SPLASH_HOME } from "@/lib/firstVisit";
import { useUserProfile } from "@/components/UserProfileProvider";
import { UserAvatarView } from "@/components/UserAvatarView";
import { AvatarPickerModal } from "@/components/AvatarPickerModal";
import { BadgeDetailModal } from "@/components/BadgeDetailModal";
import { flashToast } from "@/components/FlashToast";
import { AddressFormModal } from "@/components/addresses/AddressFormModal";
import { addressToSummary } from "@/lib/addresses/db";
import { formatLocalMobile } from "@/lib/business/phone";
import {
  listUserAddressesAction,
  setDefaultAddressAction,
} from "@/lib/addresses/actions";
import { MAX_USER_ADDRESSES } from "@/lib/addresses/constants";
import type { UserAddress } from "@/lib/addresses/types";
import { UserAwardBadge, getRarityColor } from "@/lib/userProfile";

export default function HomePage() {
  const { profile, updateAvatar, isAuthenticated, logout, persistProfile } = useUserProfile();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<UserAwardBadge | null>(null);
  const [currentTab, setCurrentTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { show: showSplash, skip: skipSplash } = useBrandSplash(SPLASH_HOME);
  const isLoading = showSplash;

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  // Membership real (OAuth + business_members)
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(["Pizza", "Hamburguesa", "Café"]);
  const topSearches = ["Empanadas", "Sushi", "Desayuno", "Helado", "Envíos Gratis"];
  const [randomizedRecommended, setRandomizedRecommended] = useState<FeaturedChain[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carousels State
  const [randomizedChains, setRandomizedChains] = useState<FeaturedChain[]>([]);
  const [currentChainPage, setCurrentChainPage] = useState(0);

  // Menús del Momento Dynamic Scroll Mask State
  const [trendingScrollState, setTrendingScrollState] = useState({ isAtStart: true, isAtEnd: false });

  // Container Refs for Mouse Wheel Scroll Paging
  const chainContainerRef = useRef<HTMLDivElement>(null);
  const trendingContainerRef = useRef<HTMLDivElement>(null);

  // Touch Swipe Gesture Tracking
  const [chainTouchStart, setChainTouchStart] = useState<number | null>(null);
  const [chainTouchEnd, setChainTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Shuffling Featured Chains & Recommended on Mount (+ published DB when hay)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const { toFeaturedChain } = await import("@/lib/business/home");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: mem } = await supabase
            .from("business_members")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1);
          if (!cancelled) setIsBusinessOwner((mem?.length ?? 0) > 0);
        }
        const { data: pubs } = await supabase
          .from("businesses")
          .select(
            "id, slug, name, tagline, logo_path, rating, reviews_count, prep_time_minutes, is_open, address",
          )
          .eq("published", true)
          .order("name");
        if (cancelled) return;
        if (pubs && pubs.length > 0) {
          const mapped = pubs.map(toFeaturedChain);
          setRandomizedChains([...mapped].sort(() => Math.random() - 0.5));
          setRandomizedRecommended([...mapped].sort(() => Math.random() - 0.5));
          return;
        }
      } catch {
        /* fallback mock */
      }
      if (cancelled) return;
      const shuffled = [...FEATURED_CHAINS].sort(() => Math.random() - 0.5);
      setRandomizedChains(shuffled);
      const shuffledRec = [...FEATURED_CHAINS].sort(() => Math.random() - 0.5);
      setRandomizedRecommended(shuffledRec);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setSelectedAddressId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listUserAddressesAction();
        if (cancelled) return;
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        setSelectedAddressId(def?.id ?? "");
      } catch {
        if (!cancelled) {
          setAddresses([]);
          setSelectedAddressId("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Mouse Scroll Wheel Page Swapper for Featured Chains
  useEffect(() => {
    const container = chainContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (e.deltaY > 0 && currentChainPage === 0) {
          e.preventDefault();
          setCurrentChainPage(1);
        } else if (e.deltaY < 0 && currentChainPage === 1) {
          e.preventDefault();
          setCurrentChainPage(0);
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [currentChainPage]);

  // Mouse Scroll Wheel Scroller for Menús del Momento (horizontal scrolling lock)
  useEffect(() => {
    const container = trendingContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScrollLeft = container.scrollLeft > 0 && e.deltaY < 0;
        const canScrollRight = container.scrollLeft + container.clientWidth < container.scrollWidth && e.deltaY > 0;
        if (canScrollLeft || canScrollRight) {
          e.preventDefault();
          container.scrollLeft += e.deltaY * 0.85; // smooth scrolling coefficient
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Monitor scrolling state for Menús del Momento to apply dynamic mask fades
  useEffect(() => {
    if (isLoading) return;
    const el = trendingContainerRef.current;
    if (!el) return;

    const check = () => {
      setTrendingScrollState({
        isAtStart: el.scrollLeft <= 10,
        isAtEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 15,
      });
    };

    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [isLoading]);

  // Touch handlers for Featured Chains Carousel
  const handleChainTouchStart = (e: React.TouchEvent) => {
    setChainTouchEnd(null);
    setChainTouchStart(e.targetTouches[0].clientX);
  };
  const handleChainTouchMove = (e: React.TouchEvent) => {
    setChainTouchEnd(e.targetTouches[0].clientX);
  };
  const handleChainTouchEnd = () => {
    if (!chainTouchStart || !chainTouchEnd) return;
    const distance = chainTouchStart - chainTouchEnd;
    if (distance > minSwipeDistance && currentChainPage === 0) {
      // Swipe left
      setCurrentChainPage(1);
    } else if (distance < -minSwipeDistance && currentChainPage === 1) {
      // Swipe right
      setCurrentChainPage(0);
    }
  };

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
  };

  const renderTabContent = () => {
    if (currentTab === "profile") {
      return (
        <>
          <div className="max-w-md mx-auto bg-white dark:bg-[#1c1917] rounded-[24px] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] mt-6 p-6 animate-fade-in space-y-5">
            {/* User Profile Header Card with interactive Avatar */}
            <div className="flex items-center gap-4 pb-5 border-b border-[#f0ebe4] dark:border-[#2a2623]">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  aria-label="Cambiar foto de perfil"
                  className="cursor-pointer relative block transition-transform duration-200 active:scale-95 group-hover:opacity-95"
                >
                  <UserAvatarView avatar={profile.avatar} size="lg" showBorder />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#9a0002] text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#1c1917] group-hover:scale-110 transition-transform">
                    <MaterialSymbol icon="edit" size={13} />
                  </span>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[16px] text-gray-900 dark:text-gray-100 truncate">
                    {profile.name || "Invitado"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="text-[11px] font-bold text-[#9a0002] hover:text-[#6b0001] dark:text-[#f87171] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <MaterialSymbol icon="palette" size={13} />
                    <span>Cambiar foto</span>
                  </button>
                </div>
                <p className="text-[12px] text-gray-400 truncate mt-0.5">
                  {profile.email || "Sin sesión"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {isAuthenticated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-300">
                      <MaterialSymbol icon="verified" size={11} fill />
                      <span>Cliente Activo</span>
                    </span>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700 hover:bg-[#9a0002]/10 hover:text-[#9a0002]"
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Quick avatar edit card banner */}
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-[#9a0002]/8 via-[#9a0002]/4 to-transparent border border-[#9a0002]/15 flex items-center justify-between cursor-pointer hover:border-[#9a0002]/30 hover:bg-[#9a0002]/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#9a0002]/15 flex items-center justify-center text-[#9a0002] flex-shrink-0">
                  <MaterialSymbol icon="auto_awesome" size={18} fill />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                    Personalizar avatar
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Iconos, emojis, iniciales y color de fondo
                  </p>
                </div>
              </div>
              <MaterialSymbol
                icon="arrow_forward_ios"
                size={13}
                className="text-gray-400 group-hover:translate-x-0.5 group-hover:text-[#9a0002] transition-all"
              />
            </div>

            {/* Vitrina de Premios & Distinciones */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MaterialSymbol icon="military_tech" size={18} className="text-[#9a0002]" fill />
                  <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                    Premios & Distinciones
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-[#9a0002] bg-[#9a0002]/10 px-2 py-0.5 rounded-full">
                  {profile.awardedBadges?.length || 0} insignias
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.awardedBadges?.map((badge) => {
                  const style = getRarityColor(badge.rarity);
                  return (
                    <div
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-98 flex items-center gap-3 hover:shadow-md group",
                        "bg-[#faf6f1] dark:bg-[#231f1c]",
                        style.border,
                        "hover:border-[#9a0002]/40"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-xs", style.bg, style.border)}>
                        {badge.emoji ? (
                          <span className="text-xl leading-none">{badge.emoji}</span>
                        ) : (
                          <MaterialSymbol icon={badge.icon} size={20} className={style.text} fill />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-[12px] text-gray-900 dark:text-gray-100 truncate group-hover:text-[#9a0002] transition-colors">
                            {badge.title}
                          </h5>
                          <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.2 rounded border", style.bg, style.text, style.border)}>
                            {badge.rarity}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {badge.awardedBy || "BolivarPide Oficial"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (addresses.length === 0) openAddAddress();
                  else openEditAddress(selectedAddressId || addresses[0].id);
                }}
                className="flex w-full items-center justify-between rounded-xl bg-[#f5f1eb] p-3.5 text-left transition hover:bg-[#ede4d9] dark:bg-[#231f1c] dark:hover:bg-[#2a2623]"
              >
                <div>
                  <h4 className="text-[11px] font-medium text-gray-400">Dirección principal</h4>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {currentAddressName}
                  </p>
                </div>
                <MaterialSymbol icon="location_on" size={18} className="text-[#9a0002]" />
              </button>

              {/* Compact Conversion Options (Comercio & Delivery) */}
              <div className="space-y-2 pt-1">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                  Oportunidades & Comunidad
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link
                    href={isBusinessOwner ? "/negocio" : "/negocio/registro"}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#9a0002]/8 hover:bg-[#9a0002]/15 border border-[#9a0002]/15 text-[#9a0002] dark:text-red-300 transition-all group active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-[#9a0002]/15 flex items-center justify-center text-[#9a0002] dark:text-red-300 flex-shrink-0">
                        <MaterialSymbol icon="storefront" size={18} fill />
                      </span>
                      <div className="min-w-0">
                        <h5 className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">
                          {isBusinessOwner ? "Mi negocio gastronómico" : "Adherir negocio"}
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {isBusinessOwner ? "Panel de administración" : "Publicá tu carta digital"}
                        </p>
                      </div>
                    </div>
                    <MaterialSymbol icon="arrow_forward" size={16} className="text-[#9a0002]/70 dark:text-red-400/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>

                  <button
                    type="button"
                    className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 dark:text-amber-300 transition-all group active:scale-98 cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0">
                        <MaterialSymbol icon="sports_motorsports" size={18} fill />
                      </span>
                      <div className="min-w-0">
                        <h5 className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">
                          Sumarme como repartidor
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          Ingresos y horarios flexibles
                        </p>
                      </div>
                    </div>
                    <MaterialSymbol icon="arrow_forward" size={16} className="text-amber-600/70 dark:text-amber-400/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                >
                  <MaterialSymbol icon="logout" size={18} />
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>

          <AvatarPickerModal
            isOpen={isAvatarModalOpen}
            currentAvatar={profile.avatar}
            onClose={() => setIsAvatarModalOpen(false)}
            onSave={async (newAvatar) => {
              const next = { ...profile, avatar: newAvatar };
              updateAvatar(newAvatar);
              try {
                await persistProfile(next);
                flashToast("Avatar guardado.");
              } catch {
                flashToast("No se pudo guardar el avatar.");
              }
            }}
          />

          <BadgeDetailModal
            badge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        </>
      );
    }

    return (
          <div className="space-y-8 text-gray-800 dark:text-gray-200 animate-fade-in">
            {/* Menús del momento */}
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-gray-100">Menús del momento</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Lo que más se pide ahora</p>
                </div>
              </div>

              <div className="relative w-full">
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-[5px] w-14 bg-gradient-to-r from-[#f3efe8] from-40% dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                    trendingScrollState.isAtStart ? "opacity-0" : "opacity-100"
                  )}
                />
                <div
                  className={cn(
                    "absolute right-0 top-0 bottom-[5px] w-14 bg-gradient-to-l from-[#f3efe8] from-40% dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                    trendingScrollState.isAtEnd ? "opacity-0" : "opacity-100"
                  )}
                />

                <div
                  ref={trendingContainerRef}
                  className="flex items-center gap-4 overflow-x-auto custom-scrollbar px-1 pt-1 pb-3"
                >
                  {TRENDING_ITEMS.map((item) => {
                    const ownerChain = FEATURED_CHAINS.find((c) => c.id === item.chainId);
                    return (
                      <TrendingMenuCard
                        key={item.id}
                        item={item}
                        ownerChain={ownerChain}
                        className="w-[220px] flex-shrink-0"
                      />
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Cadenas destacadas */}
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-gray-100">Cadenas destacadas</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Locales recomendados cerca tuyo</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentChainPage(0)}
                    className={cn(
                      "w-5 h-1.5 rounded-full transition-all cursor-pointer",
                      currentChainPage === 0 ? "bg-[#9a0002]" : "bg-[#ddd4c8] dark:bg-[#302c28]"
                    )}
                  />
                  <button
                    onClick={() => setCurrentChainPage(1)}
                    className={cn(
                      "w-5 h-1.5 rounded-full transition-all cursor-pointer",
                      currentChainPage === 1 ? "bg-[#9a0002]" : "bg-[#ddd4c8] dark:bg-[#302c28]"
                    )}
                  />
                </div>
              </div>

              <div
                ref={chainContainerRef}
                className="relative overflow-hidden w-full min-h-[400px] md:min-h-[210px]"
                onTouchStart={handleChainTouchStart}
                onTouchMove={handleChainTouchMove}
                onTouchEnd={handleChainTouchEnd}
              >
                <div
                  className="flex w-full transition-transform duration-500 ease-in-out gap-6"
                  style={{ transform: `translateX(calc(-${currentChainPage} * (100% + 24px)))` }}
                >
                  <div className="w-full flex-shrink-0 flex flex-col md:grid md:grid-cols-2 gap-5">
                    {randomizedChains.slice(0, 2).map((chain) => (
                      <FeaturedCard key={chain.id} chain={chain} />
                    ))}
                  </div>
                  <div className="w-full flex-shrink-0 flex flex-col md:grid md:grid-cols-2 gap-5">
                    {randomizedChains.slice(2, 4).map((chain) => (
                      <FeaturedCard key={chain.id} chain={chain} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Populares — quiet strip */}
            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-gray-100">Más populares</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Los favoritos de la zona</p>
              </div>
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                {FEATURED_CHAINS.map((chain) => (
                  <Link
                    key={chain.id}
                    href={`/c/${chain.id}`}
                    className="min-w-[200px] flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.12)] cursor-pointer hover:border-[#9a0002]/25 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#f5f1eb] dark:bg-[#2a2623]">
                      {chain.logoImage ? (
                        <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                          {chain.logoEmoji || chain.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{chain.name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <MaterialSymbol icon="star" size={12} fill className="text-[#9a0002]" />
                        {chain.rating} · {chain.timeEstimate}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
    );
  };

  const savedAddresses = addresses.map(addressToSummary);

  const currentAddressName =
    savedAddresses.find((a) => a.id === selectedAddressId)?.label ||
    savedAddresses[0]?.label ||
    "Agregar dirección";

  function contactPreset() {
    const src = addresses.find((a) => a.isDefault) ?? addresses[addresses.length - 1];
    if (src) {
      const digits = src.contactPhone.replace(/\D/g, "");
      const local = digits.startsWith("549") ? digits.slice(3) : digits;
      return {
        firstName: src.contactFirstName,
        lastName: src.contactLastName,
        phoneLocal: formatLocalMobile(local),
      };
    }
    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      phoneLocal: "",
    };
  }

  async function handleSelectAddress(id: string) {
    setSelectedAddressId(id);
    setShowLocationDropdown(false);
    try {
      const updated = await setDefaultAddressAction(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === updated.id })),
      );
    } catch {
      flashToast("No se pudo cambiar la dirección.");
    }
  }

  function openAddAddress() {
    setEditingAddress(null);
    setAddressFormOpen(true);
    setShowLocationDropdown(false);
  }

  function openEditAddress(id: string) {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setEditingAddress(addr);
    setAddressFormOpen(true);
    setShowLocationDropdown(false);
  }

  function handleLocationClick() {
    if (addresses.length === 0) {
      openAddAddress();
      return;
    }
    setShowLocationDropdown((v) => !v);
  }

  function handleAddressSaved(addr: UserAddress) {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === addr.id);
      if (exists) {
        return prev.map((a) =>
          a.id === addr.id ? addr : addr.isDefault ? { ...a, isDefault: false } : a,
        );
      }
      return addr.isDefault
        ? [...prev.map((a) => ({ ...a, isDefault: false })), addr]
        : [...prev, addr];
    });
    if (addr.isDefault || !selectedAddressId) setSelectedAddressId(addr.id);
  }

  function handleAddressDeleted(deleted: UserAddress) {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== deleted.id);
      const fallback = next.find((a) => a.isDefault) ?? next[0];
      setSelectedAddressId((cur) => (cur === deleted.id ? fallback?.id ?? "" : cur));
      return next;
    });
  }

  return (
    <>
      <BrandSplash show={showSplash} onSkip={skipSplash} />

      <div className="min-h-screen flex flex-col bg-[#f3efe8] pb-10 pt-[64px] dark:bg-[#1c1917] md:pt-0 relative">

      {/* Search overlay dimmer only — location/notifications use a transparent dismiss hit-area */}
      {isSearchFocused && (
        <div
          className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] z-30 transition-all duration-300"
          onClick={() => setIsSearchFocused(false)}
        />
      )}

      {/* Header / Bottom Navigation wrapper */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onSearchFocus={() => setIsSearchFocused(true)}
        searchQuery={searchQuery}
        locationLabel={isAuthenticated ? currentAddressName : undefined}
        savedAddresses={savedAddresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={handleSelectAddress}
        onEditAddress={openEditAddress}
        onAddAddress={openAddAddress}
        maxAddresses={MAX_USER_ADDRESSES}
        showLocationDropdown={showLocationDropdown}
        onLocationClick={handleLocationClick}
      />

      {/* Full-bleed curved home header */}
      {currentTab === "home" && (
        <div className="relative w-full animate-fade-in">
          {isLoading ? (
            <div className="relative w-full animate-pulse">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#9a0002] to-[#6b0001] px-4 pb-14 pt-4">
                <div className="mx-auto flex max-w-[1040px] gap-2">
                  <div className="h-10 flex-1 rounded-xl bg-white/20" />
                  <div className="h-10 w-10 rounded-full bg-white/20" />
                </div>
                <div className="mx-auto mt-2 flex flex-col items-center space-y-1">
                  <div className="h-2 w-20 rounded bg-white/15" />
                  <div className="h-3.5 w-32 rounded bg-white/25" />
                </div>
                {/* Approximate circular arc (s≈56, R≈(375²/4+56²)/(2·56)≈340) */}
                <svg
                  className="pointer-events-none absolute bottom-0 left-0 h-14 w-full"
                  viewBox="0 0 375 56"
                  aria-hidden
                >
                  <path
                    d="M0 0 A 340 340 0 0 1 375 0 L 375 56 L 0 56 Z"
                    className="fill-[#f3efe8] dark:fill-[#1c1917]"
                  />
                </svg>
              </div>
              <div className="relative -mt-14 h-[118px] w-full">
                {Array.from({ length: 4 }).map((_, i) => {
                  const W = 375;
                  const edgePad = 38 + 8;
                  const x = edgePad + (i / 3) * (W - edgePad * 2);
                  const dx = x - W / 2;
                  const R = 340;
                  const s = 56;
                  const y = s - R + Math.sqrt(Math.max(0, R * R - dx * dx)) - 14;
                  return (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center gap-1.5"
                      style={{
                        left: `calc(${(x / W) * 100}% - 29px)`,
                        transform: `translateY(${y}px)`,
                      }}
                    >
                      <div className="h-[58px] w-[58px] rounded-full bg-[#e8ddd0] dark:bg-[#302c28]" />
                      <div className="h-2 w-12 rounded bg-[#e0d5c8] dark:bg-[#302c28]" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <CurvedHomeHeader
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              activeSpecialty={activeSpecialty}
              onSpecialtyChange={setActiveSpecialty}
            />
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[1040px] mx-auto px-4 md:px-8 relative">
        <div className={cn(currentTab === "home" ? "mt-2 md:mt-4" : "mt-4 md:mt-6")}>
          {renderTabContent()}
        </div>
      </div>

      {/* Full-screen search overlay */}
      {isSearchFocused && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#faf6f1] px-4 pb-20 pt-4 animate-fade-in dark:bg-[#0b0b0d]">
          {/* Header Row */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => setIsSearchFocused(false)}
              className="w-10 h-10 rounded-full bg-[#ede4d9] dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732]/80 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-[#d4cfc9] shadow-sm cursor-pointer flex-shrink-0 active:scale-95 transition-all"
            >
              <MaterialSymbol icon="arrow_back" size={16} />
            </button>

            {/* Input Capsule Box */}
            <div
              className={`flex-1 h-10 bg-white dark:bg-[#2a2623] border rounded-xl flex items-center px-3.5 gap-2.5 transition-all duration-300 relative ${searchQuery !== ""
                ? "border-[#9a0002] shadow-[0_0_16px_rgba(154,0,2,0.22)]"
                : "border-[#9a0002]/50 shadow-[0_0_12px_rgba(154,0,2,0.12)]"
                }`}
            >
              <MaterialSymbol icon="search" size={17} className="shrink-0 text-[#9a0002]" />
              <SmoothInput
                autoFocus
                placeholder="Buscar comida, locales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[13px] font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />

              {searchQuery !== "" && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-5 h-5 rounded-full bg-gray-200 dark:bg-[#302c28] text-gray-500 hover:text-[#9a0002] flex items-center justify-center transition-all cursor-pointer"
                >
                  <MaterialSymbol icon="close" size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Results Viewport Panel: Horizontal Scroll Tracks with scroll-fade-middle */}
          <div className="mt-6 flex-1 flex flex-col gap-6 text-gray-800 dark:text-gray-200">
            <SearchOverlayContent
              recentSearches={recentSearches}
              setRecentSearches={setRecentSearches}
              topSearches={topSearches}
              recommended={randomizedRecommended}
              onSelect={(term) => {
                setSearchQuery(term);
                setIsSearchFocused(false);
              }}
            />
          </div>
        </div>
      )}

      <AddressFormModal
        open={addressFormOpen}
        editing={editingAddress}
        presetContact={contactPreset()}
        onClose={() => {
          setAddressFormOpen(false);
          setEditingAddress(null);
        }}
        onSaved={handleAddressSaved}
        onDeleted={handleAddressDeleted}
      />

    </div>
    </>
  );
}

// Inner helper component for Search Results contents
interface SearchContentProps {
  recentSearches: string[];
  setRecentSearches: React.Dispatch<React.SetStateAction<string[]>>;
  topSearches: string[];
  recommended: FeaturedChain[];
  onSelect: (term: string) => void;
}

function SearchOverlayContent({
  recentSearches,
  setRecentSearches,
  topSearches,
  recommended,
  onSelect
}: SearchContentProps) {
  return (
    <div className="space-y-6">
      {/* Búsquedas Recientes */}
      {recentSearches.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Búsquedas recientes</h4>
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-1 pb-2 px-4 -mx-4 scroll-fade-middle">
            {recentSearches.map((term, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 pl-3.5 pr-2 py-2 bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] rounded-full text-[13px] font-medium whitespace-nowrap hover:border-[#9a0002]/30 transition-all cursor-pointer group"
                onClick={() => onSelect(term)}
              >
                <span>{term}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecentSearches(recentSearches.filter((t) => t !== term));
                  }}
                  className="w-4 h-4 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#2a2623] hover:bg-red-50 hover:text-[#9a0002] text-gray-400 cursor-pointer"
                >
                  <MaterialSymbol icon="close" size={8} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Búsquedas */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Top Búsquedas</h4>
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-1 pb-2 px-4 -mx-4 scroll-fade-middle">
          {topSearches.map((term, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(term)}
              className="px-4 py-2 bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] rounded-full text-[13px] font-medium whitespace-nowrap hover:border-[#9a0002]/30 hover:text-[#9a0002] transition-all cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Cadenas Recomendadas */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Cadenas recomendadas</h4>
        <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pt-1 pb-4 px-4 -mx-4 scroll-fade-middle">
          {recommended.map((chain) => (
            <div
              key={chain.id}
              onClick={() => onSelect(chain.name)}
              className="w-[220px] flex-shrink-0 p-3 bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] rounded-2xl shadow-[0_8px_30px_-12px_rgba(61,43,31,0.12)] flex items-center justify-between cursor-pointer hover:border-[#9a0002]/25 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-[#3d3732] shadow-xs">
                  {chain.logoImage ? (
                    <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#faf6f1] dark:bg-[#2a2623] flex items-center justify-center text-xs font-bold">
                      {chain.logoEmoji || chain.id}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-semibold text-[13px] text-gray-900 dark:text-gray-100">{chain.name}</h5>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-0.5">
                    <MaterialSymbol icon="schedule" size={11} className="text-gray-400" />
                    <span>{chain.timeEstimate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f5f1eb] dark:bg-[#231f1c] text-gray-800 dark:text-gray-200 py-0.5 px-2 rounded-full flex items-center gap-0.5 font-semibold text-[11px]">
                <MaterialSymbol icon="star" size={11} fill className="text-[#9a0002]" />
                <span>{chain.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ chain }: { chain: FeaturedChain }) {
  return (
    <Link
      href={`/c/${chain.id}`}
      className="group rounded-[20px] bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] overflow-hidden transition-all duration-300 cursor-pointer block"
    >
      <div className={`h-[130px] ${chain.bannerBg} relative flex items-center justify-center p-6 text-white overflow-hidden`}>
        {chain.bannerImage && (
          <img
            src={chain.bannerImage}
            alt={chain.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 text-center">
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider text-white border border-white/25">
            Destacado
          </span>
          <h4 className="text-lg font-bold mt-1.5 drop-shadow-md text-white">{chain.name}</h4>
          <p className="text-[12px] text-white/90 font-medium drop-shadow-sm">{chain.bannerText}</p>
        </div>
      </div>

      <div className="h-[72px] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#3d3732] shadow-sm flex-shrink-0 bg-[#f5f1eb]">
            {chain.logoImage ? (
              <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#f5f1eb] dark:bg-[#2a2623] flex items-center justify-center text-lg">
                {chain.logoEmoji}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h5 className="font-semibold text-[13px] text-gray-900 dark:text-gray-100 truncate">{chain.name}</h5>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-0.5">
              <MaterialSymbol icon="schedule" size={12} className="text-gray-400" />
              <span>{chain.timeEstimate}</span>
              <span className="text-gray-300">·</span>
              <span>Envío ${chain.deliveryFee.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#f5f1eb] dark:bg-[#231f1c] text-gray-800 dark:text-gray-200 py-1 px-2.5 rounded-full flex items-center gap-1 font-semibold text-[12px] flex-shrink-0">
          <MaterialSymbol icon="star" size={12} fill className="text-[#9a0002]" />
          <span>{chain.rating}</span>
        </div>
      </div>
    </Link>
  );
}

function TrendingMenuCard({
  item,
  ownerChain,
  className
}: {
  item: TrendingItem;
  ownerChain: FeaturedChain | undefined;
  className?: string;
}) {
  const { openProduct, quickAdd } = useCart();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openProduct(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct(item);
        }
      }}
      className={cn(
        "bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] rounded-[20px] flex flex-col overflow-hidden hover:border-[#9a0002]/25 transition-all duration-300 group cursor-pointer text-left",
        className
      )}
    >
      <div className="h-[125px] w-full relative overflow-hidden bg-[#f5f1eb] dark:bg-[#231f1c]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {item.emoji}
          </div>
        )}
      </div>

      <div className="p-3.5 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#f0ebe4] dark:border-[#2a2623] pb-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-[#f5f1eb]">
              {ownerChain?.logoImage ? (
                <img src={ownerChain.logoImage} alt={ownerChain.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px]">
                  {ownerChain?.logoEmoji || "🍔"}
                </div>
              )}
            </div>
            <span className="font-semibold text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-[90px]">
              {ownerChain?.name || item.storeName}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-[11px] text-gray-400 font-medium flex-shrink-0">
            <MaterialSymbol icon="star" size={11} fill className="text-[#9a0002]" />
            <span>{ownerChain?.rating || "4.5"}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between min-h-[48px]">
          <h4 className="font-semibold text-[13px] text-gray-900 dark:text-gray-100 leading-tight truncate group-hover:text-[#9a0002] transition-colors">
            {item.name}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[13px] font-bold text-[#9a0002]">${item.price.toLocaleString("es-AR")}</span>
            <button
              type="button"
              aria-label={`Agregar ${item.name}`}
              onClick={(e) => {
                e.stopPropagation();
                quickAdd(item);
              }}
              className="w-7 h-7 rounded-full bg-[#9a0002] text-white hover:bg-[#6b0001] flex items-center justify-center text-sm font-bold cursor-pointer active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
