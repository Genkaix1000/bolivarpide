"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/components/UserProfileProvider";
import type { AppNotification } from "@/lib/notifications/types";

export function useNotifications(opts?: { businessId?: string; enabled?: boolean }) {
  const { profile, isAuthenticated } = useUserProfile();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const enabled = (opts?.enabled ?? true) && isAuthenticated && profile.id !== "guest";

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (opts?.businessId) qs.set("businessId", opts.businessId);
      const res = await fetch(`/api/notifications?${qs}`);
      if (!res.ok) return;
      const data = (await res.json()) as { items?: AppNotification[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [enabled, opts?.businessId]);

  const markRead = useCallback(
    async (input?: { id?: string; all?: boolean }) => {
      if (!enabled) return;
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: input?.id,
          all: input?.all,
          businessId: opts?.businessId,
        }),
      });
      if (input?.all) {
        setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      } else if (input?.id) {
        setItems((prev) =>
          prev.map((n) =>
            n.id === input.id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
          ),
        );
      }
    },
    [enabled, opts?.businessId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || profile.id === "guest") return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${profile.id}-${opts?.businessId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, profile.id, opts?.businessId, refresh]);

  const unreadCount = items.filter((n) => !n.readAt).length;

  return { items, unreadCount, loading, refresh, markRead };
}
