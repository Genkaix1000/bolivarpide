"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  ForkKnife,
  GearSix,
  MagnifyingGlass,
  Receipt,
  SquaresFour,
  UsersThree,
  X,
  ArrowRight,
  type Icon,
} from "@phosphor-icons/react";
import { UserAvatarView } from "@/components/UserAvatarView";
import { cn } from "@/lib/utils";
import {
  searchBusinessPanelAction,
  type PanelSearchHit,
  type PanelSearchResult,
} from "@/lib/business/panelSearch";

type Props = {
  open: boolean;
  onClose: () => void;
  businessId: string;
};

type TabFilter = "all" | keyof PanelSearchResult;

const SECTIONS: {
  key: keyof PanelSearchResult;
  label: string;
  icon: Icon;
}[] = [
  { key: "orders", label: "Pedidos", icon: Receipt },
  { key: "menu", label: "Carta", icon: BookOpenText },
  { key: "team", label: "Equipo", icon: UsersThree },
  { key: "pages", label: "Páginas", icon: SquaresFour },
];

export function BusinessSearchOverlay({ open, onClose, businessId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<PanelSearchResult>({
    orders: [],
    menu: [],
    team: [],
    pages: [],
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveTab("all");
    setSelectedIndex(0);
    setResults({ orders: [], menu: [], team: [], pages: [] });
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 1) {
      setResults({ orders: [], menu: [], team: [], pages: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void searchBusinessPanelAction(businessId, q)
        .then((res) => {
          setResults(res);
          setSelectedIndex(0);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, businessId]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const hasQuery = query.trim().length > 0;
  const total =
    results.orders.length +
    results.menu.length +
    results.team.length +
    results.pages.length;

  // Filtered sections according to activeTab
  const activeSections = useMemo(() => {
    if (activeTab === "all") {
      return SECTIONS.filter((s) => results[s.key].length > 0);
    }
    return SECTIONS.filter((s) => s.key === activeTab && results[s.key].length > 0);
  }, [activeTab, results]);

  // Flatten hits for keyboard navigation
  const flatHits = useMemo(() => {
    return activeSections.flatMap((s) => results[s.key]);
  }, [activeSections, results]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((idx) => (flatHits.length > 0 ? (idx + 1) % flatHits.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((idx) =>
          flatHits.length > 0 ? (idx - 1 + flatHits.length) % flatHits.length : 0,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatHits[selectedIndex]) {
          go(flatHits[selectedIndex].href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, flatHits, selectedIndex, go]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex flex-col bg-[#faf6f1] dark:bg-[#0b0b0d]"
      >
        {/* Top Header Search Bar */}
        <div className="mx-auto flex h-16 w-full max-w-[760px] shrink-0 items-center gap-3 border-b border-[#e8e0d6] px-4 dark:border-[#2a2623]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar búsqueda"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#ddd4c8] bg-[#ede4d9] text-stone-600 transition hover:text-stone-900 dark:border-[#3d3732] dark:bg-[#1c1917] dark:text-stone-300"
          >
            <X weight="bold" size={16} />
          </button>

          <div
            className={cn(
              "flex h-12 flex-1 items-center gap-3 rounded-2xl border bg-white px-3.5 shadow-sm transition-all dark:bg-[#1c1917]",
              hasQuery
                ? "border-[#9a0002] ring-2 ring-[#9a0002]/20"
                : "border-[#e8e0d6] focus-within:border-[#9a0002] dark:border-[#3d3732]",
            )}
          >
            {loading ? (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#9a0002] border-t-transparent" />
            ) : (
              <MagnifyingGlass weight="bold" size={18} className="shrink-0 text-[#9a0002]" />
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pedidos (#12, $17.500, cliente), carta, equipo..."
              className="w-full bg-transparent outline-none border-none p-0 focus:ring-0 caret-[#9a0002] text-[14px] font-medium text-stone-800 placeholder:text-stone-400 dark:text-stone-200 dark:placeholder:text-stone-500"
            />

            {hasQuery && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="cursor-pointer rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
              >
                <X weight="bold" size={14} />
              </button>
            )}

            <span className="hidden select-none items-center rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-bold text-stone-400 sm:inline-flex dark:border-stone-800 dark:bg-stone-900">
              ESC
            </span>
          </div>
        </div>

        {/* Filter Pills (Tabs) */}
        {hasQuery && total > 0 && (
          <div className="mx-auto flex w-full max-w-[760px] gap-2 overflow-x-auto border-b border-[#e8e0d6]/70 px-4 py-2.5 dark:border-[#2a2623]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-[11px] font-bold transition-colors whitespace-nowrap",
                activeTab === "all"
                  ? "bg-[#9a0002] text-white shadow-xs"
                  : "bg-stone-200/70 text-stone-600 hover:bg-stone-200 dark:bg-[#1f1b18] dark:text-stone-400",
              )}
            >
              Todos ({total})
            </button>

            {SECTIONS.map(({ key, label }) => {
              const count = results[key].length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1 text-[11px] font-bold transition-colors whitespace-nowrap",
                    activeTab === key
                      ? "bg-[#9a0002] text-white shadow-xs"
                      : "bg-stone-200/70 text-stone-600 hover:bg-stone-200 dark:bg-[#1f1b18] dark:text-stone-400",
                  )}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Search Results Area */}
        <div className="mx-auto w-full max-w-[760px] flex-1 overflow-y-auto px-4 py-5">
          {/* Empty Prompt / Tips */}
          {!hasQuery && (
            <div className="mx-auto max-w-md space-y-6 pt-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9a0002]/20 bg-[#9a0002]/5 text-[#9a0002] shadow-sm dark:bg-[#9a0002]/10">
                  <Receipt weight="duotone" size={32} />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Buscador operativo del local
                </h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Encontrá pedidos en segundos para verificar pagos y transferencias.
                </p>
              </div>

              {/* Quick suggestion chips */}
              <div className="space-y-2 rounded-2xl border border-[#e8e0d6] bg-white p-4 text-left shadow-xs dark:border-[#2a2623] dark:bg-[#171412]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Probá buscar por:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuery("$17")}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-[#9a0002] hover:text-[#9a0002] transition dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-300"
                  >
                    <span>Monto ej: $17...</span>
                    <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery("#")}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-[#9a0002] hover:text-[#9a0002] transition dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-300"
                  >
                    <span>N° de pedido ej: #12</span>
                    <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery("pendiente")}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-[#9a0002] hover:text-[#9a0002] transition dark:border-stone-700 dark:bg-[#231f1c] dark:text-stone-300"
                  >
                    <span>Estado ej: pendiente</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No results */}
          {hasQuery && !loading && total === 0 && (
            <div className="pt-10 text-center space-y-2">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                Sin resultados para “{query.trim()}”
              </p>
              <p className="text-xs text-stone-400">
                Verificá que el monto, número o nombre estén bien escritos.
              </p>
            </div>
          )}

          {/* Section results */}
          {hasQuery && (
            <div className="space-y-6">
              {activeSections.map(({ key, label, icon: IconCmp }) => {
                const hits = results[key];
                if (hits.length === 0) return null;
                return (
                  <section key={key}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <IconCmp weight="bold" size={14} className="text-[#9a0002]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {label}
                      </h3>
                      <span className="rounded-sm bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-[#2a2623] dark:text-stone-400">
                        {hits.length}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#e8e0d6] bg-white shadow-xs dark:border-[#3d3732] dark:bg-[#1c1917]">
                      {hits.map((hit, i) => {
                        const globalIndex = flatHits.findIndex((h) => h.id === hit.id);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <HitRow
                            key={hit.id}
                            hit={hit}
                            section={key}
                            fallbackIcon={IconCmp}
                            isSelected={isSelected}
                            onSelect={go}
                            onHover={() => setSelectedIndex(globalIndex)}
                            bordered={i < hits.length - 1}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function HitRow({
  hit,
  section,
  fallbackIcon: FallbackIcon,
  isSelected,
  onSelect,
  onHover,
  bordered,
}: {
  hit: PanelSearchHit;
  section: keyof PanelSearchResult;
  fallbackIcon: Icon;
  isSelected: boolean;
  onSelect: (href: string) => void;
  onHover: () => void;
  bordered: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(hit.href)}
      onMouseEnter={onHover}
      className={cn(
        "group flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors",
        isSelected
          ? "bg-[#9a0002]/5 dark:bg-[#9a0002]/10"
          : "hover:bg-[#faf6f1] dark:hover:bg-[#231f1c]",
        bordered && "border-b border-[#f0ebe4] dark:border-[#2a2623]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <HitLeading hit={hit} section={section} fallbackIcon={FallbackIcon} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[13px] font-bold transition-colors",
              isSelected
                ? "text-[#9a0002]"
                : "text-stone-900 group-hover:text-[#9a0002] dark:text-stone-100",
            )}
          >
            {hit.title}
          </p>
          {hit.subtitle && (
            <p className="truncate text-[11px] font-medium text-stone-400">{hit.subtitle}</p>
          )}
        </div>
      </div>

      {/* Trailing details for orders (amount & status) */}
      {(hit.amount || hit.statusLabel) && (
        <div className="flex shrink-0 flex-col items-end gap-1 pl-2 text-right">
          {hit.amount && (
            <span className="text-[13px] font-black text-stone-900 dark:text-stone-100">
              {hit.amount}
            </span>
          )}
          {hit.statusLabel && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-extrabold border",
                hit.statusVariant === "pending"
                  ? "bg-[#9a0002]/10 text-[#9a0002] border-[#9a0002]/20"
                  : hit.statusVariant === "preparing"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    : hit.statusVariant === "delivering"
                      ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                      : hit.statusVariant === "delivered"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 border-transparent",
              )}
            >
              {hit.statusLabel}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function HitLeading({
  hit,
  section,
  fallbackIcon: FallbackIcon,
}: {
  hit: PanelSearchHit;
  section: keyof PanelSearchResult;
  fallbackIcon: Icon;
}) {
  if (section === "orders") {
    const isPending = hit.statusVariant === "pending";
    return (
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
          isPending
            ? "border-[#9a0002]/30 bg-[#9a0002]/10 text-[#9a0002]"
            : "border-[#e8e0d6] bg-[#faf6f1] text-stone-600 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-stone-400",
        )}
      >
        <Receipt weight={isPending ? "fill" : "regular"} size={20} />
        {isPending && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#9a0002] ring-2 ring-white dark:ring-[#1c1917] animate-pulse" />
        )}
      </div>
    );
  }

  if (section === "team" && hit.avatar) {
    return (
      <UserAvatarView
        avatar={hit.avatar}
        size="sm"
        variant="button"
        className="shrink-0 shadow-sm"
      />
    );
  }

  if (section === "menu") {
    return (
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#e8e0d6] bg-stone-100 shadow-xs dark:border-[#3d3732] dark:bg-[#2a2623]">
        {hit.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hit.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <ForkKnife weight="regular" size={18} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e8e0d6] bg-[#faf6f1] text-stone-500 dark:border-[#3d3732] dark:bg-[#2a2623] dark:text-stone-400">
      <FallbackIcon weight="regular" size={18} />
    </div>
  );
}
