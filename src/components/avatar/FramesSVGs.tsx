"use client";

import React from "react";

/**
 * 1. FrameGoldLegend (Aura Dorada - Premio por Fidelidad y Tiempo)
 * Minimalist LoL-inspired gold crest frame with sleek side wings and bottom diamond pedestal.
 */
export function FrameGoldLegend({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="frame-gold-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="30%" stopColor="#F5A623" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="frame-gold-bright" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="frame-gem-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>

      {/* Outer Glow Halo */}
      <circle cx="80" cy="88" r="59" stroke="#F59E0B" strokeWidth="1.5" opacity="0.35" />

      {/* Main Dual Gold Ring */}
      <circle cx="80" cy="88" r="57" stroke="url(#frame-gold-main)" strokeWidth="4.5" />
      <circle cx="80" cy="88" r="53" stroke="url(#frame-gold-bright)" strokeWidth="1.2" opacity="0.9" />

      {/* Left Wing Accent */}
      <g transform="translate(14, 52)">
        <path
          d="M12 28C6 20 6 8 16 0C14 10 16 18 20 24C16 26 14 27 12 28Z"
          fill="url(#frame-gold-main)"
        />
        <path
          d="M10 38C4 30 6 18 14 12C12 20 14 28 18 34L10 38Z"
          fill="url(#frame-gold-main)"
          opacity="0.8"
        />
      </g>

      {/* Right Wing Accent */}
      <g transform="translate(118, 52)">
        <path
          d="M16 28C22 20 22 8 12 0C14 10 12 18 8 24C12 26 14 27 16 28Z"
          fill="url(#frame-gold-main)"
        />
        <path
          d="M18 38C24 30 22 18 14 12C16 20 14 28 10 34L18 38Z"
          fill="url(#frame-gold-main)"
          opacity="0.8"
        />
      </g>

      {/* Top Apex Crown Pip */}
      <g transform="translate(74, 24)">
        <polygon points="6,0 12,5 6,10 0,5" fill="url(#frame-gem-cyan)" stroke="#FFFFFF" strokeWidth="0.8" />
        <circle cx="6" cy="5" r="1" fill="#FFFFFF" />
      </g>

      {/* Bottom Crest & Pedestal with Center Crystal */}
      <g transform="translate(56, 134)">
        {/* Golden Bracket */}
        <path
          d="M0 4C8 14 18 18 24 20C30 18 40 14 48 4C42 10 32 14 24 14C16 14 6 10 0 4Z"
          fill="url(#frame-gold-main)"
        />
        {/* Center Golden Shield */}
        <polygon points="24,2 32,8 24,18 16,8" fill="url(#frame-gold-bright)" stroke="#78350F" strokeWidth="1" />
        {/* Cyan Diamond Gem */}
        <polygon points="24,4 30,8 24,15 18,8" fill="url(#frame-gem-cyan)" />
        <circle cx="24" cy="8" r="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * 2. FrameRubyRoyale (Aura Carmesí - Premio por Gran Comprador / Gourmet VIP)
 * Regal cherry & ruby crest with gold filigree claws and glowing ruby heart gem.
 */
export function FrameRubyRoyale({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="ruby-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="40%" stopColor="#9A0002" />
          <stop offset="80%" stopColor="#5E0001" />
          <stop offset="100%" stopColor="#2E0001" />
        </linearGradient>
        <linearGradient id="ruby-gem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA3A3" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>
        <linearGradient id="gold-trim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>

      {/* Ruby Aura Outer Ring */}
      <circle cx="80" cy="88" r="59" stroke="#9A0002" strokeWidth="1.5" opacity="0.4" />
      <circle cx="80" cy="88" r="57" stroke="url(#ruby-ring)" strokeWidth="4.5" />
      <circle cx="80" cy="88" r="53" stroke="url(#gold-trim)" strokeWidth="1.2" opacity="0.85" />

      {/* Left Gold Claw */}
      <g transform="translate(16, 76)">
        <path d="M6 0C0 6 0 16 6 22L8 18C4 14 4 8 8 4L6 0Z" fill="url(#gold-trim)" />
        <circle cx="6" cy="11" r="2.5" fill="url(#ruby-gem)" />
      </g>

      {/* Right Gold Claw */}
      <g transform="translate(130, 76)">
        <path d="M8 0C14 6 14 16 8 22L6 18C10 14 10 8 6 4L8 0Z" fill="url(#gold-trim)" />
        <circle cx="8" cy="11" r="2.5" fill="url(#ruby-gem)" />
      </g>

      {/* Top Ruby Crest */}
      <g transform="translate(72, 22)">
        <path d="M8 0L16 6L8 12L0 6L8 0Z" fill="url(#ruby-gem)" stroke="#FFE4E6" strokeWidth="0.8" />
        <circle cx="8" cy="6" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Bottom Royal Filigree & Faceted Ruby Gemstone */}
      <g transform="translate(58, 134)">
        <path
          d="M0 6C10 16 20 18 22 18C24 18 34 16 44 6C38 12 30 14 22 14C14 14 6 12 0 6Z"
          fill="url(#gold-trim)"
        />
        <polygon points="22,0 32,8 22,20 12,8" fill="url(#ruby-gem)" stroke="#FDE68A" strokeWidth="1.2" />
        <polygon points="22,3 29,8 22,17 15,8" fill="#EF4444" opacity="0.6" />
        <circle cx="22" cy="8" r="2" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * 3. FrameSapphireExplorer (Aura Zafiro - Premio por Explorador / Navegación)
 * Celestial navy & electric cyan wings with glowing explorer star gem.
 */
export function FrameSapphireExplorer({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="sapphire-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="40%" stopColor="#6366F1" />
          <stop offset="80%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="silver-trim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      {/* Cyber/Sapphire Outer Halo */}
      <circle cx="80" cy="88" r="59" stroke="#06B6D4" strokeWidth="1.5" opacity="0.4" />
      <circle cx="80" cy="88" r="57" stroke="url(#sapphire-ring)" strokeWidth="4.5" />
      <circle cx="80" cy="88" r="53" stroke="url(#cyan-glow)" strokeWidth="1.2" opacity="0.9" />

      {/* Left Explorer Fin */}
      <g transform="translate(14, 60)">
        <path d="M12 0L2 14L10 18L18 8L12 0Z" fill="url(#sapphire-ring)" />
        <path d="M12 0L6 10L10 12L16 6L12 0Z" fill="url(#cyan-glow)" />
      </g>

      {/* Right Explorer Fin */}
      <g transform="translate(126, 60)">
        <path d="M8 0L18 14L10 18L2 8L8 0Z" fill="url(#sapphire-ring)" />
        <path d="M8 0L14 10L10 12L4 6L8 0Z" fill="url(#cyan-glow)" />
      </g>

      {/* Top North Star Compass */}
      <g transform="translate(74, 20)">
        <polygon points="6,0 8,5 13,6 8,7 6,12 4,7 -1,6 4,5" fill="#FFFFFF" />
        <circle cx="6" cy="6" r="1.5" fill="#38BDF8" />
      </g>

      {/* Bottom Explorer Crest */}
      <g transform="translate(56, 134)">
        <path
          d="M2 6L14 16L24 18L34 16L46 6L38 12L24 14L10 12L2 6Z"
          fill="url(#silver-trim)"
        />
        <polygon points="24,2 32,8 24,18 16,8" fill="url(#sapphire-ring)" stroke="#38BDF8" strokeWidth="1.2" />
        <polygon points="24,5 29,8 24,15 19,8" fill="url(#cyan-glow)" />
        <circle cx="24" cy="8" r="1.5" fill="#FFFFFF" />
      </g>
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
    case "frame-gold-legend":
    case "frame-gold-vip":
    case "frame-flame-gourmet":
      return <FrameGoldLegend className={className} />;
    case "frame-ruby-royale":
    case "frame-ruby-cherry":
      return <FrameRubyRoyale className={className} />;
    case "frame-sapphire-explorer":
    case "frame-cyber-neon":
    case "frame-emerald-leaf":
      return <FrameSapphireExplorer className={className} />;
    default:
      return null;
  }
}
