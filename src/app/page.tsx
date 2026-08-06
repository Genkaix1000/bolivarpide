"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  /** Viewport Y where the location backdrop should start (below the location control). */
  const [locationBackdropTop, setLocationBackdropTop] = useState<number | null>(null);

  const handleLocationAnchorChange = useCallback((bottomY: number | null) => {
    setLocationBackdropTop(bottomY);
  }, []);

  // Mocked business ownership flag (hardcoded per spec — no auth yet)
  const [isBusinessOwner] = useState(true);

  // Saved Addresses Mock Data
  const [selectedAddressId, setSelectedAddressId] = useState("addr-1");
  const savedAddresses = [
    { id: "addr-1", name: "St. Abigail, Calle Ficticia 123" },
    { id: "addr-2", name: "Trabajo, Av. Corrientes 456" }
  ];

  // Searchbar States
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(["Pizza", "Hamburguesa", "Café"]);
  const topSearches = ["Empanadas", "Sushi", "Desayuno", "Helado", "Envíos Gratis"];
  const [randomizedRecommended, setRandomizedRecommended] = useState<FeaturedChain[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carousels State
  const [randomizedChains, setRandomizedChains] = useState<FeaturedChain[]>([]);
  const [currentChainPage, setCurrentChainPage] = useState(0);
  const [activePopularIndex, setActivePopularIndex] = useState(4);
  const [isPopularTransitionEnabled, setIsPopularTransitionEnabled] = useState(true);
  const virtualChains = [...FEATURED_CHAINS, ...FEATURED_CHAINS, ...FEATURED_CHAINS];

  // Menús del Momento Dynamic Scroll Mask State
  const [trendingScrollState, setTrendingScrollState] = useState({ isAtStart: true, isAtEnd: false });

  // Container Refs for Mouse Wheel Scroll Paging
  const chainContainerRef = useRef<HTMLDivElement>(null);
  const trendingContainerRef = useRef<HTMLDivElement>(null);
  const popularContainerRef = useRef<HTMLDivElement>(null);
  const lastPopularWheelTimeRef = useRef<number>(0);

  // Touch Swipe Gesture Tracking
  const [chainTouchStart, setChainTouchStart] = useState<number | null>(null);
  const [chainTouchEnd, setChainTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Simulate loading on entry
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);


  // Boundary Checks for Popular Chains Spotlight Loop
  useEffect(() => {
    if (activePopularIndex >= 8) {
      const timeout = setTimeout(() => {
        setIsPopularTransitionEnabled(false);
        setActivePopularIndex(4);
      }, 500); // 500ms matches transition duration-500
      return () => clearTimeout(timeout);
    }
    if (activePopularIndex <= 3) {
      const timeout = setTimeout(() => {
        setIsPopularTransitionEnabled(false);
        setActivePopularIndex(7);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [activePopularIndex]);

  // Shuffling Featured Chains & Recommended on Mount
  useEffect(() => {
    const shuffled = [...FEATURED_CHAINS].sort(() => Math.random() - 0.5);
    setRandomizedChains(shuffled);

    const shuffledRec = [...FEATURED_CHAINS].sort(() => Math.random() - 0.5);
    setRandomizedRecommended(shuffledRec);
  }, [currentTab]); // reshuffle if tab changes or on load

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

  // Mouse Scroll Wheel Page Swapper for Cadenas más populares (spotlight index)
  useEffect(() => {
    const container = popularContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const now = Date.now();
        if (now - lastPopularWheelTimeRef.current > 250) {
          e.preventDefault();
          setIsPopularTransitionEnabled(true);
          if (e.deltaY > 0) {
            setActivePopularIndex((prev) => prev + 1);
          } else {
            setActivePopularIndex((prev) => prev - 1);
          }
          lastPopularWheelTimeRef.current = now;
        } else {
          e.preventDefault();
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);


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

  // Render different views based on Tab
  const renderTabContent = () => {
    switch (currentTab) {
      case "discover":
        return (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto bg-[#faf6f1] dark:bg-[#1c1917] rounded-[24px] border border-gray-100 dark:border-[#3d3732] penpot-shadow mt-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 flex items-center justify-center mb-4 text-2xl shadow-inner border border-yellow-100 dark:border-yellow-900/30">
              🔍
            </div>
            <h3 className="font-extrabold text-base mb-1 text-gray-800 dark:text-gray-200">Explora Nuevos Sabores</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
              El buscador avanzado con Supabase Full-Text Search e IA estará listo en la siguiente fase.
            </p>
            <button
              onClick={() => setCurrentTab("home")}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-[#9a0002] to-[#6b0001] text-white text-xs font-bold rounded-full hover:opacity-95 transition-all shadow-md shadow-red-500/20 cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        );
      case "cart":
        return (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto bg-[#faf6f1] dark:bg-[#1c1917] rounded-[24px] border border-gray-100 dark:border-[#3d3732] penpot-shadow mt-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-[#9a0002] flex items-center justify-center mb-4 text-2xl shadow-inner border border-red-100 dark:border-red-900/30">
              🛒
            </div>
            <h3 className="font-extrabold text-base mb-1 text-gray-800 dark:text-gray-200">Tu Carrito está Vacío</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
              Los productos que agregues a tu pedido aparecerán en esta pestaña para continuar al pago.
            </p>
            <button
              onClick={() => setCurrentTab("home")}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-[#9a0002] to-[#6b0001] text-white text-xs font-bold rounded-full hover:opacity-95 transition-all shadow-md shadow-red-500/20 cursor-pointer"
            >
              Ver menú de locales
            </button>
          </div>
        );
      case "profile":
        return (
          <div className="max-w-md mx-auto bg-[#faf6f1] dark:bg-[#1c1917] rounded-[24px] border border-gray-100 dark:border-[#3d3732] penpot-shadow mt-6 p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-[#3d3732]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#9a0002] to-[#6b0001] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                SA
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-100">St. Abigail User</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">client.abigail@delivery.com</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#ede4d9] dark:bg-[#231f1c]/50 border border-gray-100 dark:border-[#3d3732]/80">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dirección Principal</h4>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{savedAddresses.find(a => a.id === selectedAddressId)?.name || savedAddresses[0].name}</p>
                </div>
                <MaterialSymbol icon="location_on" size={16} className="text-[#9a0002]" />
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accesos Rápidos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {isBusinessOwner ? (
                    <Link href="/negocio/dashboard" className="py-2.5 px-3 bg-red-50 dark:bg-red-950/20 text-[#9a0002] text-[11px] font-bold rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-95 cursor-pointer block text-center">
                      🏪 Ir a mi negocio
                    </Link>
                  ) : (
                    <Link href="/negocio/registro" className="py-2.5 px-3 bg-red-50 dark:bg-red-950/20 text-[#9a0002] text-[11px] font-bold rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-95 cursor-pointer block text-center">
                      🏪 Abrir mi negocio
                    </Link>
                  )}
                  <button className="py-2.5 px-3 bg-red-50 dark:bg-red-950/20 text-[#9a0002] text-[11px] font-bold rounded-xl border border-red-100 dark:border-red-900/30 transition-all active:scale-95 cursor-pointer">
                    🛵 Ser repartidor
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case "home":
      default:
        return (
          <div className="space-y-8 text-gray-800 dark:text-gray-200">
            <div className="animate-fade-in flex flex-col gap-8">
                {/* 1. Featured Chains */}
                <div className="order-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base tracking-tight text-gray-800 dark:text-gray-200">Cadenas destacadas</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentChainPage(0)}
                        className={`w-4 h-1.5 rounded-full transition-all cursor-pointer ${currentChainPage === 0 ? "bg-[#9a0002]" : "bg-gray-300 dark:bg-[#302c28]"
                          }`}
                      />
                      <button
                        onClick={() => setCurrentChainPage(1)}
                        className={`w-4 h-1.5 rounded-full transition-all cursor-pointer ${currentChainPage === 1 ? "bg-[#9a0002]" : "bg-gray-300 dark:bg-[#302c28]"
                          }`}
                      />
                    </div>
                  </div>

                  {/* Viewport */}
                  <div
                    ref={chainContainerRef}
                    className="relative overflow-hidden w-full min-h-[425px] md:min-h-[220px] px-2 md:px-3 -mx-2 md:-mx-3 pb-6 pt-2"
                    onTouchStart={handleChainTouchStart}
                    onTouchMove={handleChainTouchMove}
                    onTouchEnd={handleChainTouchEnd}
                  >
                    <div
                      className="flex w-full transition-transform duration-500 ease-in-out gap-8"
                      style={{ transform: `translateX(calc(-${currentChainPage} * (100% + 32px)))` }}
                    >
                      {/* Page 1 */}
                      <div className="w-full flex-shrink-0 flex flex-col md:grid md:grid-cols-2 gap-6 px-2 md:px-3 py-1">
                        {randomizedChains.slice(0, 2).map((chain) => (
                          <FeaturedCard key={chain.id} chain={chain} />
                        ))}
                      </div>
                      {/* Page 2 */}
                      <div className="w-full flex-shrink-0 flex flex-col md:grid md:grid-cols-2 gap-6 px-2 md:px-3 py-1">
                        {randomizedChains.slice(2, 4).map((chain) => (
                          <FeaturedCard key={chain.id} chain={chain} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Menús del Momento */}
                <div className="order-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base tracking-tight text-gray-800 dark:text-gray-200">Menús del momento</h3>
                  </div>

                  {/* Relative wrapper for absolute scroll fade overlays (same pattern as negocio stock) */}
                  <div className="relative w-full">
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-[5px] w-14 bg-gradient-to-r from-[#faf6f1] from-40% dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                        trendingScrollState.isAtStart ? "opacity-0" : "opacity-100"
                      )}
                    />
                    <div
                      className={cn(
                        "absolute right-0 top-0 bottom-[5px] w-14 bg-gradient-to-l from-[#faf6f1] from-40% dark:from-[#1c1917] to-transparent pointer-events-none z-10 transition-opacity duration-300",
                        trendingScrollState.isAtEnd ? "opacity-0" : "opacity-100"
                      )}
                    />

                    <div
                      ref={trendingContainerRef}
                      className="flex items-center gap-4 overflow-x-auto custom-scrollbar px-3 pt-2 pb-4"
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
                </div>

                {/* 4. Cadenas más populares */}
                <div className="order-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base tracking-tight text-gray-800 dark:text-gray-200">Cadenas más populares</h3>
                  </div>

                  {/* Carousel container centering spotlights with custom wheel listener and scroll-fade-middle */}
                  <div
                    ref={popularContainerRef}
                    className="relative overflow-hidden w-full h-[95px] flex items-center justify-center scroll-fade-middle"
                  >
                    <div
                      className={`flex items-center gap-4 ${isPopularTransitionEnabled ? "transition-transform duration-500 ease-in-out" : ""
                        }`}
                      style={{ transform: `translateX(calc(50% - 120px - ${activePopularIndex * (240 + 16)}px))` }}
                    >
                      {virtualChains.map((chain, index) => {
                        const isActive = index === activePopularIndex;
                        return (
                          <div
                            key={index}
                            onClick={() => {
                              setIsPopularTransitionEnabled(true);
                              setActivePopularIndex(index);
                            }}
                            className={`w-[240px] flex-shrink-0 p-3.5 bg-[#faf6f1] dark:bg-[#1c1917] border rounded-[16px] flex items-center justify-between cursor-pointer transition-all duration-555 ${isActive
                              ? "scale-108 border-[#9a0002] shadow-lg shadow-red-500/10 opacity-100 z-10"
                              : "scale-90 border-[#ddd4c8] dark:border-[#3d3732]/80 opacity-50"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-[#3d3732] shadow-xs">
                                {chain.logoImage ? (
                                  <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`w-full h-full ${chain.logoBg || 'bg-yellow-400'} flex items-center justify-center text-xs font-bold`}>
                                    {chain.logoEmoji || chain.name[0]}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-[11px] text-gray-800 dark:text-gray-100">{chain.name}</h5>
                                <div className="flex items-center gap-1 text-[9px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                                  <MaterialSymbol icon="schedule" size={10} className="text-gray-400" />
                                  <span>{chain.timeEstimate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#faf6f1] dark:bg-[#2a2623] border border-gray-200 dark:border-[#3d3732] text-gray-800 dark:text-gray-200 py-0.5 px-2 rounded-lg flex items-center gap-0.5 font-extrabold text-[10px]">
                              <MaterialSymbol icon="star" size={9} fill className="text-[#9a0002]" />
                              <span>{chain.rating}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

          </div>
        );
    }
  };

  const currentAddressName = savedAddresses.find(a => a.id === selectedAddressId)?.name || savedAddresses[0].name;


  return (
    <>
      {/* Full-screen page loader — rendered at root level so it truly covers everything */}
      <AnimatePresence>
        {isLoading && <AwwwardsPageLoader key="page-loader" />}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col bg-[#faf6f1] pb-8 pt-[72px] dark:bg-[#1c1917] md:pt-0 relative">

      {/* Backdrop starts below the location control so the header/location stay sharp */}
      {showLocationDropdown && (
        <div
          className="fixed inset-x-0 bottom-0 z-45 bg-black/15 dark:bg-black/45 backdrop-blur-[2.5px]"
          style={{ top: locationBackdropTop ?? 0 }}
          onClick={() => {
            setShowLocationDropdown(false);
            setLocationBackdropTop(null);
          }}
        />
      )}

      {/* Background Dimmer Backdrop for search focus */}
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
        locationLabel={currentAddressName}
        savedAddresses={savedAddresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={(id) => {
          setSelectedAddressId(id);
          setShowLocationDropdown(false);
        }}
        showLocationDropdown={showLocationDropdown}
        onLocationClick={() => {
          setShowLocationDropdown(!showLocationDropdown);
        }}
      />

      {/* Full-bleed curved home header */}
      {currentTab === "home" && (
        <div className="relative w-full animate-fade-in">
          {isLoading ? (
            <div className="relative w-full animate-pulse">
              <div className="relative overflow-hidden bg-gradient-to-b from-[#9a0002] to-[#6b0001] px-4 pb-14 pt-4">
                <div className="mx-auto flex max-w-[1040px] gap-2">
                  <div className="h-[42px] flex-1 rounded-full bg-white/20" />
                  <div className="h-[42px] w-[42px] rounded-full bg-white/20" />
                  <div className="h-[42px] w-[42px] rounded-full bg-white/20" />
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
                    className="fill-[#faf6f1] dark:fill-[#1c1917]"
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
              locationLabel={currentAddressName}
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={(id) => {
                setSelectedAddressId(id);
                setShowLocationDropdown(false);
              }}
              onLocationClick={() => {
                setShowLocationDropdown(!showLocationDropdown);
              }}
              onLocationAnchorChange={handleLocationAnchorChange}
              showLocationDropdown={showLocationDropdown}
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
              className={`flex-1 h-[48px] bg-[#ede4d9] dark:bg-[#1c1917] border-[1.5px] rounded-[24px] flex items-center px-4 gap-2 transition-all duration-300 relative ${searchQuery !== ""
                ? "animate-typing-glow border-[#9a0002] shadow-[0_0_20px_rgba(154,0,2,0.3)]"
                : "border-[#9a0002] shadow-[0_0_15px_rgba(154,0,2,0.2)]"
                }`}
            >
              <MaterialSymbol icon="search" size={16} className="text-[#9a0002]" />
              <SmoothInput
                autoFocus
                placeholder="Buscar comida, locales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-bold"
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

    </div>
    </>
  );
}

const LOADING_WORDS = [
  { text: "BUSCAS.", isOutline: true },
  { text: "PEDIS.", isOutline: false },
  { text: "TENES.", isOutline: true },
  { text: "BOLIVARPIDE.", isOutline: false },
];

// Ultra-minimalist Accent Page Loader (Simultaneous Mechanical Letter-Drop Roller)
function AwwwardsPageLoader() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setWordIndex((prev) => {
        if (prev >= LOADING_WORDS.length - 1) {
          clearInterval(wordTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 550);
    return () => clearInterval(wordTimer);
  }, []);

  const currentWord = LOADING_WORDS[wordIndex];
  const characters = currentWord.text.split("");

  const outlineStyle: React.CSSProperties = {
    WebkitTextStrokeWidth: "2.5px",
    WebkitTextStrokeColor: "#ffffff",
    WebkitTextFillColor: "#9a0002",
    color: "#9a0002",
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#9a0002] flex items-center justify-center select-none overflow-hidden"
    >
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: "clamp(3.5rem, 14vw, 8rem)" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={wordIndex}
            className="absolute inset-0 flex items-center justify-center tracking-tight font-black uppercase leading-none"
            style={{ fontSize: "clamp(2.5rem, 11vw, 7rem)" }}
          >
            {characters.map((char, charIdx) => (
              <div key={charIdx} className="overflow-hidden inline-block" style={{ lineHeight: 1.2 }}>
                <motion.span
                  initial={{ y: "-100%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "100%" }}
                  transition={{
                    duration: 0.32,
                    delay: charIdx * 0.022,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                  style={{
                    display: "inline-block",
                    ...(currentWord.isOutline ? outlineStyle : { color: "#ffffff" }),
                  }}
                  className="font-black"
                >
                  {char}
                </motion.span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
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
                className="flex items-center gap-2.5 pl-3.5 pr-2 py-2 bg-[#faf6f1] dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732]/80 rounded-full text-xs font-bold whitespace-nowrap shadow-sm hover:border-[#9a0002]/30 transition-all cursor-pointer group"
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
              className="px-4 py-2 bg-[#faf6f1] dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732]/80 rounded-full text-xs font-bold whitespace-nowrap shadow-sm hover:border-[#9a0002]/30 hover:text-[#9a0002] transition-all cursor-pointer"
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
              className="w-[240px] flex-shrink-0 p-3.5 bg-[#faf6f1] dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732]/80 rounded-[16px] penpot-shadow flex items-center justify-between cursor-pointer hover:border-[#9a0002]/30 active:scale-98 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-[#3d3732] shadow-xs">
                  {chain.logoImage ? (
                    <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${chain.logoBg || 'bg-yellow-400'} flex items-center justify-center text-xs font-bold`}>
                      {chain.logoEmoji || chain.id}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-gray-800 dark:text-gray-100">{chain.name}</h5>
                  <div className="flex items-center gap-1 text-[9px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
                    <MaterialSymbol icon="schedule" size={10} className="text-gray-400" />
                    <span>{chain.timeEstimate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#faf6f1] dark:bg-[#2a2623] border border-gray-200 dark:border-[#3d3732] text-gray-800 dark:text-gray-200 py-0.5 px-2 rounded-lg flex items-center gap-0.5 font-extrabold text-[10px]">
                <MaterialSymbol icon="star" size={9} fill className="text-[#9a0002]" />
                <span>{chain.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable Featured Chain Card Component with hover styles
function FeaturedCard({ chain }: { chain: FeaturedChain }) {
  return (
    <div className="group rounded-[16px] bg-white dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732]/50 penpot-shadow overflow-hidden transition-all duration-300 cursor-pointer">
      {/* Banner */}
      <div className={`h-[130px] ${chain.bannerBg} relative flex items-center justify-center p-6 text-white overflow-hidden`}>
        {chain.bannerImage && (
          <img
            src={chain.bannerImage}
            alt={chain.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 transition-colors duration-300" />
        <div className="relative z-10 text-center">
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-white border border-white/30">
            Destacado
          </span>
          <h4 className="text-lg font-black mt-1.5 drop-shadow-md text-white">{chain.name}</h4>
          <p className="text-xs text-white/95 font-medium drop-shadow-sm">{chain.bannerText}</p>
        </div>
      </div>

      {/* Details */}
      <div className="h-[70px] px-4 flex items-center justify-between bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-full overflow-hidden border-2 border-white dark:border-[#3d3732] shadow-md flex-shrink-0">
            {chain.logoImage ? (
              <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${chain.logoBg} flex items-center justify-center text-xl`}>
                {chain.logoEmoji}
              </div>
            )}
          </div>
          <div>
            <h5 className="font-extrabold text-xs text-gray-800 dark:text-gray-100">{chain.name}</h5>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">
              <MaterialSymbol icon="schedule" size={11} className="text-gray-400" />
              <span>{chain.timeEstimate}</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span>Envío: ${chain.deliveryFee.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#faf6f1] dark:bg-[#2a2623] border border-gray-200 dark:border-[#3d3732] text-gray-800 dark:text-gray-200 py-1 px-2.5 rounded-xl flex items-center gap-1 font-extrabold text-xs">
          <MaterialSymbol icon="star" size={11} fill className="text-[#9a0002]" />
          <span>{chain.rating}</span>
        </div>
      </div>
    </div>
  );
}

// Reusable Trending Menu Card
function TrendingMenuCard({
  item,
  ownerChain,
  className
}: {
  item: TrendingItem;
  ownerChain: FeaturedChain | undefined;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732]/80 penpot-shadow rounded-[16px] p-0 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-[#9a0002]/40 transition-all duration-300 group cursor-pointer",
        className
      )}
    >
      {/* Product Image Box */}
      <div className="h-[125px] w-full relative overflow-hidden bg-[#ede4d9]/50 dark:bg-[#231f1c]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {item.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
      </div>

      {/* Product details with owner brand headers */}
      <div className="p-3 flex flex-col">
        {/* Owner Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#3d3732]/60 pb-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-[22px] h-[22px] rounded-full overflow-hidden border border-gray-100 dark:border-[#3d3732] flex-shrink-0">
              {ownerChain?.logoImage ? (
                <img src={ownerChain.logoImage} alt={ownerChain.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#faf6f1] dark:bg-[#2a2623] flex items-center justify-center text-[10px]">
                  {ownerChain?.logoEmoji || '🍔'}
                </div>
              )}
            </div>
            <span className="font-extrabold text-[10px] text-gray-700 dark:text-gray-300 truncate max-w-[85px]">
              {ownerChain?.name || item.storeName}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-[9px] text-gray-400 font-bold flex-shrink-0">
            <MaterialSymbol icon="star" size={9} fill className="text-[#9a0002]" />
            <span>{ownerChain?.rating || '4.5'}</span>
          </div>
        </div>

        {/* Item Name & Pricing */}
        <div className="flex flex-col justify-between h-[48px] mt-0.5">
          <h4 className="font-extrabold text-xs text-gray-800 dark:text-gray-100 leading-tight truncate group-hover:text-[#9a0002] transition-colors">
            {item.name}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#9a0002]">${item.price.toLocaleString("es-AR")}</span>
            <button className="w-6 h-6 rounded-full bg-[#9a0002] text-white hover:bg-[#850002] shadow-xs flex items-center justify-center font-black text-xs cursor-pointer active:scale-95 transition-all">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
