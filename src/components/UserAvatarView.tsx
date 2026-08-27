"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar, getColorPalette, AVATAR_FRAMES } from "@/lib/userProfile";
import { CharacterRenderer } from "@/components/avatar/CharacterSVGs";
import { FrameOverlayRenderer } from "@/components/avatar/FramesSVGs";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface UserAvatarViewProps {
  avatar: UserAvatar;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showBorder?: boolean;
  showFrame?: boolean;
}

const SIZE_CONFIGS = {
  sm: {
    container: "w-8 h-8",
    symbolSize: 16,
    emojiText: "text-[14px]",
    initialsText: "text-[10px]",
  },
  md: {
    container: "w-11 h-11",
    symbolSize: 22,
    emojiText: "text-[18px]",
    initialsText: "text-[12px]",
  },
  lg: {
    container: "w-16 h-16",
    symbolSize: 32,
    emojiText: "text-[26px]",
    initialsText: "text-[16px]",
  },
  xl: {
    container: "w-24 h-24",
    symbolSize: 48,
    emojiText: "text-[38px]",
    initialsText: "text-[24px]",
  },
  "2xl": {
    container: "w-32 h-32",
    symbolSize: 64,
    emojiText: "text-[52px]",
    initialsText: "text-[32px]",
  },
};

export function UserAvatarView({
  avatar,
  size = "md",
  className,
  showFrame = true,
}: UserAvatarViewProps) {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const palette = getColorPalette(avatar.gradientId);
  const activeFrame = AVATAR_FRAMES.find((f) => f.id === avatar.frameId);
  const hasSpecialFrame = showFrame && activeFrame && activeFrame.id !== "none";

  return (
    <div className={cn("relative flex items-center justify-center flex-shrink-0 select-none overflow-visible", config.container, className)}>
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
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {/* Background Disc SVG sharing the exact 160x160 coordinate space */}
            <svg
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-sm"
              style={{ overflow: "visible" }}
            >
              <circle cx="80" cy="88" r="54" fill={palette.color} />
            </svg>

            {/* Content centered exactly at cx=50%, cy=55% */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none text-white leading-none"
              style={{ top: "55%" }}
            >
              {avatar.type === "symbol" && (
                <MaterialSymbol
                  icon={avatar.value}
                  size={config.symbolSize}
                  className="text-white"
                  fill
                />
              )}
              {avatar.type === "emoji" && (
                <span className={cn("select-none leading-none", config.emojiText)}>
                  {avatar.value}
                </span>
              )}
              {avatar.type === "initials" && (
                <span className={cn("text-white font-black tracking-tight select-none font-sans", config.initialsText)}>
                  {avatar.value || "SA"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
