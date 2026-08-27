"use client";

import React, { useId } from "react";
import { getColorPalette } from "@/lib/userProfile";

interface CharacterSVGProps {
  className?: string;
  gradientId?: string;
}

/**
 * 1. CharCatMichi (Michi comiendo sushi)
 * Pop-out cat ears, paws holding an authentic salmon uramaki roll with sesame and nori.
 */
export function CharCatMichi({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `cat-sushi-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Dynamic Background Disc */}
      <circle cx="80" cy="88" r="54" fill={palette.color} />

      {/* LAYER 1: Torso clipped inside bottom circle */}
      <g clipPath={`url(#${clipId})`}>
        {/* Cat Chest & Body with smooth convex shoulder contour */}
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#F49342" />
        <path d="M54 102C66 90 94 90 106 102C108 126 102 152 80 160C58 152 52 126 54 102Z" fill="#FFFDF8" />

        {/* Collar & Golden Bell */}
        <path d="M48 92C64 102 96 102 112 92L114 98C96 108 64 108 46 98L48 92Z" fill="#DC2626" />
        <circle cx="80" cy="103" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
        <circle cx="80" cy="103.5" r="1.2" fill="#78350F" />
      </g>

      {/* LAYER 2: Pop-out Cat Head, Ears, Whiskers, Paws & Sushi Roll */}
      {/* Left Ear */}
      <path d="M44 48L32 18C44 22 56 32 60 44L44 48Z" fill="#F49342" />
      <path d="M42 44L36 24C44 27 52 34 54 42L42 44Z" fill="#FCA5A5" />

      {/* Right Ear */}
      <path d="M116 48L128 18C116 22 104 32 100 44L116 48Z" fill="#F49342" />
      <path d="M118 44L124 24C116 27 108 34 106 42L118 44Z" fill="#FCA5A5" />

      {/* Cat Head Base */}
      <ellipse cx="80" cy="56" rx="38" ry="32" fill="#F49342" />

      {/* White Cheeks / Muzzle */}
      <ellipse cx="70" cy="66" rx="14" ry="11" fill="#FFFDF8" />
      <ellipse cx="90" cy="66" rx="14" ry="11" fill="#FFFDF8" />

      {/* Forehead Stripes */}
      <path d="M76 32L80 42L84 32" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 36L73 43" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      <path d="M92 36L87 43" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

      {/* Joyful Closed Eyes (^ ^) */}
      <path d="M60 52C64 48 70 48 74 52" stroke="#1C1816" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M86 52C90 48 96 48 100 52" stroke="#1C1816" strokeWidth="3.2" strokeLinecap="round" />

      {/* Pink Nose */}
      <polygon points="80,62 84,58 76,58" fill="#F43F5E" />

      {/* Cute Mouth */}
      <path d="M73 66C77 69 80 67 80 64C80 67 83 69 87 66" stroke="#1C1816" strokeWidth="2" strokeLinecap="round" />

      {/* Whiskers */}
      <path d="M52 60L34 56M50 65L32 66M52 70L36 76" stroke="#1C1816" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <path d="M108 60L126 56M110 65L128 66M108 70L124 76" stroke="#1C1816" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* Pink Cheeks */}
      <circle cx="54" cy="60" r="5" fill="#FDA4AF" opacity="0.6" />
      <circle cx="106" cy="60" r="5" fill="#FDA4AF" opacity="0.6" />

      {/* Salmon Uramaki Sushi Roll & Little Paws */}
      <g transform="translate(62, 66)">
        {/* Sushi Roll Base */}
        <ellipse cx="18" cy="18" rx="17" ry="14" fill="#FFFFFF" stroke="#E2D4C1" strokeWidth="1.2" />
        <ellipse cx="18" cy="18" rx="12" ry="9" fill="#1C2826" />
        {/* Salmon Core */}
        <ellipse cx="18" cy="18" rx="8" ry="6" fill="#F45B42" />
        <circle cx="15" cy="17" r="2" fill="#FFEAA7" />
        <circle cx="21" cy="18" r="2.2" fill="#52B788" />

        {/* Sesame seeds */}
        <circle cx="6" cy="12" r="0.8" fill="#3D271D" />
        <circle cx="9" cy="8" r="0.8" fill="#3D271D" />
        <circle cx="26" cy="10" r="0.8" fill="#3D271D" />
        <circle cx="29" cy="15" r="0.8" fill="#3D271D" />
        <circle cx="12" cy="28" r="0.8" fill="#3D271D" />
        <circle cx="23" cy="27" r="0.8" fill="#3D271D" />

        {/* Left White Paw */}
        <ellipse cx="1" cy="18" rx="5" ry="6" fill="#FFFDF8" stroke="#F49342" strokeWidth="1.5" />
        {/* Right White Paw */}
        <ellipse cx="35" cy="18" rx="5" ry="6" fill="#FFFDF8" stroke="#F49342" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/**
 * 2. CharLucas (Lucas comiendo hamburguesa)
 * Pop-out dark puffy curly hair, cheerful expression, holding and taking a bite of a double burger.
 */
export function CharLucas({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `lucas-burger-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Dynamic Background Disc */}
      <circle cx="80" cy="88" r="54" fill={palette.color} />

      {/* LAYER 1: Lower body clipped inside bottom circle */}
      <g clipPath={`url(#${clipId})`}>
        {/* Shirt with smooth convex shoulder dome */}
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#2E4057" />
        <path d="M64 84C74 92 86 92 96 84" stroke="#1D2A3A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arms reaching up to hold burger */}
        <path d="M22 108L44 88L54 98L32 124Z" fill="#7B4B3D" />
        <path d="M138 108L116 88L106 98L128 124Z" fill="#7B4B3D" />
      </g>

      {/* LAYER 2: Pop-out Curly Hair, Face, Hands & Burger */}
      {/* Voluminous Dark Puffy Curly Hair popping out top */}
      <path
        d="M66 20C62 12 70 6 78 6C86 6 90 12 92 16C96 12 104 13 108 20C113 24 114 32 110 37C115 42 117 51 113 58C110 63 105 65 101 66C101 72 97 78 91 80C84 82 78 78 75 74C69 76 62 73 58 68C54 64 54 58 56 54C50 53 45 47 47 41C48 36 52 32 57 31C54 26 58 20 66 20Z"
        fill="#2D263D"
      />

      {/* Neck */}
      <path d="M74 68V90L86 94V74L74 68Z" fill="#583428" />

      {/* Head & Face */}
      <path
        d="M60 40C60 30 70 24 82 26C94 28 100 38 102 50C104 62 98 72 86 76C74 80 62 74 58 64C55 59 54 52 54 46C54 42 58 40 60 40Z"
        fill="#7B4B3D"
      />
      {/* Ears */}
      <ellipse cx="100" cy="54" rx="5.5" ry="6.5" transform="rotate(10 100 54)" fill="#7B4B3D" />
      <ellipse cx="57" cy="54" rx="5.5" ry="6.5" transform="rotate(-10 57 54)" fill="#7B4B3D" />

      {/* Happy Closed Eyes (^ ^) */}
      <path d="M63 44C66 41 71 41 74 44" stroke="#1A1523" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M79 47C82 44 87 44 90 47" stroke="#1A1523" strokeWidth="3.2" strokeLinecap="round" />

      {/* Eyebrows */}
      <path d="M64 37C67 35 72 36 74 38" stroke="#2D263D" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M81 40C84 38 88 39 91 41" stroke="#2D263D" strokeWidth="2.8" strokeLinecap="round" />

      {/* Nose */}
      <path d="M58 48C60 51 63 51 64 49" stroke="#583428" strokeWidth="2.2" strokeLinecap="round" />

      {/* Open Mouth Ready for Burger */}
      <path d="M56 54C56 54 67 55 75 58C72 67 62 68 56 63V54Z" fill="#1C1816" />
      <path d="M57 55H72C71 59 66 60 60 59L57 55Z" fill="#FFFFFF" />
      <path d="M59 61C61 59 66 60 68 62C65 65 61 64 59 61Z" fill="#E85D75" />

      {/* Delicious Burger & Hands Holding It */}
      <g transform="translate(46, 68)">
        {/* Top Sesame Bun */}
        <path d="M6 14C6 4 22 0 34 0C46 0 62 4 62 14H6Z" fill="#E59849" />
        {/* Sesame seeds on top bun */}
        <ellipse cx="20" cy="6" rx="1.5" ry="0.8" fill="#FFFDF8" transform="rotate(-15 20 6)" />
        <ellipse cx="32" cy="4" rx="1.5" ry="0.8" fill="#FFFDF8" />
        <ellipse cx="44" cy="6" rx="1.5" ry="0.8" fill="#FFFDF8" transform="rotate(15 44 6)" />
        <ellipse cx="26" cy="9" rx="1.5" ry="0.8" fill="#FFFDF8" transform="rotate(10 26 9)" />
        <ellipse cx="38" cy="9" rx="1.5" ry="0.8" fill="#FFFDF8" transform="rotate(-10 38 9)" />

        {/* Wavy Green Lettuce */}
        <path d="M4 14C8 16 12 14 16 16C20 14 24 16 28 14C32 16 36 14 40 16C44 14 48 16 52 14C56 16 60 14 64 15L62 18H6L4 14Z" fill="#48BB78" />

        {/* Melted Cheese Slice */}
        <polygon points="8,17 60,17 56,22 46,20 34,25 22,20 12,23" fill="#FBBF24" />

        {/* Juicy Patty */}
        <rect x="6" y="20" width="56" height="7" rx="3.5" fill="#5A3825" />

        {/* Red Tomato Slice */}
        <rect x="10" y="27" width="48" height="4" rx="2" fill="#E53E3E" />

        {/* Bottom Bun */}
        <rect x="8" y="30" width="52" height="7" rx="3" fill="#E59849" />

        {/* Left Thumb / Hand */}
        <ellipse cx="6" cy="22" rx="5" ry="7" fill="#7B4B3D" stroke="#583428" strokeWidth="1" />

        {/* Right Thumb / Hand */}
        <ellipse cx="62" cy="22" rx="5" ry="7" fill="#7B4B3D" stroke="#583428" strokeWidth="1" />
      </g>
    </svg>
  );
}

export function CharacterRenderer({
  characterId,
  className = "w-full h-full",
  gradientId,
}: {
  characterId: string;
  className?: string;
  gradientId?: string;
}) {
  switch (characterId) {
    case "char-cat-michi":
    case "char-cat-sushi":
    case "char-mascot-cat":
      return <CharCatMichi className={className} gradientId={gradientId} />;
    case "char-lucas":
    case "char-sushi-boy":
    case "char-burger-double":
      return <CharLucas className={className} gradientId={gradientId} />;
    default:
      return <CharCatMichi className={className} gradientId={gradientId} />;
  }
}
