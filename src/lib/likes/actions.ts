"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveBusinessAssetUrl } from "@/lib/business/assets";

const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function cleanSession(sessionId: string | null | undefined): string | null {
  if (!sessionId || !SESSION_RE.test(sessionId)) return null;
  return sessionId;
}

export type LikeSnapshot = {
  counts: Record<string, number>;
  likedIds: string[];
};

export type LikedProduct = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  photoImage?: string;
  iconImage?: string;
  storeName: string;
  storeSlug: string;
  likedAt: string;
};

/** Counts + which of these products the caller already liked. */
export async function getProductLikesSnapshot(
  productIds: string[],
  sessionId?: string | null,
): Promise<LikeSnapshot> {
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return { counts: {}, likedIds: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = cleanSession(sessionId);

  const { data: rows, error } = await supabase
    .from("product_likes")
    .select("product_id, user_id, session_id")
    .in("product_id", ids);
  if (error) throw error;

  const counts: Record<string, number> = {};
  const likedIds: string[] = [];
  for (const row of rows ?? []) {
    const pid = row.product_id as string;
    counts[pid] = (counts[pid] ?? 0) + 1;
    if (user && row.user_id === user.id) likedIds.push(pid);
    else if (!user && session && row.session_id === session) likedIds.push(pid);
  }
  return { counts, likedIds };
}

/** Liked dishes for the Favoritos page (auth user or guest session). */
export async function listMyLikedProducts(sessionId?: string | null): Promise<LikedProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = cleanSession(sessionId);

  if (!user && !session) return [];

  // Guests need service read filtered by session.
  const db = user ? supabase : createServiceClient();

  let q = db
    .from("product_likes")
    .select(
      `
      product_id,
      created_at,
      products!inner (
        id,
        name,
        price_cents,
        image_path,
        icon_path,
        businesses!inner (
          slug,
          name,
          published
        )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (user) q = q.eq("user_id", user.id);
  else q = q.eq("session_id", session!).is("user_id", null);

  const { data, error } = await q;
  if (error) throw error;

  const out: LikedProduct[] = [];
  for (const row of data ?? []) {
    const product = row.products as unknown as {
      id: string;
      name: string;
      price_cents: number;
      image_path: string | null;
      icon_path: string | null;
      businesses: { slug: string; name: string; published: boolean } | null;
    };
    const biz = product?.businesses;
    if (!product || !biz?.published || !biz.slug) continue;
    const photo = resolveBusinessAssetUrl(product.image_path);
    const icon = resolveBusinessAssetUrl(product.icon_path);
    out.push({
      productId: product.id,
      name: product.name,
      price: product.price_cents / 100,
      image: icon ?? photo,
      iconImage: icon,
      photoImage: photo,
      storeName: biz.name,
      storeSlug: biz.slug,
      likedAt: row.created_at as string,
    });
  }
  return out;
}

/** Toggle like. Returns { liked, count } for that product after the toggle. */
export async function toggleProductLike(
  productId: string,
  sessionId?: string | null,
): Promise<{ liked: boolean; count: number }> {
  if (!productId) throw new Error("productId requerido");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = cleanSession(sessionId);

  if (!user && !session) throw new Error("Sesión inválida");

  // Guests: service role so RLS stays closed to anon writes.
  const db = user ? supabase : createServiceClient();

  let existingQuery = db
    .from("product_likes")
    .select("id")
    .eq("product_id", productId)
    .limit(1);

  if (user) existingQuery = existingQuery.eq("user_id", user.id);
  else existingQuery = existingQuery.eq("session_id", session!).is("user_id", null);

  const { data: existing, error: findErr } = await existingQuery.maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const { error } = await db.from("product_likes").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await db.from("product_likes").insert(
      user
        ? { product_id: productId, user_id: user.id }
        : { product_id: productId, session_id: session },
    );
    if (error) throw error;
  }

  const { count, error: countErr } = await db
    .from("product_likes")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (countErr) throw countErr;

  if (user && !existing) {
    const { evaluateBadgesForUser } = await import("@/lib/badges/actions");
    await evaluateBadgesForUser(user.id);
  }

  return { liked: !existing, count: count ?? 0 };
}
