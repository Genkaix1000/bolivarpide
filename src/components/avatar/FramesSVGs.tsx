"use client";

import React from "react";

export function FrameGoldVipBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      {/* Outer Golden Laurel & Ring around cx=80, cy=88, r=58 */}
      <circle cx="80" cy="88" r="58" stroke="url(#gold-grad)" strokeWidth="4.5" strokeDasharray="8 4" />
      <circle cx="80" cy="88" r="62" stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" />
      {/* Golden Crown on Top of Frame (Behind popping hair) */}
      <g transform="translate(68, 14)">
        <polygon points="12,0 16,8 24,3 22,14 2,14 0,3 8,8" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" />
        <circle cx="12" cy="1" r="1.5" fill="#EF4444" />
      </g>
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FrameRubyCherryBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      {/* Ruby Radiant Ring around cx=80, cy=88, r=58 */}
      <circle cx="80" cy="88" r="58" stroke="url(#ruby-grad)" strokeWidth="5" />
      <circle cx="80" cy="88" r="62" stroke="#9A0002" strokeWidth="1.5" strokeDasharray="5 5" />
      {/* Ruby Jewel at Bottom */}
      <g transform="translate(73, 144)">
        <polygon points="7,0 14,7 7,14 0,7" fill="#9A0002" stroke="#FF4D4F" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="2" fill="#FFFFFF" />
      </g>
      <defs>
        <linearGradient id="ruby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D4F" />
          <stop offset="50%" stopColor="#9A0002" />
          <stop offset="100%" stopColor="#500001" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FrameCyberNeonBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <circle cx="80" cy="88" r="58" stroke="url(#cyber-grad)" strokeWidth="4.5" />
      <circle cx="80" cy="88" r="62" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="10 6" />
      <defs>
        <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FrameFlameGourmetBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <circle cx="80" cy="88" r="58" stroke="url(#flame-grad)" strokeWidth="4.5" />
      <defs>
        <linearGradient id="flame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FrameEmeraldLeafBadge({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <circle cx="80" cy="88" r="58" stroke="url(#emerald-grad)" strokeWidth="4.5" />
      <g transform="translate(14, 80)">
        <ellipse cx="6" cy="10" rx="7" ry="4" transform="rotate(-30 6 10)" fill="#10B981" />
        <ellipse cx="6" cy="20" rx="7" ry="4" transform="rotate(30 6 20)" fill="#059669" />
      </g>
      <g transform="translate(134, 80)">
        <ellipse cx="6" cy="10" rx="7" ry="4" transform="rotate(30 6 10)" fill="#10B981" />
        <ellipse cx="6" cy="20" rx="7" ry="4" transform="rotate(-30 6 20)" fill="#059669" />
      </g>
      <defs>
        <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FrameOverlayRenderer({
  frameId,
  className = "w-full h-full",
}: {
  frameId?: string;
  className?: string;
}) {
  if (!frameId || frameId === "none") return null;

  switch (frameId) {
    case "frame-gold-vip":
      return <FrameGoldVipBadge className={className} />;
    case "frame-ruby-cherry":
      return <FrameRubyCherryBadge className={className} />;
    case "frame-cyber-neon":
      return <FrameCyberNeonBadge className={className} />;
    case "frame-flame-gourmet":
      return <FrameFlameGourmetBadge className={className} />;
    case "frame-emerald-leaf":
      return <FrameEmeraldLeafBadge className={className} />;
    default:
      return null;
  }
}
