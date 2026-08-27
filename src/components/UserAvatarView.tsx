"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar, AVATAR_FRAMES } from "@/lib/userProfile";
import { CharacterRenderer, ClassicIconRenderer } from "@/components/avatar/CharacterSVGs";
import { FrameOverlayRenderer } from "@/components/avatar/FramesSVGs";

interface UserAvatarViewProps {
  avatar: UserAvatar;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showBorder?: boolean;
  showFrame?: boolean;
}

const SIZE_CONFIGS = {
  sm: "w-8 h-8",
  md: "w-11 h-11",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
  "2xl": "w-32 h-32",
};

export function UserAvatarView({
  avatar,
  size = "md",
  className,
  showFrame = true,
}: UserAvatarViewProps) {
  const sizeClass = SIZE_CONFIGS[size];
  const activeFrame = AVATAR_FRAMES.find((f) => f.id === avatar.frameId);
  const hasSpecialFrame = showFrame && activeFrame && activeFrame.id !== "none";

  return (
    <div className={cn("relative flex items-center justify-center flex-shrink-0 select-none overflow-visible", sizeClass, className)}>
      {/* Layer 1: Frame Overlay behind the disc & character */}
      {hasSpecialFrame && (
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-visible">
          <FrameOverlayRenderer frameId={avatar.frameId} className="w-full h-full" />
        </div>
      )}

      {/* Layer 2: Main Avatar Artwork (Character or Classic Icon/Emoji/Initials) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-visible">
        {avatar.type === "character" ? (
          <CharacterRenderer
            characterId={avatar.value}
            gradientId={avatar.gradientId}
            className="w-full h-full drop-shadow-sm"
          />
        ) : (
          <ClassicIconRenderer
            avatar={{
              type: avatar.type,
              value: avatar.value,
              gradientId: avatar.gradientId,
            }}
            className="w-full h-full drop-shadow-sm"
          />
        )}
      </div>
    </div>
  );
}
