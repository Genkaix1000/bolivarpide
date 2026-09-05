"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import Navbar from "@/components/Navbar";
import CurvedHomeHeader from "@/components/CurvedHomeHeader";
import { ProductImageToggle } from "@/components/menu/ProductImageToggle";
import { ProductImagePlaceholder } from "@/components/menu/ProductImagePlaceholder";
import { StoreRatingBadge } from "@/components/store/StoreRatingBadge";
import { cn } from "@/lib/utils";
import { PROMO_BANNERS } from "@/lib/business/staticContent";
import type {
  FeaturedChain,
  PromoBanner,
  TrendingItem,
} from "@/lib/business/types";
import type { HomeData } from "@/lib/business/homeData";
import { useCart } from "@/components/CartProvider";
import { BrandSplash, useBrandSplash } from "@/components/BrandSplash";
import { SPLASH_HOME } from "@/lib/firstVisit";
import { useUserProfile } from "@/components/UserProfileProvider";
import { ProfileView } from "@/components/profile/ProfileView";
import { SearchAutocompleteOverlay } from "@/components/search/SearchAutocompleteOverlay";
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

export function HomeContent({ initial }: { initial: HomeData }) {
  const { profile, isAuthenticated } = useUserProfile();
  const searchParams = useSearchParams();
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const topSearches = ["Empanadas", "Sushi", "Desayuno", "Helado", "Envíos Gratis"];

  // Carousels State (data servida por RSC/ISR, no desde el cliente)
  const [randomizedRecommended] = useState<FeaturedChain[]>(initial.recommended);
  const [randomizedChains, setRandomizedChains] = useState<FeaturedChain[]>(initial.chains);
  const [latestAdditions, setLatestAdditions] = useState<FeaturedChain[]>(initial.chains);
  const [currentChainPage, setCurrentChainPage] = useState(0);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>(initial.trendingItems);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(
    initial.promoBanners.length > 0 ? initial.promoBanners : PROMO_BANNERS,
  );
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Menús del Momento Dynamic Scroll Mask State
  const [trendingScrollState, setTrendingScrollState] = useState({ isAtStart: true, isAtEnd: false });

  // Container Refs for Mouse Wheel Scroll Paging
  const chainContainerRef = useRef<HTMLDivElement>(null);
  const trendingContainerRef = useRef<HTMLDivElement>(null);

  // Touch Swipe Gesture Tracking
  const [chainTouchStart, setChainTouchStart] = useState<number | null>(null);
  const [chainTouchEnd, setChainTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Data del home: servida por RSC/ISR (src/lib/business/homeData.ts). El cliente
  // ya no fetchea Supabase ni mantiene un cache localStorage propio.
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "home") queueMicrotask(() => setCurrentTab("home"));
    if (tab === "profile" && isAuthenticated) queueMicrotask(() => setCurrentTab("profile"));
  }, [searchParams, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && currentTab === "profile") {
      queueMicrotask(() => setCurrentTab("home"));
    }
  }, [isAuthenticated, currentTab]);

  useEffect(() => {
    const open = () => {
      setEditingAddress(null);
      setAddressFormOpen(true);
      setShowLocationDropdown(false);
    };
    window.addEventListener("bolivarpide:open-address", open);
    return () => window.removeEventListener("bolivarpide:open-address", open);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      queueMicrotask(() => {
        setAddresses([]);
        setSelectedAddressId("");
      });
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
    if (tabId === "profile" && !isAuthenticated) return;
    setCurrentTab(tabId);
  };

  const renderTabContent = () => {
    if (currentTab === "profile") {
      if (!isAuthenticated) return null;
      return (
        <ProfileView
          onManageAddresses={() => {
            if (addresses.length === 0) openAddAddress();
            else openEditAddress(selectedAddressId || addresses[0].id);
          }}
          savedAddressesCount={addresses.length}
          currentAddressLabel={currentAddressName}
        />
      );
    }

    return (
          <div className="space-y-8 text-gray-800 dark:text-gray-200 animate-fade-in">
            {/* Menús del momento */}
            {(isDataLoading || trendingItems.length > 0) && (
              <section id="trending" className="space-y-4">
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
                    {isDataLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-[220px] h-[190px] flex-shrink-0 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] animate-pulse border border-black/[0.04] dark:border-white/[0.04]"
                        />
                      ))
                    ) : (
                      trendingItems.map((item) => {
                        const ownerChain = randomizedChains.find((c) => c.id === item.chainId);
                        return (
                          <TrendingMenuCard
                            key={item.id}
                            item={item}
                            ownerChain={ownerChain}
                            className="w-[220px] flex-shrink-0"
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Cadenas destacadas */}
            {(isDataLoading || randomizedChains.length > 0) && (
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-gray-100">Cadenas destacadas</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">Locales recomendados cerca tuyo</p>
                  </div>
                  {randomizedChains.length > 2 && (
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
                  )}
                </div>

                <div
                  ref={chainContainerRef}
                  className="relative overflow-hidden w-full min-h-[140px] md:min-h-[210px]"
                  onTouchStart={handleChainTouchStart}
                  onTouchMove={handleChainTouchMove}
                  onTouchEnd={handleChainTouchEnd}
                >
                  {isDataLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="h-[202px] rounded-[20px] bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
                      <div className="h-[202px] rounded-[20px] bg-black/[0.04] dark:bg-white/[0.04] animate-pulse hidden md:block" />
                    </div>
                  ) : (
                    <div
                      className="flex w-full transition-transform duration-500 ease-in-out gap-6"
                      style={{ transform: `translateX(calc(-${currentChainPage} * (100% + 24px)))` }}
                    >
                      <div className="w-full flex-shrink-0 flex flex-col md:grid md:grid-cols-2 gap-5">
                        {randomizedChains.slice(0, 2).map((chain) => (
                          <FeaturedCard key={chain.id} chain={chain} />
                        ))}
                      </div>
                      {randomizedChains.length > 2 && (
                        <div className="w-full flex-shrink-0 flex flex-col md:grid md:grid-cols-2 gap-5">
                          {randomizedChains.slice(2, 4).map((chain) => (
                            <FeaturedCard key={chain.id} chain={chain} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Últimas adiciones — locales dados de alta recientemente */}
            {(latestAdditions.length > 0 ? latestAdditions : randomizedChains).length > 0 && (
              <section className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-gray-100">
                    Últimas adiciones
                  </h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    Nuevos comercios que se sumaron a BolivarPide
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                  {(latestAdditions.length > 0 ? latestAdditions : randomizedChains).map((chain) => (
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
            )}
          </div>
    );
  };

  const savedAddresses = addresses.map(addressToSummary);

  const currentAddressName =
    savedAddresses.find((a) => a.id === selectedAddressId)?.label ||
    savedAddresses[0]?.label ||
    "Agregar dirección";

  const presetContact = useMemo(() => {
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
  }, [addresses, profile]);

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

      <div
        className={cn(
          "min-h-dvh flex flex-col bg-background dark:bg-[#1c1917] relative overscroll-y-contain",
          "pt-[64px] md:pt-0",
          "pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]",
          currentTab === "profile" && "pb-[max(7rem,env(safe-area-inset-bottom,0px)+4rem)]",
        )}
      >

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
              promoBanners={promoBanners}
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

      {/* Full-screen search autocomplete overlay */}
      <SearchAutocompleteOverlay
        isOpen={isSearchFocused}
        onClose={() => setIsSearchFocused(false)}
        initialQuery={searchQuery}
        topSearches={topSearches}
        recommendedChains={randomizedRecommended}
        onSelectCategory={(catName) => {
          setSearchQuery(catName);
          setIsSearchFocused(false);
        }}
      />

      <AddressFormModal
        open={addressFormOpen}
        editing={editingAddress}
        presetContact={presetContact}
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

function FeaturedCard({ chain }: { chain: FeaturedChain }) {
  const bgClass = chain.bannerBg?.startsWith("bg-")
    ? chain.bannerBg
    : chain.bannerBg?.startsWith("from-")
      ? `bg-gradient-to-r ${chain.bannerBg}`
      : chain.bannerBg || "bg-gradient-to-r from-[#9a0002] to-[#6b0001]";

  return (
    <Link
      href={`/c/${chain.id}`}
      className="group rounded-[20px] bg-white dark:bg-[#1c1917] border border-black/[0.04] dark:border-[#3d3732] shadow-[0_8px_30px_-12px_rgba(61,43,31,0.14)] overflow-hidden transition-all duration-300 cursor-pointer block"
    >
      <div className={cn("h-[130px] relative flex items-center justify-center p-6 text-white overflow-hidden", bgClass)}>
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
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#f5f1eb] dark:bg-[#231f1c]">
        {(item.iconImage || item.photoImage || item.image) ? (
          <ProductImageToggle
            iconUrl={item.iconImage ?? item.image}
            photoUrl={item.photoImage ?? item.image}
            className="h-full w-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ProductImagePlaceholder className="h-full w-full" />
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
          <div className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium">
            <StoreRatingBadge
              rating={item.storeRating ?? ownerChain?.rating ?? 0}
              reviewsCount={item.storeReviewsCount ?? ownerChain?.reviewsCount ?? 0}
              size="sm"
            />
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
