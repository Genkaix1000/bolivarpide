"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UserAvatar, getColorPalette } from "@/lib/userProfile";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface UserAvatarViewProps {
  avatar: UserAvatar;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showBorder?: boolean;
  /** Full-bleed disc matching h-10 action buttons (navbar profile). */
  variant?: "default" | "button";
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
  variant = "default",
}: UserAvatarViewProps) {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const palette = getColorPalette(avatar.gradientId);

  const isButton = variant === "button";
  const buttonBox =
    size === "sm"
      ? "h-8 w-8"
      : size === "md"
        ? "h-10 w-10"
        : config.container;
  const glyphSize = isButton
    ? size === "sm"
      ? 15
      : size === "md"
        ? 18
        : config.symbolSize
    : config.symbolSize;
  const emojiCls = isButton
    ? size === "sm"
      ? "text-[13px]"
      : "text-[18px]"
    : config.emojiText;
  const initialsCls = isButton
    ? size === "sm"
      ? "text-[11px]"
      : "text-[13px]"
    : config.initialsText;

  const content =
    avatar.type === "symbol" ? (
      <MaterialSymbol
        icon={avatar.value}
        size={glyphSize}
        opticalSize={20}
        className="text-white"
        fill
      />
    ) : avatar.type === "emoji" ? (
      <span className={cn("select-none leading-none", emojiCls)}>{avatar.value}</span>
    ) : (
      <span className={cn("select-none font-black tracking-tight text-white", initialsCls)}>
        {avatar.value || "?"}
      </span>
    );

  if (isButton) {
    return (
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          buttonBox,
          className,
        )}
        style={{ backgroundColor: palette.color }}
      >
        {content}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-shrink-0 select-none items-center justify-center overflow-visible",
        config.container,
        className,
      )}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-visible">
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-sm"
          style={{ overflow: "visible" }}
        >
          <circle cx="80" cy="88" r="54" fill={palette.color} />
        </svg>
        <div
          className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 select-none items-center justify-center leading-none text-white"
          style={{ top: "55%" }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
