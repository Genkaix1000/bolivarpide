"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  UserProfile,
  UserAvatar,
  UserAwardBadge,
  DEFAULT_USER_PROFILE,
} from "@/lib/userProfile";
import { createClient } from "@/lib/supabase/client";
import { fetchUserProfile, rowToProfile } from "@/lib/userProfileDb";
import { saveUserProfileAction } from "@/lib/userProfileActions";
import { flashToast } from "@/components/FlashToast";

interface UserProfileContextValue {
  profile: UserProfile;
  isAuthenticated: boolean;
  hasActiveBusiness: boolean;
  updateAvatar: (avatar: UserAvatar) => void;
  updateName: (name: string) => void;
  awardBadge: (badge: UserAwardBadge) => void;
  removeBadge: (badgeId: string) => void;
  resetProfile: () => void;
  logout: () => Promise<void>;
  persistProfile: (next: UserProfile) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function initialsFrom(name: string, email: string) {
  const base = (name || email.split("@")[0] || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 3);
  return base.slice(0, 2).toUpperCase() || "?";
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveBusiness, setHasActiveBusiness] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    setProfileReady(true);
  }, []);

  const persistProfile = useCallback(async (next: UserProfile) => {
    await saveUserProfileAction(next);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        setHasActiveBusiness(false);
        setProfile(DEFAULT_USER_PROFILE);
        skipNextSave.current = true;
        return;
      }

      setIsAuthenticated(true);
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Usuario";
      const email = user.email ?? "";

      const { count } = await supabase
        .from("business_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");
      setHasActiveBusiness((count ?? 0) > 0);

      try {
        const row = await fetchUserProfile(user.id);
        skipNextSave.current = true;
        if (row) {
          setProfile(rowToProfile(row, { name, email }));
        } else {
          setProfile({
            ...DEFAULT_USER_PROFILE,
            id: user.id,
            name,
            email,
            avatar: {
              type: "initials",
              value: initialsFrom(name, email),
              gradientId: "cherry",
            },
          });
        }
      } catch {
        setProfile({
          ...DEFAULT_USER_PROFILE,
          id: user.id,
          name,
          email,
          avatar: {
            type: "initials",
            value: initialsFrom(name, email),
            gradientId: "cherry",
          },
        });
      }
    };

    void syncUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || profile.id === "guest") return;
    const supabase = createClient();
    void (async () => {
      const { count } = await supabase
        .from("business_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "active");
      setHasActiveBusiness((count ?? 0) > 0);
    })();
  }, [pathname, isAuthenticated, profile.id]);

  useEffect(() => {
    if (!profileReady || !isAuthenticated || profile.id === "guest") return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void saveUserProfileAction(profile).catch(() => {
        flashToast("No se pudo guardar tu perfil.");
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [profile, profileReady, isAuthenticated]);

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

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_USER_PROFILE);
    setIsAuthenticated(false);
    setHasActiveBusiness(false);
    skipNextSave.current = true;
  }, []);

  const logout = useCallback(async () => {
    flashToast("Sesión cerrada.");
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      setProfile(DEFAULT_USER_PROFILE);
      setIsAuthenticated(false);
      setHasActiveBusiness(false);
      skipNextSave.current = true;
    }
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isAuthenticated,
      hasActiveBusiness,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      resetProfile,
      logout,
      persistProfile,
    }),
    [
      profile,
      isAuthenticated,
      hasActiveBusiness,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      resetProfile,
      logout,
      persistProfile,
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
