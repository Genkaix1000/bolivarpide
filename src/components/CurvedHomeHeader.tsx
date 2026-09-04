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
} from "react";
import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  PROMO_BANNERS,
  RESTAURANT_SPECIALTIES,
  type PromoBanner,
} from "@/lib/mockData";

interface CurvedHomeHeaderProps {
  activeCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  activeSpecialty: string | null;
  onSpecialtyChange: (id: string | null) => void;
  promoBanners?: PromoBanner[];
  className?: string;
}

interface CarouselItem {
  id: string;
  label: string;
  icon: string;
  image?: string;
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
/** Vertical pad at the left/right ends so the promo carousel & controls sit comfortably inside the red. */
const MIN_EDGE_HEIGHT = 165;

function HeaderFullBleedPromoCarousel({ banners }: { banners?: PromoBanner[] }) {
  const items = banners && banners.length > 0 ? banners : PROMO_BANNERS;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const x = useMotionValue(0);
  const n = items.length;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Snap strip to the active slide (also after resize).
  useEffect(() => {
    if (!width || dragging) return;
    animate(x, -index * width, {
      type: "spring",
      stiffness: 320,
      damping: 34,
      mass: 0.85,
    });
  }, [index, width, dragging, x]);

  useEffect(() => {
    if (isPaused || dragging || !width || n <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, dragging, width, n]);

  const goTo = (idx: number) => {
    setIndex(Math.min(Math.max(idx, 0), n - 1));
  };

  return (
    <div
      ref={viewportRef}
      className="absolute inset-0 select-none overflow-hidden touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {width > 0 && (
        <motion.div
          className="flex h-full cursor-grab active:cursor-grabbing"
          style={{ x, width: width * n }}
          drag="x"
          dragConstraints={{ left: -(n - 1) * width, right: 0 }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragStart={() => {
            setDragging(true);
            setIsPaused(true);
          }}
          onDragEnd={(_, info) => {
            const offset = info.offset.x;
            const velocity = info.velocity.x;
            let next = index;
            // Follow the finger: enough distance OR a flick.
            if (offset < -width * 0.18 || velocity < -500) {
              next = Math.min(index + 1, n - 1);
            } else if (offset > width * 0.18 || velocity > 500) {
              next = Math.max(index - 1, 0);
            }
            setIndex(next);
            setDragging(false);
            window.setTimeout(() => setIsPaused(false), 2600);
          }}
        >
          {items.map((banner, i) => (
            <div
              key={banner.id}
              className="relative h-full flex-shrink-0 overflow-hidden"
              style={{ width }}
            >
              {banner.image && (
                <img
                  src={banner.image}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 90% 75% at 50% 100%, rgba(107,0,1,0.92) 0%, rgba(154,0,2,0.5) 32%, rgba(154,0,2,0.1) 58%, transparent 72%)",
                }}
              />

              <motion.div
                className="relative z-10 mx-auto flex h-full max-w-[1040px] flex-col justify-center px-5 pb-14 pt-12 sm:px-10 md:px-12"
                animate={{ opacity: !dragging || i === index ? 1 : 0.55 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex max-w-[90%] flex-col items-start sm:max-w-[62%] md:max-w-[52%]">
                  {banner.badge && (
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#9a0002] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md sm:text-[11px]">
                      <MaterialSymbol icon={banner.icon || "local_offer"} size={14} fill />
                      {banner.badge}
                    </span>
                  )}
                  <h2 className="text-lg font-black leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-2xl md:text-3xl">
                    {banner.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 max-w-[420px] text-xs font-medium text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-sm">
                    {banner.subtitle}
                  </p>
                  {banner.ctaText && (
                    banner.ctaLink && banner.ctaLink.startsWith("/") ? (
                      <Link
                        href={banner.ctaLink}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#faf6f1] px-5 text-sm font-black text-[#9a0002] shadow-lg shadow-black/25 transition-all hover:bg-white active:scale-[0.97]"
                      >
                        <MaterialSymbol icon={banner.icon || "arrow_forward"} size={18} fill />
                        <span>{banner.ctaText}</span>
                        <MaterialSymbol icon="arrow_forward" size={16} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          if (banner.ctaLink && banner.ctaLink.startsWith("#")) {
                            const el = document.getElementById(banner.ctaLink.slice(1));
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#faf6f1] px-5 text-sm font-black text-[#9a0002] shadow-lg shadow-black/25 transition-all hover:bg-white active:scale-[0.97]"
                      >
                        <MaterialSymbol icon={banner.icon || "arrow_forward"} size={18} fill />
                        <span>{banner.ctaText}</span>
                        <MaterialSymbol icon="arrow_forward" size={16} />
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-0.5 pt-3">
        {items.map((_, idx) => {
          const active = idx === index;
          return (
            <button
              key={idx}
              type="button"
              aria-label={`Promo ${idx + 1}`}
              aria-current={active}
              onClick={() => goTo(idx)}
              className="pointer-events-auto flex h-10 min-w-10 cursor-pointer items-center justify-center"
            >
              <span
                className={cn(
                  "block rounded-full transition-all duration-300",
                  active
                    ? "h-2 w-6 bg-white shadow-sm shadow-black/30"
                    : "h-2 w-2 bg-white/45 hover:bg-white/70",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

/** Room under the icon for a 2-line label (was clipping specialty names). */
const LABEL_SPACE = 28;
function arcStageHeight(geo: ArcGeometry): number {
  // Icon bottom at deepest point ≈ sagitta + ICON_CENTER, then label below.
  return geo.sagitta + ICON_CENTER + LABEL_SPACE;
}

/** Mouse/pen: press + drag to scroll. Touch keeps native pan (feels better). */
function attachDragScroll(
  el: HTMLElement,
  opts?: { snap?: number | (() => number) },
) {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    el.scrollLeft = startScroll - dx;
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = "";
    const snapRaw = opts?.snap;
    const snap = typeof snapRaw === "function" ? snapRaw() : snapRaw;
    if (snap && snap > 0) {
      const i = Math.round(el.scrollLeft / snap);
      el.scrollTo({ left: i * snap, behavior: "smooth" });
    }
    if (moved) {
      const suppress = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        el.removeEventListener("click", suppress, true);
      };
      el.addEventListener("click", suppress, true);
    }
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  el.style.cursor = "grab";
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  return () => {
    el.style.cursor = "";
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
  };
}

/** Short centered scrubber — only when content overflows. */
function MiniScrollBar({
  scrollLeft,
  scrollWidth,
  clientWidth,
  onSeek,
}: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  onSeek: (left: number) => void;
}) {
  if (scrollWidth <= clientWidth + 2) return null;
  const trackW = 112;
  const max = Math.max(scrollWidth - clientWidth, 1);
  const thumbW = Math.max((clientWidth / scrollWidth) * trackW, 28);
  const thumbX = (scrollLeft / max) * (trackW - thumbW);

  return (
    <div
      className="pointer-events-auto mx-auto mt-1 h-3 w-[112px] cursor-pointer touch-none"
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), trackW);
        onSeek((x / trackW) * max);
      }}
      role="scrollbar"
      aria-controls="semicircle-track"
      aria-valuenow={Math.round(scrollLeft)}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
    >
      <div className="relative top-1 h-1 w-full rounded-full bg-[#9a0002]/20 dark:bg-[#9a0002]/30">
        <div
          className="absolute top-0 h-1 rounded-full bg-[#9a0002]"
          style={{ width: thumbW, left: thumbX }}
        />
      </div>
    </div>
  );
}

function CategoryButton({
  item,
  isActive,
  onSelect,
  style,
  className,
  buttonRef,
}: {
  item: CarouselItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  style?: CSSProperties;
  className?: string;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        // No CSS transition on transform — arc Y is updated every scroll frame in JS.
        "pointer-events-auto flex flex-col items-center gap-1",
        className,
      )}
      style={style}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full border bg-white p-0.5 shadow-sm transition-all duration-300 active:scale-90 dark:bg-[#231f1c] overflow-hidden",
          isActive
            ? "scale-105 border-[#9a0002] text-[#9a0002] shadow-md ring-2 ring-[#9a0002]"
            : "border-gray-200 text-gray-700 hover:border-[#9a0002]/40 dark:border-[#3d3732] dark:text-gray-300",
        )}
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.label}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <MaterialSymbol
            icon={item.icon}
            size={26}
            fill={isActive}
            className={isActive ? "text-[#9a0002]" : "text-gray-700 dark:text-gray-300"}
          />
        )}
      </span>
      <span className="line-clamp-2 w-full max-w-[72px] text-center text-[10px] font-bold leading-tight tracking-tight text-gray-700 dark:text-gray-300">
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
  backButton,
}: {
  items: CarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geo: ArcGeometry;
  backButton?: React.ReactNode;
}) {
  const n = items.length;
  const edgePad = fitEdgePad(geo.width);
  const usable = Math.max(geo.width - edgePad * 2, 1);

  return (
    <div className="pointer-events-none flex w-full flex-col items-center">
      <div
        className="semicircle-stage pointer-events-none relative w-full overflow-visible"
        style={{ height: arcStageHeight(geo) }}
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
      {backButton && (
        <div className="pointer-events-none relative mt-1 flex w-full items-center justify-center px-4">
          <div className="absolute left-4">{backButton}</div>
        </div>
      )}
    </div>
  );
}

/** Drag mode: native touch pan + mouse drag; arc Y via DOM (no React lag on fast scroll). */
function DragArcCarousel({
  items,
  selectedId,
  onSelect,
  geo,
  backButton,
}: {
  items: CarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geo: ArcGeometry;
  backButton?: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const [bar, setBar] = useState({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 });

  const sidePad = SIDE_PAD;
  const pitch = ITEM_BOX + ITEM_GAP;

  const applyArc = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sl = el.scrollLeft;
    for (let i = 0; i < items.length; i++) {
      const node = itemRefs.current[i];
      if (!node) continue;
      const y = arcY(sidePad + i * pitch + ITEM_BOX / 2 - sl, geo) - ICON_CENTER;
      node.style.transform = `translateY(${y}px)`;
    }
  }, [items.length, sidePad, pitch, geo]);

  const syncBar = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setBar({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });
  }, []);

  const onScroll = useCallback(() => {
    applyArc();
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      syncBar();
    });
  }, [applyArc, syncBar]);

  useLayoutEffect(() => {
    applyArc();
    syncBar();
  }, [applyArc, syncBar, items.length, geo.width]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      applyArc();
      syncBar();
    });
    ro.observe(el);
    const detachDrag = attachDragScroll(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      detachDrag();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll, applyArc, syncBar]);

  return (
    <div className="pointer-events-none flex w-full flex-col items-center">
      <div
        className="semicircle-stage pointer-events-none relative w-full"
        style={{ height: arcStageHeight(geo) }}
      >
        <div
          ref={scrollRef}
          id="semicircle-track"
          className="semicircle-track pointer-events-auto flex h-full overflow-x-auto no-scrollbar"
          style={{
            gap: ITEM_GAP,
            paddingLeft: sidePad,
            paddingRight: sidePad,
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
          }}
        >
          {items.map((item, idx) => (
            <CategoryButton
              key={`${item.id}-${idx}`}
              item={item}
              isActive={selectedId === item.id}
              onSelect={onSelect}
              className="flex-shrink-0"
              buttonRef={(node) => {
                itemRefs.current[idx] = node;
              }}
              style={{ width: ITEM_BOX }}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none relative mt-1 flex w-full items-center justify-center px-4">
        {backButton && <div className="absolute left-4">{backButton}</div>}
        <MiniScrollBar
          scrollLeft={bar.scrollLeft}
          scrollWidth={bar.scrollWidth}
          clientWidth={bar.clientWidth}
          onSeek={(left) => {
            scrollRef.current?.scrollTo({ left, behavior: "smooth" });
          }}
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
  backButton,
}: {
  items: CarouselItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  geo: ArcGeometry;
  backButton?: React.ReactNode;
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
        backButton={backButton}
      />
    );
  }

  return (
    <DragArcCarousel
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      geo={geo}
      backButton={backButton}
    />
  );
}

export default function CurvedHomeHeader({
  activeCategory,
  onCategoryChange,
  activeSpecialty,
  onSpecialtyChange,
  promoBanners,
  className,
}: CurvedHomeHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [headerWidth, setHeaderWidth] = useState(0);
  const [showSpecialties, setShowSpecialties] = useState(false);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    onCategoryChange(null);
  };

  const svgW = headerWidth || 375;
  const svgH = Math.ceil(headerHeight);
  const fillPath = ovalHeaderPath(svgW, headerCurveDepth, MIN_EDGE_HEIGHT);
  const clipId = `header-clip-${reactId.replace(/:/g, "")}`;

  return (
    <div ref={headerRef} className={cn("relative w-full", className)}>
      {/* Oval header: promo clipped to shape; bowl scrim lives inside carousel under text */}
      <div className="relative overflow-hidden text-white" style={{ height: svgH }}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={headerWidth || "100%"}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <path d={fillPath} />
            </clipPath>
          </defs>
        </svg>

        <div
          className="absolute inset-0"
          style={{ clipPath: `url(#${clipId})` }}
        >
          <HeaderFullBleedPromoCarousel banners={promoBanners} />
        </div>
      </div>

      {/* Categories sit on the bottom oval curve. */}
      <div
        className="pointer-events-none relative z-20 px-0 pb-0.5"
        style={{ marginTop: -geo.sagitta }}
      >
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
              backButton={
                showSpecialties ? (
                  <button
                    type="button"
                    onClick={returnToCategories}
                    className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1c1917]/95 px-3 py-1 text-[11px] font-bold text-gray-800 dark:text-gray-100 shadow-md backdrop-blur-md hover:bg-white hover:text-[#9a0002] dark:hover:text-red-400 transition-all active:scale-95 shrink-0"
                  >
                    <MaterialSymbol icon="arrow_back" size={14} />
                    <span>Volver</span>
                  </button>
                ) : undefined
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
