/**
 * Vacía la carta de un negocio (productos). Uso local:
 * node scripts/wipe-carta.mjs <businessId>
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

const businessId = process.argv[2];
if (!businessId) {
  console.error("Uso: node scripts/wipe-carta.mjs <businessId>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error: prodErr, count } = await supabase
  .from("products")
  .delete({ count: "exact" })
  .eq("business_id", businessId);
if (prodErr) {
  console.error("products:", prodErr.message);
  process.exit(1);
}

const cat = await supabase.from("menu_categories").delete().eq("business_id", businessId);
if (cat.error && !/menu_categories|schema cache/i.test(cat.error.message)) {
  console.error("categories:", cat.error.message);
  process.exit(1);
}

console.log(`OK: eliminados ${count ?? 0} productos de ${businessId}`);
