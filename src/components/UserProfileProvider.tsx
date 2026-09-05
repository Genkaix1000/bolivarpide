"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import {
  clearRememberedAccount,
  readGuestMode,
  readRememberPreference,
  readRememberedAccount,
  setGuestMode,
  writeRememberedAccount,
  type RememberedAccount,
} from "@/lib/auth/rememberedAccount";

export type PlatformRoleClient = "superadmin" | "soporte";

interface UserProfileContextValue {
  profile: UserProfile;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  hasActiveBusiness: boolean;
  platformRole: PlatformRoleClient | null;
  rememberedAccount: RememberedAccount | null;
  updateProfile: (partial: Partial<UserProfile>) => void;
  updateAvatar: (avatar: UserAvatar) => void;
  updateName: (name: string) => void;
  awardBadge: (badge: UserAwardBadge) => void;
  removeBadge: (badgeId: string) => void;
  resetProfile: () => void;
  logout: () => Promise<void>;
  continueSession: () => Promise<void>;
  persistProfile: (next: UserProfile) => Promise<void>;
}

function platformRoleFromMeta(meta: Record<string, unknown> | undefined): PlatformRoleClient | null {
  if (meta?.role !== "admin") return null;
  if (meta.platform_role === "soporte") return "soporte";
  return "superadmin";
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function initialsFrom(name: string, email: string) {
  const base = (name || email.split("@")[0] || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 3);
  return base.slice(0, 2).toUpperCase() || "?";
}

function snapshotAccount(profile: UserProfile): RememberedAccount {
  return {
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
  };
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasActiveBusiness, setHasActiveBusiness] = useState(false);
  const [platformRole, setPlatformRole] = useState<PlatformRoleClient | null>(null);
  const [rememberedAccount, setRememberedAccount] = useState<RememberedAccount | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const skipNextSave = useRef(true);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    queueMicrotask(() => {
      setProfileReady(true);
      setRememberedAccount(readRememberedAccount());
    });
  }, []);

  const persistProfile = useCallback(async (next: UserProfile) => {
    await saveUserProfileAction(next);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const syncUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setGuestMode(false);
          setIsAuthenticated(false);
          setHasActiveBusiness(false);
          setPlatformRole(null);
          setProfile(DEFAULT_USER_PROFILE);
          skipNextSave.current = true;
          return;
        }

        setPlatformRole(platformRoleFromMeta(user.app_metadata as Record<string, unknown>));
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

        let nextProfile: UserProfile;
        try {
          const row = await fetchUserProfile(user.id);
          skipNextSave.current = true;
          nextProfile = row
            ? rowToProfile(row, { name, email })
            : {
                ...DEFAULT_USER_PROFILE,
                id: user.id,
                name,
                email,
                avatar: {
                  type: "initials",
                  value: initialsFrom(name, email),
                  gradientId: "cherry",
                },
              };
        } catch {
          nextProfile = {
            ...DEFAULT_USER_PROFILE,
            id: user.id,
            name,
            email,
            avatar: {
              type: "initials",
              value: initialsFrom(name, email),
              gradientId: "cherry",
            },
          };
        }

        setProfile(nextProfile);

        if (readRememberPreference()) {
          const snap = snapshotAccount(nextProfile);
          writeRememberedAccount(snap);
          setRememberedAccount(snap);
        }

        if (readGuestMode()) {
          setIsAuthenticated(false);
          skipNextSave.current = true;
          return;
        }

        setIsAuthenticated(true);
      } finally {
        setIsAuthLoading(false);
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

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
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

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_USER_PROFILE);
    setIsAuthenticated(false);
    setHasActiveBusiness(false);
    skipNextSave.current = true;
  }, []);

  const continueSession = useCallback(async () => {
    setGuestMode(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      clearRememberedAccount();
      setRememberedAccount(null);
      flashToast("La sesión expiró. Iniciá sesión de nuevo.");
      if (typeof window !== "undefined") window.location.href = "/login";
      return;
    }
    setIsAuthenticated(true);
    flashToast("Sesión reanudada.");
  }, []);

  const logout = useCallback(async () => {
    const current = profileRef.current;
    const soft = readRememberPreference() && current.id !== "guest" && !!current.email;

    if (soft) {
      const snap = snapshotAccount(current);
      writeRememberedAccount(snap);
      setRememberedAccount(snap);
      setGuestMode(true);
      setIsAuthenticated(false);
      skipNextSave.current = true;
      flashToast("Sesión pausada.");
      if (typeof window !== "undefined") window.location.href = "/";
      return;
    }

    flashToast("Sesión cerrada.");
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      clearRememberedAccount();
      setRememberedAccount(null);
      setProfile(DEFAULT_USER_PROFILE);
      setIsAuthenticated(false);
      setHasActiveBusiness(false);
      setPlatformRole(null);
      skipNextSave.current = true;
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isAuthenticated,
      isAuthLoading,
      hasActiveBusiness,
      platformRole,
      rememberedAccount,
      updateProfile,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      resetProfile,
      logout,
      continueSession,
      persistProfile,
    }),
    [
      profile,
      isAuthenticated,
      isAuthLoading,
      hasActiveBusiness,
      platformRole,
      rememberedAccount,
      updateProfile,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      resetProfile,
      logout,
      continueSession,
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
