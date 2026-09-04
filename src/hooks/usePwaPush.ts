"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PushState = "unsupported" | "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function usePwaPush() {
  const [state, setState] = useState<PushState>("unsupported");
  const [active, setActive] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !isSupported()) {
      setState("unsupported");
      setActive(false);
      return;
    }
    if (window.Notification.permission === "denied") {
      setState("denied");
      setActive(false);
      return;
    }
    if (window.Notification.permission !== "granted") {
      setState("default");
      setActive(false);
      return;
    }
    setState("granted");
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    setActive(Boolean(sub));
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !isSupported()) return;
    if (window.Notification.permission !== "granted") {
      const perm = await window.Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      if (!publicKey) return;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const serialized = sub.toJSON() as {
      endpoint: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: serialized.endpoint,
        p256dh: serialized.keys.p256dh,
        auth: serialized.keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: "user_id,endpoint" },
    );

    setState("granted");
    setActive(true);
  }, []);

  const disable = useCallback(async () => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => undefined);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", endpoint);
        }
      }
    }
    setActive(false);
  }, []);

  return { supported: state !== "unsupported", state, active, enable, disable, refresh };
}