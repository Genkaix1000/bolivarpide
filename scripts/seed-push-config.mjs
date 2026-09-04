import { createClient } from "@supabase/supabase-js";

/**
 * Seed de app_settings para el Web Push.
 * Requiere env: SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
 * PUSH_WEBHOOK_SECRET (el mismo que en supabase secrets set) y opcional NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const webhookSecret = process.env.PUSH_WEBHOOK_SECRET;

if (!url || !key) {
  console.error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el env.");
  process.exit(1);
}
if (!webhookSecret) {
  console.error("Falta PUSH_WEBHOOK_SECRET en el env.");
  process.exit(1);
}

const functionUrl = process.env.PUSH_FUNCTION_URL ?? `${url}/functions/v1/send-push`;
const rows = [
  ["push_function_url", functionUrl],
  ["push_webhook_secret", webhookSecret],
];
if (anon) rows.push(["supabase_anon_key", anon]);

const svc = createClient(url, key);
const { error } = await svc.from("app_settings").upsert(
  rows.map(([key, value]) => ({ key, value })),
  { onConflict: "key" },
);

if (error) {
  console.error("Error al seedear app_settings:", error.message);
  process.exit(1);
}
console.log("app_settings actualizadas:", rows.map(([k]) => k).join(", "));