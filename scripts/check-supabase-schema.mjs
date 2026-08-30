/**
 * Verifica tablas en el proyecto Supabase de .env.local (sin imprimir secrets).
 * node scripts/check-supabase-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const ref = url.match(/https:\/\/([^.]+)\./)?.[1] ?? "?";
console.log("Proyecto Supabase (ref):", ref);

const sb = createClient(url, key, { auth: { persistSession: false } });
const tables = ["businesses", "products", "menu_categories", "business_members"];

for (const t of tables) {
  const { error } = await sb.from(t).select("*", { head: true, count: "exact" });
  if (error) console.log(`  ${t}: FALTA (${error.code})`);
  else console.log(`  ${t}: ok`);
}
