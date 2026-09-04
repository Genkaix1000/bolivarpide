"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { HighlightText } from "./HighlightText";
import { searchCatalogAction } from "@/lib/search/actions";
import type { CatalogSearchResult } from "@/lib/search/types";
import type { FeaturedChain } from "@/lib/mockData";

interface SearchAutocompleteOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  topSearches?: string[];
  recommendedChains?: FeaturedChain[];
  onSelectCategory?: (categoryId: string) => void;
}

const LOCAL_STORAGE_KEY = "bolivarpide_recent_searches";
const DEFAULT_RECENT = ["Pizza", "Hamburguesa", "Empanadas", "Helado"];

function getFoodFallbackImage(name: string, category?: string | null): string {
  const text = (name + " " + (category || "")).toLowerCase();
  if (text.includes("piz") || text.includes("fugazz") || text.includes("napo")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80";
  }
  if (text.includes("hamburg") || text.includes("burger") || text.includes("anbur") || text.includes("cheddar") || text.includes("bacon")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";
  }
  if (text.includes("empanad") || text.includes("pastel")) {
    return "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=300&q=80";
  }
  if (text.includes("sushi") || text.includes("roll") || text.includes("salmon") || text.includes("wok")) {
    return "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=300&q=80";
  }
  if (text.includes("helad") || text.includes("torta") || text.includes("postre") || text.includes("dulce")) {
    return "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=300&q=80";
  }
  if (text.includes("cafe") || text.includes("café") || text.includes("medialun") || text.includes("tostad") || text.includes("desayuno")) {
    return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80";
  }
  if (text.includes("cerveza") || text.includes("coca") || text.includes("bebida") || text.includes("trago") || text.includes("jugo")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80";
  }
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";
}

export function SearchAutocompleteOverlay({
  isOpen,
  onClose,
  initialQuery = "",
  topSearches = ["Empanadas", "Sushi", "Desayuno", "Helado", "Pizzas"],
  recommendedChains = [],
  onSelectCategory,
}: SearchAutocompleteOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<CatalogSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        setRecentSearches(DEFAULT_RECENT);
      }
    } catch {
      setRecentSearches(DEFAULT_RECENT);
    }
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== term);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  // Live Debounced Search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchCatalogAction(trimmed);
        setResults(res);
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, isOpen]);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Handle Keyboard shortcuts (Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectStore = (slug: string, storeName: string) => {
    saveRecentSearch(storeName);
    onClose();
    router.push(`/c/${slug}`);
  };

  const handleSelectProduct = (storeSlug: string, productName: string) => {
    saveRecentSearch(productName);
    onClose();
    router.push(`/c/${storeSlug}`);
  };

  const handleSelectCategoryOrTag = (term: string) => {
    saveRecentSearch(term);
    setQuery(term);
    onSelectCategory?.(term);
  };

  const hasSearchText = query.trim().length > 0;
  const hasResults = results && results.totalCount > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col bg-[#faf6f1] dark:bg-[#0b0b0d] animate-fade-in overflow-hidden"
      >
        {/* Header Capsule Input */}
        <div className="w-full max-w-[760px] mx-auto px-4 pt-4 pb-3 flex items-center gap-3 shrink-0 border-b border-[#e8e0d6] dark:border-[#2a2623] bg-[#faf6f1]/90 dark:bg-[#0b0b0d]/90 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="w-10 h-10 rounded-full bg-[#ede4d9] dark:bg-[#1c1917] border border-[#ddd4c8] dark:border-[#3d3732] flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <MaterialSymbol icon="arrow_back" size={18} />
          </button>

          <div
            className={`flex-1 h-11 bg-white dark:bg-[#1c1917] border rounded-2xl flex items-center px-3.5 gap-2.5 transition-all duration-300 relative shadow-sm ${
              hasSearchText
                ? "border-[#9a0002] ring-2 ring-[#9a0002]/20"
                : "border-[#e8e0d6] dark:border-[#3d3732] focus-within:border-[#9a0002]"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-[#9a0002] border-t-transparent animate-spin shrink-0" />
            ) : (
              <MaterialSymbol icon="search" size={19} className="shrink-0 text-[#9a0002]" />
            )}

            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar comida, locales, hamburguesas, pizza..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-[13px] font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent focus:outline-none"
            />

            {hasSearchText && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#2a2623] text-gray-400 hover:text-[#9a0002] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <MaterialSymbol icon="close" size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-[760px] w-full mx-auto space-y-6">
          {/* STATE A: User hasn't typed anything yet */}
          {!hasSearchText && (
            <div className="space-y-6 animate-fade-in">
              {/* Búsquedas Recientes */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Búsquedas recientes
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        try {
                          localStorage.removeItem(LOCAL_STORAGE_KEY);
                        } catch {
                          /* ignore */
                        }
                      }}
                      className="text-[10px] font-semibold text-gray-400 hover:text-[#9a0002] transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => setQuery(term)}
                        className="flex items-center gap-2 pl-3.5 pr-2 py-1.5 bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-full text-[12px] font-medium whitespace-nowrap hover:border-[#9a0002]/40 transition-all cursor-pointer group shadow-xs shrink-0"
                      >
                        <span className="text-gray-800 dark:text-gray-200">{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="w-4 h-4 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#2a2623] hover:bg-red-100 hover:text-[#9a0002] text-gray-400 cursor-pointer transition-colors"
                        >
                          <MaterialSymbol icon="close" size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Búsquedas */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                  Top Búsquedas en Bolívar
                </h4>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {topSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-3.5 py-1.5 bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-full text-[12px] font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap hover:border-[#9a0002]/40 hover:text-[#9a0002] transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cadenas recomendadas */}
              {recommendedChains.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                    Locales recomendados
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {recommendedChains.slice(0, 4).map((chain) => (
                      <div
                        key={chain.id}
                        onClick={() => handleSelectStore(chain.id, chain.name)}
                        className="p-3 bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-2xl shadow-xs flex items-center justify-between cursor-pointer hover:border-[#9a0002]/40 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-[#3d3732] bg-[#faf6f1] dark:bg-[#2a2623] flex items-center justify-center font-bold text-xs">
                            {chain.logoImage ? (
                              <img src={chain.logoImage} alt={chain.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{chain.logoEmoji || chain.name[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 truncate group-hover:text-[#9a0002] transition-colors">
                              {chain.name}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                              <span className="flex items-center text-amber-500 font-semibold">
                                <MaterialSymbol icon="star" size={12} fill className="mr-0.5" />
                                {chain.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <MaterialSymbol icon="chevron_right" size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE B: Live Results Found (Cloudflare Style Grouped Command Palette) */}
          {hasSearchText && hasResults && results && (
            <div className="space-y-6 animate-fade-in">
              {/* 1. Categorías & Especialidades */}
              {results.categories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <MaterialSymbol icon="local_offer" size={15} className="text-[#9a0002]" />
                    <span>Categorías</span>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs divide-y divide-[#f0ebe4] dark:divide-[#2a2623] overflow-hidden">
                    {results.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoryOrTag(cat.name)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#faf6f1] dark:hover:bg-[#231f1c] transition-colors cursor-pointer group"
                      >
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                          <HighlightText text={cat.name} query={query} />
                        </div>
                        <span className="text-[11px] text-gray-400 group-hover:text-[#9a0002] transition-colors flex items-center gap-1">
                          Ver locales
                          <MaterialSymbol icon="arrow_forward" size={13} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Locales Gastronómicos (Clean Compact List) */}
              {results.stores.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <MaterialSymbol icon="storefront" size={15} className="text-[#9a0002]" />
                    <span>Locales Gastronómicos</span>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs divide-y divide-[#f0ebe4] dark:divide-[#2a2623] overflow-hidden">
                    {results.stores.map((store) => (
                      <div
                        key={store.id}
                        onClick={() => handleSelectStore(store.slug || store.id, store.name)}
                        className="flex items-center justify-between p-3 hover:bg-[#faf6f1] dark:hover:bg-[#231f1c] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-[#3d3732] bg-[#faf6f1] dark:bg-[#2a2623] flex items-center justify-center font-bold text-xs">
                            {store.logoImage ? (
                              <img src={store.logoImage} alt={store.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{store.logoEmoji || store.name[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 truncate group-hover:text-[#9a0002] transition-colors">
                                <HighlightText text={store.name} query={query} />
                              </h5>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  store.isOpen
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-stone-800 dark:text-stone-400"
                                }`}
                              >
                                {store.isOpen ? "Abierto" : "Cerrado"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                              {store.isNew ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9a0002] bg-[#9a0002]/10 px-1.5 py-0.5 rounded-full">
                                  <MaterialSymbol icon="new_releases" size={12} />
                                  <span>Nuevo</span>
                                </span>
                              ) : (
                                <span className="flex items-center text-amber-500 font-semibold">
                                  <MaterialSymbol icon="star" size={11} fill className="mr-0.5" />
                                  {store.rating > 0 ? store.rating.toFixed(1) : "—"}
                                  {store.reviewsCount > 0 && (
                                    <span className="text-gray-400 font-normal ml-0.5">
                                      ({store.reviewsCount})
                                    </span>
                                  )}
                                </span>
                              )}
                              {store.tagline && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-[130px]">{store.tagline}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <MaterialSymbol
                          icon="chevron_right"
                          size={18}
                          className="text-gray-400 group-hover:translate-x-0.5 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-all shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Platos & Menús (Hierarchy: Local > Plato + Left Image + Price + Ver menú) */}
              {results.products.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <MaterialSymbol icon="restaurant_menu" size={15} className="text-[#9a0002]" />
                    <span>Platos & Menús</span>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs divide-y divide-[#f0ebe4] dark:divide-[#2a2623] overflow-hidden">
                    {results.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod.storeSlug, prod.name)}
                        className="flex items-center justify-between p-3 hover:bg-[#faf6f1] dark:hover:bg-[#231f1c] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-[#2a2623] border border-[#e8e0d6] dark:border-[#3d3732] shadow-xs">
                            <img
                              src={prod.image || getFoodFallbackImage(prod.name, prod.category)}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-0.5">
                              <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                                {prod.storeName}
                              </span>
                              <span>&gt;</span>
                              <span className="text-[10px] text-gray-400">Menú</span>
                            </div>
                            <h5 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 group-hover:text-[#9a0002] transition-colors truncate">
                              <HighlightText text={prod.name} query={query} />
                            </h5>
                            {prod.description && (
                              <p className="text-[11px] text-gray-400 truncate max-w-[240px] mt-0.5">
                                {prod.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1 pl-2">
                          <span className="text-[13px] font-extrabold text-[#9a0002] dark:text-red-400 block">
                            ${Math.round(prod.priceCents / 100).toLocaleString("es-AR")}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#9a0002]/10 text-[#9a0002] dark:bg-[#9a0002]/20 dark:text-red-300 text-[11px] font-bold group-hover:bg-[#9a0002] group-hover:text-white transition-all">
                            <span>Ver menú</span>
                            <MaterialSymbol icon="arrow_forward" size={11} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Dietas & Ingredientes */}
              {results.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <MaterialSymbol icon="eco" size={15} className="text-[#9a0002]" />
                    <span>Dietas & Ingredientes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectCategoryOrTag(tag.name)}
                        className="px-3.5 py-1.5 bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-xl text-[12px] font-semibold text-gray-800 dark:text-gray-200 hover:border-[#9a0002]/40 hover:text-[#9a0002] transition-all cursor-pointer shadow-xs"
                      >
                        <HighlightText text={tag.name} query={query} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE C: No Results Found */}
          {hasSearchText && !isLoading && (!results || results.totalCount === 0) && (
            <div className="py-12 text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#9a0002]/10 text-[#9a0002] flex items-center justify-center mx-auto">
                <MaterialSymbol icon="search_off" size={28} />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                  No encontramos resultados para &quot;{query}&quot;
                </h4>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                  Probá buscando por platos populares como <span className="font-semibold text-gray-700 dark:text-gray-300">Pizza, Empanadas, Hamburguesas</span> o seleccioná una categoría.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                {["Pizzas", "Hamburguesas", "Helado"].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setQuery(sug)}
                    className="px-3 py-1 bg-white dark:bg-[#1c1917] border border-[#e8e0d6] dark:border-[#3d3732] rounded-full text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:border-[#9a0002] transition-all cursor-pointer"
                  >
                    Buscar {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
