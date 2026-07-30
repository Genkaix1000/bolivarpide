"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  NOTIFICATION_POPOVER_MOTION,
  SkiperSunMoon,
  startThemeTransitionFrom,
} from "@/components/Navbar";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  RESTAURANT_SPECIALTIES,
} from "@/lib/mockData";

interface CurvedHomeHeaderProps {
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  activeSpecialty: string | null;
  onSpecialtyChange: (id: string | null) => void;
  locationLabel: string;
  savedAddresses: Array<{ id: string; name: string }>;
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  showLocationDropdown: boolean;
  onLocationClick: () => void;
  /** Reports the location button's bottom Y (viewport) while the dropdown is open. */
  onLocationAnchorChange?: (bottomY: number | null) => void;
  onSearchFocus: () => void;
  searchQuery: string;
  className?: string;
}

interface CarouselItem {
  id: string;
  label: string;
  icon: string;
}

interface ArcGeometry {
  width: number;
  sagitta: number;
  rx: number;
  ry: number;
  cx: number;
}

const ITEM_BOX = 68;
const ITEM_GAP = 4;
/** Diameter of the category icon circle (must match CategoryButton). */
const ICON_SIZE = 58;
/** Offset so the icon circle center sits on the oval edge. */
const ICON_CENTER = ICON_SIZE / 2;
/** Keep full icon (box/2) inside the viewport, plus a little air. */
const SIDE_PAD = ITEM_BOX / 2 + 10;

/** Shallow arc depth: visibly curved without looking like a half-circle. */
const SEMICIRCLE_RATIO = 0.24;
const SAGITTA_MIN = 88;
const SAGITTA_MAX = 150;
/** Extend the ellipse past both viewport edges to hide its corners. */
const OVAL_OVERSCAN_RATIO = 0.07;
/** Vertical pad at the left/right ends so the search row stays inside the red. */
const MIN_EDGE_HEIGHT = 30;
/** Moves the location control down toward the oval edge. Adjust this manually. */
const LOCATION_OFFSET_Y = 20;

const NOTIFICATIONS = [
  { emoji: "🛵", title: "Tu pedido de Burger Beef está en camino", time: "Hace 5 min" },
  { emoji: "🎁", title: "¡Tienes un cupón de 15% de descuento!", time: "Hace 1 hora" },
  { emoji: "🍕", title: "Tu pizza favorita de Pizza Hut tiene 20% OFF", time: "Hace 3 horas" },
];

/** Curve depth (center drop below the edge line), not including edge height. */
function computeCurveDepth(width: number): number {
  if (width <= 0) return SAGITTA_MIN;
  return Math.min(SAGITTA_MAX, Math.max(SAGITTA_MIN, width * SEMICIRCLE_RATIO));
}

function computeHeaderHeight(width: number): number {
  return MIN_EDGE_HEIGHT + computeCurveDepth(width);
}

/** Shared oval geometry for the header shell and category arc. */
function computeArc(width: number): ArcGeometry {
  const W = Math.max(width, 1);
  const s = computeCurveDepth(W);
  const overscan = W * OVAL_OVERSCAN_RATIO;
  const rx = W / 2 + overscan;
  return { width: W, sagitta: s, rx, ry: s, cx: W / 2 };
}

/**
 * Y along the oval edge in stage coords (y down from the chord).
 * Center sits lowest (`ry`); edges sit highest (`≈0`).
 */
function arcY(x: number, geo: ArcGeometry): number {
  const clamped = Math.min(Math.max(x, 0), geo.width);
  const dx = (clamped - geo.cx) / geo.rx;
  if (Math.abs(dx) >= 1) return 0;
  return geo.ry * Math.sqrt(1 - dx * dx);
}

/**
 * Flat top + side pads, then the lower half of a horizontal ellipse.
 * Independent radii keep the header wide and gently curved.
 */
function ovalHeaderPath(
  width: number,
  curveDepth: number,
  edgeH: number = MIN_EDGE_HEIGHT,
): string {
  const W = Math.max(width, 1);
  const overscan = W * OVAL_OVERSCAN_RATIO;
  const left = -overscan;
  const right = W + overscan;
  const rx = (right - left) / 2;
  const ry = Math.max(curveDepth, 1);
  // The ellipse endpoints sit outside the SVG viewport, so its corners are clipped.
  return `M ${left} 0 L ${right} 0 L ${right} ${edgeH} A ${rx} ${ry} 0 0 1 ${left} ${edgeH} Z`;
}

function HeaderCircleBtn({
  onClick,
  children,
  className,
  btnRef,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  btnRef?: React.RefObject<HTMLButtonElement | null>;
  "aria-label"?: string;
}) {
  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative flex h-[42px] w-[42px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-gray-800 shadow-md transition-transform active:scale-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ThemeToggleHeaderBtn() {
  const [isDark, setIsDark] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    startThemeTransitionFrom(btnRef.current, next);
  }, [isDark]);

  return (
    <HeaderCircleBtn
      onClick={toggle}
      btnRef={btnRef}
      aria-label={isDark ? "Modo claro" : "Modo oscuro"}
      className="overflow-hidden"
    >
      <SkiperSunMoon isDark={isDark} color="#1f2937" clipId="header-skipper-clip" />
    </HeaderCircleBtn>
  );
}

function CircleProgress({
  scrollLeft,
  scrollWidth,
  clientWidth,
  onChange,
}: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  onChange: (position: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const maxScroll = Math.max(scrollWidth - clientWidth, 1);
  const progress = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    onChange((x / rect.width) * maxScroll);
  };

  const thumbX = 12 + progress * (160 - 24);

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      className="relative mx-auto h-8 w-40 cursor-pointer touch-none select-none"
    >
      <svg
        viewBox="0 0 160 34"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <path
          d="M12 8 Q80 30 148 8"
          fill="none"
          stroke="#9a0002"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.35}
        />
        <circle
          cx={thumbX}
          cy={8 + 14 * (1 - Math.pow(progress * 2 - 1, 2))}
          r={5.5}
          className="fill-[#9a0002]"
        />
      </svg>
    </div>
  );
}

function CategoryButton({
  item,
  isActive,
  onSelect,
  style,
  className,
}: {
  item: CarouselItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        // No transition on the button itself: its `transform` (translateY) tracks
        // the arc curve every scroll frame, and any CSS transition here would fight
        // that update, making icons visibly lag behind and "fall" into place instead
        // of following the curvature 1:1. Press feedback lives on the inner circle instead.
        "pointer-events-auto flex flex-col items-center gap-1",
        className,
      )}
      style={style}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300 active:scale-90",
          isActive
            ? "scale-105 shadow-lg ring-[2.5px] ring-[#9a0002]/45"
            : "shadow-md",
        )}
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          backgroundColor: isActive ? "#f5e6d3" : "#f0e0c8",
        }}
      >
        <MaterialSymbol
          icon={item.icon}
          size={26}
          fill={isActive}
          className={isActive ? "text-[#9a0002]" : "text-[#3d2b1f]"}
        />
      </span>
      {/* Unified dark label — never accent red */}
      <span className="max-w-[72px] truncate text-center text-[10px] font-bold tracking-tight text-gray-700 dark:text-gray-300">
        {item.label}
      </span>
    </button>
  );
}

/** Side inset so fit-mode categories cluster toward the center. */
function fitEdgePad(width: number): number {
  return Math.max(ITEM_BOX / 2 + 2, width * 0.18);
}

/** Fit mode: evenly distribute items across the arc, no scroll. */
function FitArcCarousel({
  items,
  selectedId,
  onSelect,
  geo,
}: {
  items: CarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geo: ArcGeometry;
}) {
  const n = items.length;
  const edgePad = fitEdgePad(geo.width);
  const usable = Math.max(geo.width - edgePad * 2, 1);

  return (
    <div
      className="semicircle-stage pointer-events-none relative w-full overflow-visible"
      style={{
        height: geo.sagitta + ITEM_BOX - ICON_CENTER,
      }}
    >
      {items.map((item, i) => {
        const x = n === 1 ? geo.cx : edgePad + (i / (n - 1)) * usable;
        // Icon circle center tracks the oval edge.
        const y = arcY(x, geo) - ICON_CENTER;
        return (
          <CategoryButton
            key={item.id}
            item={item}
            isActive={selectedId === item.id}
            onSelect={onSelect}
            className="absolute"
            style={{
              width: ITEM_BOX,
              left: x - ITEM_BOX / 2,
              top: 0,
              transform: `translateY(${y}px)`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Drag mode: scrollable track; each item follows arcY from its live viewport X. */
function DragArcCarousel({
  items,
  selectedId,
  onSelect,
  geo,
}: {
  items: CarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geo: ArcGeometry;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollDim, setScrollDim] = useState({
    scrollWidth: 0,
    clientWidth: 0,
  });

  const sidePad = Math.max((geo.width - ITEM_BOX) / 2, SIDE_PAD);
  const pitch = ITEM_BOX + ITEM_GAP;

  // Reads scroll position only — item Y-offsets are derived (below) purely from
  // scrollLeft + layout math, never from getBoundingClientRect. That keeps the
  // curve perfectly in sync with scroll on every render, with no measurement lag
  // and no "flat until measured" flash on mount.
  const readScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollLeft(el.scrollLeft);
    setScrollDim({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
  }, []);

  const scheduleRead = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      readScroll();
    });
  }, [readScroll]);

  // Synchronous on mount/resize so the very first paint is already curved and centered.
  useLayoutEffect(() => {
    readScroll();
  }, [readScroll, items.length, geo.width]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", scheduleRead, { passive: true });
    const ro = new ResizeObserver(scheduleRead);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", scheduleRead);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleRead]);

  const offsets = useMemo(
    () =>
      items.map((_, i) => {
        const itemCenterX = sidePad + i * pitch + ITEM_BOX / 2 - scrollLeft;
        return arcY(itemCenterX, geo) - ICON_CENTER;
      }),
    [items, sidePad, pitch, scrollLeft, geo],
  );

  const scrollTo = useCallback((targetScroll: number) => {
    scrollRef.current?.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, []);

  return (
    <div className="pointer-events-none flex w-full flex-col items-center">
      <div
        className="semicircle-stage pointer-events-none relative w-full"
        style={{
          height: geo.sagitta + ITEM_BOX - ICON_CENTER,
          maskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
      >
        <div
          ref={scrollRef}
          className="semicircle-track pointer-events-auto flex h-full overflow-x-auto scroll-smooth"
          style={{
            gap: ITEM_GAP,
            paddingLeft: sidePad,
            paddingRight: sidePad,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.map((item, idx) => (
            <CategoryButton
              key={`${item.id}-${idx}`}
              item={item}
              isActive={selectedId === item.id}
              onSelect={onSelect}
              className="flex-shrink-0"
              style={{
                width: ITEM_BOX,
                scrollSnapAlign: "center",
                transform: `translateY(${offsets[idx] ?? 0}px)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-auto mt-0.5">
        <CircleProgress
          scrollLeft={scrollLeft}
          scrollWidth={scrollDim.scrollWidth}
          clientWidth={scrollDim.clientWidth}
          onChange={scrollTo}
        />
      </div>
    </div>
  );
}

function ArcCarousel({
  items,
  selectedId,
  onSelect,
  geo,
}: {
  items: CarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geo: ArcGeometry;
}) {
  // Fit when items can be evenly spaced across the centered arc without overlapping.
  const edgePad = fitEdgePad(geo.width);
  const span = Math.max(geo.width - edgePad * 2, 0);
  const minSpan = Math.max(items.length - 1, 0) * (ITEM_BOX + ITEM_GAP + 4);
  const fits = geo.width > 0 && (items.length <= 1 || span >= minSpan);

  if (fits) {
    return (
      <FitArcCarousel
        items={items}
        selectedId={selectedId}
        onSelect={onSelect}
        geo={geo}
      />
    );
  }

  return (
    <DragArcCarousel
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      geo={geo}
    />
  );
}

export default function CurvedHomeHeader({
  activeCategory,
  onCategoryChange,
  activeSpecialty,
  onSpecialtyChange,
  locationLabel,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  showLocationDropdown,
  onLocationClick,
  onLocationAnchorChange,
  onSearchFocus,
  searchQuery,
  className,
}: CurvedHomeHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const locationBtnRef = useRef<HTMLButtonElement>(null);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);
  const anchorCbRef = useRef(onLocationAnchorChange);
  const reactId = useId();
  const gradId = `header-cherry-${reactId.replace(/:/g, "")}`;
  const [headerWidth, setHeaderWidth] = useState(0);
  const [showSpecialties, setShowSpecialties] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPos, setNotificationPos] = useState<{
    top: number;
    right: number;
    backdropTop: number;
  } | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  anchorCbRef.current = onLocationAnchorChange;

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Anchor location dropdown + expose button bottom for the page backdrop
  useLayoutEffect(() => {
    if (!showLocationDropdown) {
      setDropdownPos(null);
      anchorCbRef.current?.(null);
      return;
    }
    const update = () => {
      const btn = locationBtnRef.current;
      if (!btn) {
        const fallbackTop = Math.max(headerRef.current?.getBoundingClientRect().bottom ?? 160, 120);
        setDropdownPos({
          top: fallbackTop + 8,
          left: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
        });
        anchorCbRef.current?.(fallbackTop);
        return;
      }
      const r = btn.getBoundingClientRect();
      setDropdownPos({
        top: r.bottom + 8,
        left: r.left + r.width / 2,
      });
      anchorCbRef.current?.(r.bottom);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showLocationDropdown]);

  const updateNotificationPosition = useCallback(() => {
    const btn = notificationBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setNotificationPos({
      top: r.bottom + 6,
      right: Math.max(window.innerWidth - r.right, 16),
      backdropTop: r.bottom,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showNotifications) {
      setNotificationPos(null);
      return;
    }
    updateNotificationPosition();
    window.addEventListener("resize", updateNotificationPosition);
    window.addEventListener("scroll", updateNotificationPosition, true);
    return () => {
      window.removeEventListener("resize", updateNotificationPosition);
      window.removeEventListener("scroll", updateNotificationPosition, true);
    };
  }, [showNotifications, updateNotificationPosition]);

  const headerCurveDepth = computeCurveDepth(headerWidth);
  const headerHeight = useMemo(
    () => (headerWidth > 0 ? computeHeaderHeight(headerWidth) : MIN_EDGE_HEIGHT + SAGITTA_MIN),
    [headerWidth],
  );
  const geo = useMemo(() => computeArc(headerWidth), [headerWidth]);

  const categoryItems: CarouselItem[] = useMemo(
    () => CATEGORIES.map((c) => ({ id: c.id, label: c.name, icon: c.icon })),
    [],
  );

  const specialtyItems: CarouselItem[] = useMemo(
    () =>
      RESTAURANT_SPECIALTIES.map((s) => ({
        id: s.id,
        label: s.label,
        icon: s.icon,
      })),
    [],
  );

  const selectCategory = (id: string) => {
    if (activeCategory === id && id !== "restaurants") {
      onCategoryChange(null);
      return;
    }
    onCategoryChange(id);
    if (id === "restaurants") {
      window.setTimeout(() => setShowSpecialties(true), 220);
    } else {
      setShowSpecialties(false);
      onSpecialtyChange(null);
    }
  };

  const returnToCategories = () => {
    setShowSpecialties(false);
    onSpecialtyChange(null);
  };

  const shortLocation = locationLabel.split(",")[0] || locationLabel;
  const svgW = headerWidth || 375;
  const svgH = Math.ceil(headerHeight);
  const fillPath = ovalHeaderPath(svgW, headerCurveDepth, MIN_EDGE_HEIGHT);

  return (
    <div ref={headerRef} className={cn("relative w-full", className)}>
      {/* Oval header: flat top, shallow curve pointing down */}
      <div
        className="relative text-white"
        style={{ height: svgH }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={headerWidth || "100%"}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a0002" />
              <stop offset="55%" stopColor="#850002" />
              <stop offset="100%" stopColor="#6b0001" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#${gradId})`} />
        </svg>

        <div
          className="relative z-10 mx-auto flex h-full max-w-[1040px] flex-col px-5 md:px-8"
          style={{
            paddingTop: "0.875rem",
            paddingBottom: "max(2rem, 22%)",
          }}
        >
          {/* Top (~15%): Search + theme + notifications */}
          <div className="flex shrink-0 items-center gap-2">
            <motion.div
              layout
              transition={{ layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
              className="min-w-0 flex-1"
            >
              <button
                type="button"
                onClick={onSearchFocus}
                className="flex h-[42px] w-full cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 text-left shadow-md transition-transform active:scale-[0.99]"
              >
                <MaterialSymbol
                  icon="search"
                  size={18}
                  className="flex-shrink-0 text-gray-400"
                />
                <span className="truncate text-[13px] font-medium text-gray-400">
                  {searchQuery || 'Buscar "comida", locales...'}
                </span>
              </button>
            </motion.div>

            <motion.div
              layout
              className="max-w-[42px] flex-none overflow-hidden opacity-100 transition-[max-width,opacity] duration-300 md:pointer-events-none md:max-w-0 md:opacity-0"
            >
              <ThemeToggleHeaderBtn />
            </motion.div>

            <motion.div
              layout
              className="relative max-w-[42px] flex-none opacity-100 transition-[max-width,opacity] duration-300 md:pointer-events-none md:max-w-0 md:opacity-0"
            >
              <HeaderCircleBtn
                btnRef={notificationBtnRef}
                onClick={() => {
                  if (showLocationDropdown) onLocationClick();
                  if (!showNotifications) updateNotificationPosition();
                  setShowNotifications((v) => !v);
                }}
                aria-label="Notificaciones"
              >
                <MaterialSymbol
                  icon="notifications"
                  size={20}
                  className="text-gray-800"
                />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#ffeb3b] ring-[1.5px] ring-[#6b0001]" />
              </HeaderCircleBtn>
            </motion.div>
          </div>

          {/* Center (~50–55%): Location */}
          <div
            className="relative flex flex-1 items-center justify-center"
            style={{ transform: `translateY(${LOCATION_OFFSET_Y}px)` }}
          >
            <button
              ref={locationBtnRef}
              type="button"
              onClick={() => {
                setShowNotifications(false);
                const btn = locationBtnRef.current;
                if (btn) {
                  const r = btn.getBoundingClientRect();
                  setDropdownPos({
                    top: r.bottom + 8,
                    left: r.left + r.width / 2,
                  });
                  anchorCbRef.current?.(r.bottom);
                }
                onLocationClick();
              }}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center gap-0",
                showLocationDropdown && "z-50",
              )}
            >
              <span className="text-[10px] font-medium tracking-wide text-white/55">
                Ubicación actual
              </span>
              <span className="flex items-center gap-1 text-[14px] font-extrabold text-[#f5e6d3] transition-colors group-hover:text-white">
                <MaterialSymbol
                  icon="near_me"
                  size={14}
                  fill={showLocationDropdown}
                />
                {shortLocation}
                <MaterialSymbol
                  icon="expand_more"
                  size={15}
                  className={cn(
                    "text-[#f5e6d3]/80 transition-transform duration-200",
                    showLocationDropdown && "rotate-180",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Portals escape the category/header stacking contexts. */}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Cerrar notificaciones"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-x-0 bottom-0 z-45 cursor-default bg-black/15 backdrop-blur-[2.5px] dark:bg-black/45"
                    style={{ top: notificationPos?.backdropTop ?? 0 }}
                  />
                  <motion.div
                    {...NOTIFICATION_POPOVER_MOTION}
                    style={{
                      position: "fixed",
                      top: notificationPos?.top ?? 64,
                      right: notificationPos?.right ?? 16,
                    }}
                    className="z-50 w-[min(270px,calc(100vw-2rem))] rounded-[18px] border border-white/40 bg-[#faf6f1]/96 p-3 text-gray-800 shadow-2xl backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/96"
                  >
                    <div className="max-h-[200px] space-y-1.5 overflow-y-auto">
                      {NOTIFICATIONS.map((n, idx) => (
                        <div
                          key={idx}
                          className="flex cursor-pointer gap-2 rounded-xl bg-[#ede4d9]/60 p-2.5 text-left transition-colors hover:bg-[#ede4d9] dark:bg-[#2a2623] dark:hover:bg-[#302c28]/60"
                        >
                          <span className="select-none text-base">{n.emoji}</span>
                          <div className="flex min-w-0 flex-col">
                            <span className="text-[10px] font-bold leading-tight text-gray-800 dark:text-[#d4cfc9]">
                              {n.title}
                            </span>
                            <span className="mt-0.5 text-[8px] font-medium text-gray-400 dark:text-gray-500">
                              {n.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Location dropdown — fixed to button coordinates */}
            <AnimatePresence>
              {showLocationDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6, x: "-50%" }}
                  animate={{ opacity: 1, y: 0, x: "-50%" }}
                  exit={{ opacity: 0, y: -4, x: "-50%" }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: "fixed",
                    top: dropdownPos?.top ?? 160,
                    left: dropdownPos?.left ?? "50%",
                  }}
                  className="z-50 w-[min(290px,calc(100vw-2rem))] rounded-[20px] border border-white/40 bg-[#faf6f1]/96 p-3.5 shadow-2xl backdrop-blur-md dark:border-[#3d3732] dark:bg-[#1c1917]/96"
                >
                  <div className="space-y-1.5">
                    {savedAddresses.map((addr) => {
                      const isSelected = addr.id === selectedAddressId;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => onSelectAddress(addr.id)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all duration-200",
                            isSelected
                              ? "border-[1.5px] border-[#9a0002] bg-[#9a0002]/5 font-bold text-[#9a0002]"
                              : "border border-[#ddd4c8] text-gray-700 hover:bg-[#ede4d9]/50 dark:border-[#3d3732]/60 dark:text-gray-300 dark:hover:bg-[#302c28]/40",
                          )}
                        >
                          <span className="max-w-[80%] truncate text-[11px]">
                            {addr.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Editar: ${addr.name}`);
                            }}
                            className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-[#d4cfc9]"
                          >
                            <MaterialSymbol icon="edit" size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Agregar dirección");
                      onLocationClick();
                    }}
                    className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#ddd4c8] bg-[#ede4d9] py-2.5 text-[10px] font-bold transition-all hover:bg-[#9a0002]/5 hover:text-[#9a0002] dark:border-[#3d3732] dark:bg-[#2a2623]"
                  >
                    <MaterialSymbol icon="add" size={12} />
                    <span>Agregar nueva dirección</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}

      {/* Categories sit on the bottom oval curve.
          The wrapper overlaps the header, so it must let clicks pass through
          its empty areas to the search / theme / notifications / location controls. */}
      <div
        className="pointer-events-none relative z-20 px-0 pb-0.5"
        style={{ marginTop: -geo.sagitta }}
      >
        <AnimatePresence>
          {showSpecialties && (
            <motion.button
              key="back"
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8, transition: { duration: 0.18 } }}
              onClick={returnToCategories}
              className="pointer-events-auto absolute left-3 top-1 z-30 flex cursor-pointer items-center gap-1 rounded-full border border-[#9a0002]/15 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#9a0002] shadow-sm backdrop-blur-sm dark:border-[#3d3732] dark:bg-[#1c1917]/90"
            >
              <MaterialSymbol icon="arrow_back" size={13} />
              Categorías
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={showSpecialties ? "specialties" : "categories"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <ArcCarousel
              key={showSpecialties ? "specialties" : "categories"}
              items={showSpecialties ? specialtyItems : categoryItems}
              selectedId={showSpecialties ? activeSpecialty : activeCategory}
              onSelect={showSpecialties ? onSpecialtyChange : selectCategory}
              geo={geo}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
