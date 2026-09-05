// Web Push sender — invocada por el trigger de DB (net.http_post) cuando se inserta una notificacion.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

type PushPayload = {
  user_id?: string;
  category?: string;
  title?: string;
  body?: string;
  action_url?: string | null;
  payload?: Record<string, unknown>;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta ${name} en secrets de la funcion`);
  return value;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204 });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const secret = req.headers.get("x-push-secret") ?? "";
  const expected = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";
  if (!expected || secret !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("json invalido", { status: 400 });
  }
  if (!payload.user_id) {
    return new Response("falta user_id", { status: 400 });
  }

  const supabase = createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  // Preferencias del usuario para gatear por categoria.
  // user_profiles PK es user_id (no id) — el eq anterior nunca matcheaba.
  const { data: prefs } = await supabase
    .from("user_profiles")
    .select("notification_orders, notification_promos")
    .eq("user_id", payload.user_id)
    .maybeSingle();

  const category = payload.category ?? "orders";
  const allow =
    category === "orders"
      ? prefs?.notification_orders !== false
      : category === "promos"
        ? prefs?.notification_promos === true
        : true;
  if (!allow) {
    return new Response("pref apagado", { status: 200 });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", payload.user_id);

  if (!subs || subs.length === 0) {
    return new Response("sin suscripciones", { status: 200 });
  }

  webpush.setVapidDetails(
    getEnv("VAPID_SUBJECT"),
    getEnv("VAPID_PUBLIC_KEY"),
    getEnv("VAPID_PRIVATE_KEY"),
  );

  const notification = JSON.stringify({
    title: payload.title ?? "BolivarPide",
    body: payload.body ?? "",
    url: payload.action_url ?? "/",
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification,
      );
      sent += 1;
    } catch (err) {
      const code = (err as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});