"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  UserProfile,
  UserAvatar,
  UserAwardBadge,
  DEFAULT_USER_PROFILE,
} from "@/lib/userProfile";
import { createClient } from "@/lib/supabase/client";

interface UserProfileContextValue {
  profile: UserProfile;
  isAuthenticated: boolean;
  updateAvatar: (avatar: UserAvatar) => void;
  updateName: (name: string) => void;
  awardBadge: (badge: UserAwardBadge) => void;
  removeBadge: (badgeId: string) => void;
  unlockFrame: (frameId: string) => void;
  resetProfile: () => void;
}

const STORAGE_KEY = "bp_user_profile_v3";

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function initialsFrom(name: string, email: string) {
  const base = (name || email.split("@")[0] || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 3);
  return base.slice(0, 2).toUpperCase() || "?";
}

function getInitialProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.avatar) {
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsed,
          avatar: { ...DEFAULT_USER_PROFILE.avatar, ...parsed.avatar },
          awardedBadges: parsed.awardedBadges || [],
          unlockedFrameIds: parsed.unlockedFrameIds || ["none"],
        };
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_USER_PROFILE;
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(getInitialProfile);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    const supabase = createClient();

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Usuario";
      const email = user.email ?? "";
      setProfile((prev) => {
        const keepCustomAvatar = prev.id === user.id && prev.avatar.value !== "?";
        return {
          ...prev,
          id: user.id,
          name: prev.id === user.id && prev.name ? prev.name : name,
          email,
          avatar: keepCustomAvatar
            ? prev.avatar
            : {
                type: "initials",
                value: initialsFrom(name, email),
                frameId: "none",
                gradientId: prev.avatar.gradientId || "cherry",
              },
        };
      });
    };

    void syncUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  const updateAvatar = useCallback((avatar: UserAvatar) => {
    setProfile((prev) => ({ ...prev, avatar }));
  }, []);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  }, []);

  const awardBadge = useCallback((badge: UserAwardBadge) => {
    setProfile((prev) => {
      if (prev.awardedBadges.some((b) => b.id === badge.id)) return prev;
      return { ...prev, awardedBadges: [badge, ...prev.awardedBadges] };
    });
  }, []);

  const removeBadge = useCallback((badgeId: string) => {
    setProfile((prev) => ({
      ...prev,
      awardedBadges: prev.awardedBadges.filter((b) => b.id !== badgeId),
    }));
  }, []);

  const unlockFrame = useCallback((frameId: string) => {
    setProfile((prev) => {
      if (prev.unlockedFrameIds.includes(frameId)) return prev;
      return { ...prev, unlockedFrameIds: [...prev.unlockedFrameIds, frameId] };
    });
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_USER_PROFILE);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isAuthenticated,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      unlockFrame,
      resetProfile,
    }),
    [
      profile,
      isAuthenticated,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      unlockFrame,
      resetProfile,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
