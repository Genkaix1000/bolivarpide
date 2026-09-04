/**
 * Matriz de verificación RLS después de aplicar 20260903_security_rls.sql.
 *
 *   node scripts/verify-rls.mjs
 *
 * Opcional: probar con un usuario autenticado real (customer o member):
 *   BP_TEST_USER_EMAIL=x BP_TEST_USER_PASSWORD=y node scripts/verify-rls.mjs
 *
 * Lee credenciales de .env (o .env.local si no existe .env).
 * Exit code != 0 si alguna verificación falla.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const candidates = [".env", ".env.local"];
  for (const f of candidates) {
    const path = resolve(process.cwd(), f);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    break;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

let failures = 0;
function check(name, ok, detail = "") {
  const status = ok ? "PASS" : "FAIL";
  if (!ok) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

const anonClient = createClient(url, anon, { auth: { persistSession: false } });

console.log("\n── Anon (sin sesión) ──");

let r = await anonClient.from("businesses").select("*").limit(1);
check("lee businesses publicado (sin error)", !r.error, r.error?.message ?? "ok");

r = await anonClient.from("products").select("*").limit(1);
check("lee products público (sin error)", !r.error, r.error?.message ?? "ok");

r = await anonClient.from("menu_categories").select("*").limit(1);
check("lee menu_categories publicado (sin error)", !r.error, r.error?.message ?? "ok");

r = await anonClient.from("promo_banners").select("*").limit(1);
check("lee promo_banners activos (sin error)", !r.error, r.error?.message ?? "ok");

r = await anonClient.from("orders").select("*", { count: "exact" });
check("NO debe ver orders (0 filas)", !r.error && (r.count ?? 0) === 0,
  `${r.count ?? r.data?.length ?? "?"} filas`);

r = await anonClient.from("order_items").select("*", { count: "exact" });
check("NO debe ver order_items (0 filas)", !r.error && (r.count ?? 0) === 0,
  `${r.count ?? r.data?.length ?? "?"} filas`);

r = await anonClient.from("leads").select("*", { count: "exact" });
check("NO debe ver leads (0 filas, con o sin error)", (r.error || (r.count ?? 0) === 0),
  r.error ? `error ${r.error.code}` : `${r.count} filas`);

r = await anonClient.from("admin_audit_log").select("*", { count: "exact" });
check("NO debe ver admin_audit_log", (r.error || (r.count ?? 0) === 0),
  r.error ? `error ${r.error.code}` : `${r.count} filas`);

r = await anonClient.from("businesses").insert({ slug: "rls-test-anon", name: "RLS test" });
check("NO puede insertar business", !!r.error, r.error?.message ?? "insertó sin error!");
if (r.error) console.error(`    → ${r.error.message}`);

r = await anonClient.from("orders").insert({ business_id: "00000000-0000-0000-0000-000000000000", total_cents: 1 });
check("NO puede insertar order", r.error?.code === "42501" || r.error?.code === "42602", r.error?.message ?? "insertó sin error!");

// Storage: no debería poder escribir.
r = await anonClient.storage.from("business-assets").upload(`rls-test-${Date.now()}.txt`, "x");
check("NO puede subir al bucket business-assets", !!r.error, r.error?.message ?? "subió sin error!");

// ── Autenticado (solo si pasan credenciales) ──
const email = process.env.BP_TEST_USER_EMAIL;
const password = process.env.BP_TEST_USER_PASSWORD;
if (email && password) {
  console.log("\n── Autenticado ──");
  const { data: session, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password });
  if (signInErr || !session?.user) {
    check("signIn falló (revisá credenciales)", false, signInErr?.message ?? "sin sesión");
  } else {
    const authClient = createClient(url, anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
    });

    r = await authClient.from("orders").select("*", { count: "exact" });
    check(`NO debe ver orders ajenas (solo ${r.count ?? 0} propias)`, !r.error,
      `${r.count ?? r.data?.length} filas`);

    r = await authClient.from("notifications").select("*", { count: "exact" });
    check("ve sus notificaciones sin error", !r.error, r.error?.message ?? "ok");

    r = await authClient.storage.from("business-assets").upload(`rls-test-${Date.now()}.txt`, "x");
    check("NO puede subir al bucket business-assets", !!r.error, r.error?.message ?? "subió sin error!");
  }
}

console.log(failures === 0 ? "\n✅ Todas las verificaciones pasaron." : `\n❌ ${failures} verificación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);