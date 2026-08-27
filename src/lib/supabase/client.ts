import { createBrowserClient } from "@supabase/ssr";

/** remember=false → cookie más corta (8h); true/omit → 30 días */
export function createClient(opts?: { remember?: boolean }) {
  const maxAge =
    opts?.remember === false ? 60 * 60 * 8 : 60 * 60 * 24 * 30;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { maxAge },
    },
  );
}
