"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCart } from "@/components/CartProvider";
import type { FeaturedChain, TrendingItem } from "@/lib/business/types";
import { getProductLikesSnapshot, toggleProductLike } from "@/lib/likes/actions";
import { getLikeSessionId } from "@/lib/likes/session";
import { cn } from "@/lib/utils";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function hasRealPhoto(item: TrendingItem) {
  return Boolean(item.photoImage?.trim());
}

function SlideMedia({ item, eager }: { item: TrendingItem; eager: boolean }) {
  const photo = item.photoImage?.trim();
  const icon = item.iconImage?.trim() || item.image?.trim();
  const loading = eager ? "eager" : "lazy";

  if (hasRealPhoto(item) && photo) {
    return (
      <div className="absolute inset-0">
        <img
          src={photo}
          alt=""
          loading={loading}
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-[28px] brightness-50"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 flex items-center justify-center px-6 pb-28 pt-16">
          <img
            src={photo}
            alt={item.name}
            loading={loading}
            decoding="async"
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl shadow-black/60"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#3d2a22] via-[#1a1210] to-[#0c0908]">
      <div className="absolute inset-0 flex items-center justify-center px-8 pb-28 pt-16">
        {icon ? (
          <img
            src={icon}
            alt={item.name}
            loading={loading}
            decoding="async"
            className="max-h-[min(52vh,280px)] max-w-[280px] rounded-2xl object-contain shadow-2xl shadow-black/50 ring-1 ring-white/10"
            draggable={false}
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white/5 text-5xl text-white/80">
            {item.emoji}
          </div>
        )}
      </div>
    </div>
  );
}

function Slide({
  item,
  chain,
  eager,
  liked,
  likeCount,
  burst,
  onClose,
  onShare,
  onToggleLike,
}: {
  item: TrendingItem;
  chain: FeaturedChain;
  eager: boolean;
  liked: boolean;
  likeCount: number;
  burst: boolean;
  onClose: () => void;
  onShare: (item: TrendingItem) => void;
  onToggleLike: (productId: string, forceLike?: boolean) => void;
}) {
  const { quickAdd, cart } = useCart();
  const [descOpen, setDescOpen] = useState(false);
  const lastTap = useRef(0);
  const inCart = cart.lines
    .filter((l) => l.productId === item.id)
    .reduce((n, l) => n + l.qty, 0);

  const onCanvasPointerUp = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      onToggleLike(item.id, true);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
  };

  return (
    <section className="relative h-dvh w-full shrink-0 snap-start snap-always overflow-hidden bg-black">
      <div className="absolute inset-0" onPointerUp={onCanvasPointerUp}>
        <SlideMedia item={item} eager={eager} />
      </div>

      {burst ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <MaterialSymbol
            icon="favorite"
            fill
            size={88}
            className="animate-ping text-[#ff4d6d] opacity-90"
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Salir"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
          >
            <MaterialSymbol icon="arrow_back" size={20} />
          </button>
          <div className="rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
            {chain.name}
            <span className="text-white/70">
              {" · "}
              {chain.isOpen === false ? "Cerrado" : `Abierto · ${chain.timeEstimate}`}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-end gap-3">
          <div className="min-w-0 flex-1 text-white drop-shadow-md">
            {item.categoryName ? (
              <span className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
                {item.categoryName}
              </span>
            ) : null}
            <h2 className="text-xl font-bold leading-tight">{item.name}</h2>
            {(item.description || (item.ingredients && item.ingredients.length > 0)) && (
              <div className="mt-1.5">
                <p className={cn("text-[13px] text-white/85", !descOpen && "line-clamp-2")}>
                  {item.description}
                  {descOpen && item.ingredients && item.ingredients.length > 0 ? (
                    <>
                      {item.description ? " · " : ""}
                      {item.ingredients.join(", ")}
                    </>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => setDescOpen((o) => !o)}
                  className="mt-0.5 cursor-pointer text-[12px] font-semibold text-white/90 underline-offset-2 hover:underline"
                >
                  {descOpen ? "menos" : "más"}
                </button>
              </div>
            )}
            <p className="mt-2 text-lg font-bold tabular-nums">{money(item.price)}</p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4 pb-1">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-2 ring-white/30">
              {chain.logoImage ? (
                <img src={chain.logoImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{chain.logoEmoji}</span>
              )}
            </div>
            <button
              type="button"
              aria-label={liked ? "Quitar me gusta" : "Me gusta"}
              aria-pressed={liked}
              onClick={() => onToggleLike(item.id)}
              className="flex flex-col items-center gap-0.5 active:scale-95"
            >
              <span
                className={cn(
                  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-transform",
                  liked && "scale-110",
                )}
              >
                <MaterialSymbol
                  icon="favorite"
                  fill={liked}
                  size={26}
                  className={liked ? "text-[#ff4d6d]" : "text-white"}
                />
              </span>
              <span className="text-[11px] font-bold tabular-nums text-white drop-shadow">
                {likeCount > 0 ? likeCount : ""}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Agregar ${item.name}`}
              onClick={() => quickAdd(item)}
              className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#9a0002] text-white shadow-lg active:scale-95"
            >
              <MaterialSymbol icon="add_shopping_cart" size={22} />
              {inCart > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#9a0002]">
                  {inCart}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              aria-label="Compartir"
              onClick={() => onShare(item)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md active:scale-95"
            >
              <MaterialSymbol icon="share" size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type Props = {
  chain: FeaturedChain;
  products: TrendingItem[];
  initialProductId?: string | null;
  open: boolean;
  onClose: () => void;
};

export function MenuReelsFeed({ chain, products, initialProductId, open, onClose }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [burstId, setBurstId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const toggling = useRef<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || products.length === 0) return;
    const ids = products.map((p) => p.id);
    const sessionId = getLikeSessionId();
    let cancelled = false;
    void getProductLikesSnapshot(ids, sessionId)
      .then((snap) => {
        if (cancelled) return;
        setCounts(snap.counts);
        setLiked(new Set(snap.likedIds));
      })
      .catch(() => {
        /* table may not exist yet locally */
      });
    return () => {
      cancelled = true;
    };
  }, [open, products]);

  useEffect(() => {
    if (!open || products.length === 0) return;
    const idx = Math.max(
      0,
      initialProductId ? products.findIndex((p) => p.id === initialProductId) : 0,
    );
    const start = idx < 0 ? 0 : idx;
    setActiveIndex(start);
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTop = start * el.clientHeight;
    });
  }, [open, initialProductId, products]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onShare = async (item: TrendingItem) => {
    const url = `${window.location.origin}/c/${chain.id}?dish=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, text: `${item.name} · ${chain.name}`, url });
        return;
      }
    } catch {
      /* cancelled */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  const onToggleLike = (productId: string, forceLike?: boolean) => {
    if (toggling.current.has(productId)) return;
    if (forceLike && liked.has(productId)) {
      setBurstId(productId);
      window.setTimeout(() => setBurstId((id) => (id === productId ? null : id)), 450);
      return;
    }

    const wasLiked = liked.has(productId);
    const nextLiked = !wasLiked;
    setLiked((prev) => {
      const n = new Set(prev);
      if (nextLiked) n.add(productId);
      else n.delete(productId);
      return n;
    });
    setCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] ?? 0) + (nextLiked ? 1 : -1)),
    }));
    if (nextLiked) {
      setBurstId(productId);
      window.setTimeout(() => setBurstId((id) => (id === productId ? null : id)), 450);
    }

    toggling.current.add(productId);
    startTransition(() => {
      void toggleProductLike(productId, getLikeSessionId())
        .then((res) => {
          setLiked((prev) => {
            const n = new Set(prev);
            if (res.liked) n.add(productId);
            else n.delete(productId);
            return n;
          });
          setCounts((prev) => ({ ...prev, [productId]: res.count }));
        })
        .catch(() => {
          // rollback optimistic
          setLiked((prev) => {
            const n = new Set(prev);
            if (wasLiked) n.add(productId);
            else n.delete(productId);
            return n;
          });
          setCounts((prev) => ({
            ...prev,
            [productId]: Math.max(0, (prev[productId] ?? 0) + (wasLiked ? 1 : -1)),
          }));
        })
        .finally(() => {
          toggling.current.delete(productId);
        });
    });
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el?.clientHeight) return;
    const next = Math.round(el.scrollTop / el.clientHeight);
    if (next !== activeIndex) setActiveIndex(next);
  };

  if (!mounted || !open || products.length === 0) return null;

  // ponytail: render all slides (menus are small); virtualize to ±1 if OOM on huge catalogs
  return createPortal(
    <div className="fixed inset-0 z-[55] bg-black" role="dialog" aria-modal="true" aria-label="Menú en Reels">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="h-dvh w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
      >
        {products.map((item, i) => (
          <Slide
            key={item.id}
            item={item}
            chain={chain}
            eager={Math.abs(i - activeIndex) <= 1}
            liked={liked.has(item.id)}
            likeCount={counts[item.id] ?? 0}
            burst={burstId === item.id}
            onClose={onClose}
            onShare={onShare}
            onToggleLike={onToggleLike}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
