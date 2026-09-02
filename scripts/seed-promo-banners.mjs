/**
 * Seed independiente de banners y publicidades de portada.
 * Uso:
 *   node scripts/seed-promo-banners.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MVP_PROMO_BANNERS, seedPromoBanners } from "./seed-mvp-businesses.mjs";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log("🚀 Iniciando seed de publicidades y banners destacados...");
  await seedPromoBanners(supabase);
  console.log("🏁 Proceso de seed de publicidades finalizado.\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
