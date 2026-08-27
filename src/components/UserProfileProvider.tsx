"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  UserProfile,
  UserAvatar,
  UserAwardBadge,
  DEFAULT_USER_PROFILE,
} from "@/lib/userProfile";

interface UserProfileContextValue {
  profile: UserProfile;
  updateAvatar: (avatar: UserAvatar) => void;
  updateName: (name: string) => void;
  awardBadge: (badge: UserAwardBadge) => void;
  removeBadge: (badgeId: string) => void;
  unlockFrame: (frameId: string) => void;
  resetProfile: () => void;
}

const STORAGE_KEY = "bp_user_profile_v2";

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

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
          awardedBadges: parsed.awardedBadges || DEFAULT_USER_PROFILE.awardedBadges,
          unlockedFrameIds: parsed.unlockedFrameIds || DEFAULT_USER_PROFILE.unlockedFrameIds,
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

  // Save to localStorage on profile change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  const updateAvatar = useCallback((avatar: UserAvatar) => {
    setProfile((prev) => ({
      ...prev,
      avatar,
    }));
  }, []);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => ({
      ...prev,
      name,
    }));
  }, []);

  const awardBadge = useCallback((badge: UserAwardBadge) => {
    setProfile((prev) => {
      const exists = prev.awardedBadges.some((b) => b.id === badge.id);
      if (exists) return prev;
      return {
        ...prev,
        awardedBadges: [badge, ...prev.awardedBadges],
      };
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
      return {
        ...prev,
        unlockedFrameIds: [...prev.unlockedFrameIds, frameId],
      };
    });
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_USER_PROFILE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      profile,
      updateAvatar,
      updateName,
      awardBadge,
      removeBadge,
      unlockFrame,
      resetProfile,
    }),
    [profile, updateAvatar, updateName, awardBadge, removeBadge, unlockFrame, resetProfile]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
