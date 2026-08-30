/**
 * Limpia únicamente los comercios y cartas de prueba del seed MVP.
 * Uso:
 *   node scripts/wipe-mvp-businesses.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const MVP_SLUGS = [
  "burgerboz",
  "pizzastore",
  "mccafe",
  "sushiworld",
  "empanadas-bolivar",
  "helados-dolce"
];

async function main() {
  console.log("🧹 Limpiando comercios y cartas de prueba del MVP...");

  for (const slug of MVP_SLUGS) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("slug", slug)
      .maybeSingle();

    if (biz) {
      await supabase.from("products").delete().eq("business_id", biz.id);
      await supabase.from("menu_categories").delete().eq("business_id", biz.id);
      await supabase.from("businesses").delete().eq("id", biz.id);
      console.log(`🗑️ Eliminado comercio de prueba: ${biz.name} (${slug})`);
    }
  }

  console.log("✨ Limpieza completada. La base de datos contiene únicamente comercios reales.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
