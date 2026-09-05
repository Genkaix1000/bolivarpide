"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft } from "@phosphor-icons/react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  listMyLikedProducts,
  toggleProductLike,
  type LikedProduct,
} from "@/lib/likes/actions";
import { getLikeSessionId } from "@/lib/likes/session";
import { cn } from "@/lib/utils";

function money(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export function FavoritosView() {
  const router = useRouter();
  const [items, setItems] = useState<LikedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const reload = () => {
    setLoading(true);
    setError(null);
    void listMyLikedProducts(getLikeSessionId())
      .then(setItems)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudieron cargar los favoritos");
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const unlike = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
    startTransition(() => {
      void toggleProductLike(productId, getLikeSessionId()).catch(() => reload());
    });
  };

  return (
    <div className="min-h-dvh bg-[#f3efe8] dark:bg-[#141210]">
      <header className="sticky top-0 z-40 border-b border-[#e8e0d6]/90 bg-[#faf6f1]/95 backdrop-blur-md dark:border-[#3d3732]/90 dark:bg-[#1c1917]/95">
        <div className="mx-auto flex h-14 max-w-[760px] items-center gap-2 px-4">
          <Link
            href="/"
            aria-label="Volver"
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 hover:bg-black/[0.04] dark:text-stone-300 dark:hover:bg-white/[0.06]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Heart weight="fill" size={20} className="shrink-0 text-[#9a0002]" />
            <h1 className="truncate text-[16px] font-bold text-stone-900 dark:text-stone-100">
              Favoritos
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-4 py-5 pb-24">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-[#e8ddd0]/80 dark:bg-[#231f1c]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#e8e0d6] bg-white p-6 text-center dark:border-[#3d3732] dark:bg-[#1c1917]">
            <p className="text-sm text-stone-600 dark:text-stone-300">{error}</p>
            <p className="mt-2 text-[12px] text-stone-400">
              Probá de nuevo en un momento. Si el problema sigue, puede faltar aplicar la migración de likes.
            </p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 cursor-pointer rounded-full bg-[#9a0002] px-4 py-2 text-[13px] font-bold text-white"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e8e0d6] bg-white/60 px-6 py-12 text-center dark:border-[#3d3732] dark:bg-[#1c1917]/60">
            <Heart size={36} className="mx-auto text-stone-300 dark:text-stone-600" />
            <p className="mt-3 text-[15px] font-semibold text-stone-800 dark:text-stone-100">
              Todavía no hay favoritos
            </p>
            <p className="mt-1 text-[13px] text-stone-500">
              Abrí un menú en Reels y tocá el corazón en un plato.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex cursor-pointer rounded-full bg-[#9a0002] px-4 py-2.5 text-[13px] font-bold text-white"
            >
              Explorar locales
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item) => {
              const href = `/c/${item.storeSlug}?dish=${encodeURIComponent(item.productId)}`;
              const img = item.photoImage || item.iconImage || item.image;
              return (
                <li key={item.productId}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-[#e8e0d6] bg-white p-2.5",
                      "dark:border-[#3d3732] dark:bg-[#1c1917]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(href)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f0ebe4] dark:bg-[#231f1c]">
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <MaterialSymbol icon="restaurant" size={22} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-stone-900 dark:text-stone-100">
                          {item.name}
                        </p>
                        <p className="truncate text-[12px] text-stone-500">{item.storeName}</p>
                        <p className="mt-0.5 text-[13px] font-bold text-[#9a0002]">
                          {money(item.price)}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Quitar de favoritos"
                      onClick={() => unlike(item.productId)}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#9a0002] hover:bg-[#9a0002]/10"
                    >
                      <Heart weight="fill" size={22} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
