"use client";

import React, { useId } from "react";
import { getColorPalette } from "@/lib/userProfile";

interface CharacterSVGProps {
  className?: string;
  gradientId?: string;
}

/**
 * 1. CharCatMichi (Michi el Gatito)
 * Pure mascot character: Ginger tabby cat with ears popping out top, white chest, red collar with gold bell.
 */
export function CharCatMichi({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `cat-clip-${rawId.replace(/:/g, "_")}`;
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
        {/* Cat Chest & Body */}
        <path d="M20 102C40 82 120 82 140 102V160H20Z" fill="#F49342" />
        <path d="M56 102C68 92 92 92 104 102C106 122 100 150 80 160C60 150 54 122 56 102Z" fill="#FFFDF8" />

        {/* Collar & Golden Bell */}
        <path d="M48 94C64 104 96 104 112 94L114 100C96 110 64 110 46 100L48 94Z" fill="#DC2626" />
        <circle cx="80" cy="104" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
        <circle cx="80" cy="104.5" r="1.2" fill="#78350F" />
      </g>

      {/* LAYER 2: Pop-out Cat Head, Ears & Face */}
      {/* Left Ear */}
      <path d="M44 48L32 18C44 22 56 32 60 44L44 48Z" fill="#F49342" />
      <path d="M42 44L36 24C44 27 52 34 54 42L42 44Z" fill="#FCA5A5" />

      {/* Right Ear */}
      <path d="M116 48L128 18C116 22 104 32 100 44L116 48Z" fill="#F49342" />
      <path d="M118 44L124 24C116 27 108 34 106 42L118 44Z" fill="#FCA5A5" />

      {/* Cat Head Base */}
      <ellipse cx="80" cy="58" rx="38" ry="32" fill="#F49342" />

      {/* White Cheeks / Muzzle */}
      <ellipse cx="70" cy="68" rx="14" ry="11" fill="#FFFDF8" />
      <ellipse cx="90" cy="68" rx="14" ry="11" fill="#FFFDF8" />

      {/* Forehead Stripes */}
      <path d="M76 34L80 44L84 34" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 38L73 45" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      <path d="M92 38L87 45" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

      {/* Cute Anime Eyes */}
      <ellipse cx="64" cy="54" rx="4.5" ry="6" fill="#1C1816" />
      <ellipse cx="96" cy="54" rx="4.5" ry="6" fill="#1C1816" />
      <circle cx="62.5" cy="52" r="2" fill="#FFFFFF" />
      <circle cx="94.5" cy="52" r="2" fill="#FFFFFF" />

      {/* Pink Nose */}
      <polygon points="80,64 84,60 76,60" fill="#F43F5E" />

      {/* Mouth (w) */}
      <path d="M72 68C76 71 80 69 80 66C80 69 84 71 88 68" stroke="#1C1816" strokeWidth="2" strokeLinecap="round" />

      {/* Cute Whiskers */}
      <path d="M52 62L34 58M50 67L32 68M52 72L36 78" stroke="#1C1816" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <path d="M108 62L126 58M110 67L128 68M108 72L124 78" stroke="#1C1816" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

      {/* Pink Cheeks */}
      <circle cx="54" cy="62" r="5" fill="#FDA4AF" opacity="0.6" />
      <circle cx="106" cy="62" r="5" fill="#FDA4AF" opacity="0.6" />
    </svg>
  );
}

/**
 * 2. CharLucas (Lucas - Puffy Curly Hair & Warm Smile)
 * Pure character with voluminous dark curly hair popping out top.
 */
export function CharLucas({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `lucas-clip-${rawId.replace(/:/g, "_")}`;
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
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#FDF5EC" />
        <path d="M64 86C74 94 86 94 96 86" stroke="#E2D4C1" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 74V98H88V74H72Z" fill="#583428" />
      </g>

      {/* LAYER 2: Pop-out Voluminous Dark Puffy Hair */}
      <path
        d="M66 20C62 12 70 6 78 6C86 6 90 12 92 16C96 12 104 13 108 20C113 24 114 32 110 37C115 42 117 51 113 58C110 63 105 65 101 66C101 72 97 78 91 80C84 82 78 78 75 74C69 76 62 73 58 68C54 64 54 58 56 54C50 53 45 47 47 41C48 36 52 32 57 31C54 26 58 20 66 20Z"
        fill="#2D263D"
      />

      {/* Head & Face */}
      <path
        d="M60 42C60 32 70 26 82 28C94 30 100 40 102 52C104 64 98 74 86 78C74 82 62 76 58 66C55 61 54 54 54 48C54 44 58 42 60 42Z"
        fill="#7B4B3D"
      />
      {/* Ears */}
      <ellipse cx="100" cy="56" rx="5.5" ry="6.5" transform="rotate(10 100 56)" fill="#7B4B3D" />
      <ellipse cx="57" cy="56" rx="5.5" ry="6.5" transform="rotate(-10 57 56)" fill="#7B4B3D" />

      {/* Happy Eyes */}
      <path d="M63 46C66 43 71 43 74 46" stroke="#1A1523" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M79 49C82 46 87 46 90 49" stroke="#1A1523" strokeWidth="3.2" strokeLinecap="round" />

      {/* Eyebrows */}
      <path d="M64 39C67 37 72 38 74 40" stroke="#2D263D" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M81 42C84 40 88 41 91 43" stroke="#2D263D" strokeWidth="2.8" strokeLinecap="round" />

      {/* Nose */}
      <path d="M58 50C60 53 63 53 64 51" stroke="#583428" strokeWidth="2.2" strokeLinecap="round" />

      {/* Joyful Smile */}
      <path d="M56 56C56 56 67 57 75 60C72 69 62 70 56 65V56Z" fill="#1C1816" />
      <path d="M57 57H72C71 61 66 62 60 61L57 57Z" fill="#FFFFFF" />
      <path d="M59 63C61 61 66 62 68 64C65 67 61 66 59 63Z" fill="#E85D75" />
    </svg>
  );
}

/**
 * 3. CharSofia (Sofía - Brunette Bob Haircut & Headband)
 * Pure character with smooth brunette bob and white bow headband popping out top.
 */
export function CharSofia({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `sofia-clip-${rawId.replace(/:/g, "_")}`;
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

      {/* LAYER 1: Clipped inside bottom circle */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#3F4E4F" />
        <path d="M64 86C74 94 86 94 96 86" stroke="#2C3639" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 74V98H88V74H72Z" fill="#B4846C" />
      </g>

      {/* LAYER 2: Pop-out Hair, Headband & Face */}
      {/* Bob Hair Backing */}
      <path
        d="M44 38C44 20 60 14 80 14C100 14 116 20 116 38C118 56 114 74 106 82C96 86 64 86 54 82C46 74 42 56 44 38Z"
        fill="#3D251E"
      />

      {/* White Bow Headband Popping Out Top */}
      <g transform="translate(68, 6)">
        <ellipse cx="6" cy="10" rx="7" ry="5" transform="rotate(-20 6 10)" fill="#FFFFFF" />
        <ellipse cx="18" cy="10" rx="7" ry="5" transform="rotate(20 18 10)" fill="#FFFFFF" />
        <circle cx="12" cy="10" r="3.5" fill="#F5F5F5" />
      </g>

      {/* Face & Ears */}
      <ellipse cx="80" cy="56" rx="26" ry="26" fill="#DDB892" />
      <ellipse cx="54" cy="56" rx="4.5" ry="6" fill="#DDB892" />
      <ellipse cx="106" cy="56" rx="4.5" ry="6" fill="#DDB892" />

      {/* Bangs / Fringe */}
      <path d="M54 44C64 36 96 36 106 44C102 48 94 48 80 46C66 48 58 48 54 44Z" fill="#3D251E" />

      {/* Cute Expressive Eyes */}
      <ellipse cx="68" cy="54" rx="4" ry="5" fill="#1C1816" />
      <ellipse cx="92" cy="54" rx="4" ry="5" fill="#1C1816" />
      <circle cx="66.5" cy="52.5" r="1.5" fill="#FFFFFF" />
      <circle cx="90.5" cy="52.5" r="1.5" fill="#FFFFFF" />

      {/* Eyebrows */}
      <path d="M64 46C67 44 71 44 74 46" stroke="#3D251E" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M86 46C89 44 93 44 96 46" stroke="#3D251E" strokeWidth="2.2" strokeLinecap="round" />

      {/* Nose */}
      <circle cx="80" cy="59" r="1.8" fill="#B4846C" />

      {/* Sweet Smile */}
      <path d="M72 65C76 69 84 69 88 65" stroke="#1C1816" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M74 65C77 68 83 68 86 65" fill="#E85D75" />

      {/* Rosy Cheeks */}
      <circle cx="60" cy="61" r="4.5" fill="#F472B6" opacity="0.45" />
      <circle cx="100" cy="61" r="4.5" fill="#F472B6" opacity="0.45" />
    </svg>
  );
}

/**
 * 4. CharMateo (Mateo - Cool Streetwear Cap & Hoodie)
 * Pure character with backward red streetwear cap popping out top.
 */
export function CharMateo({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `mateo-clip-${rawId.replace(/:/g, "_")}`;
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

      {/* LAYER 1: Clipped lower body with hoodie */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#1E293B" />
        <path d="M60 84C70 94 90 94 100 84" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <path d="M72 74V98H88V74H72Z" fill="#DEB193" />
      </g>

      {/* LAYER 2: Pop-out Cap, Hair & Face */}
      {/* Backward Streetwear Cap */}
      <path
        d="M48 38C48 20 62 14 80 14C98 14 112 20 112 38H48Z"
        fill="#9A0002"
      />
      {/* Cap Visor (turned back) */}
      <path d="M42 36C44 32 50 30 56 32L48 40L42 36Z" fill="#750001" />
      <ellipse cx="80" cy="15" rx="3" ry="2" fill="#FFFFFF" opacity="0.8" />

      {/* Hair Peaks */}
      <path d="M48 40C46 48 50 54 54 56C52 48 50 42 48 40Z" fill="#18181B" />
      <path d="M112 40C114 48 110 54 106 56C108 48 110 42 112 40Z" fill="#18181B" />

      {/* Face & Ears */}
      <ellipse cx="80" cy="56" rx="26" ry="26" fill="#F6D1B8" />
      <ellipse cx="54" cy="58" rx="5" ry="6" fill="#F6D1B8" />
      <ellipse cx="106" cy="58" rx="5" ry="6" fill="#F6D1B8" />

      {/* Confident Eyes */}
      <ellipse cx="68" cy="54" rx="4.2" ry="5.2" fill="#18181B" />
      <ellipse cx="92" cy="54" rx="4.2" ry="5.2" fill="#18181B" />
      <circle cx="66.5" cy="52" r="1.6" fill="#FFFFFF" />
      <circle cx="90.5" cy="52" r="1.6" fill="#FFFFFF" />

      {/* Eyebrows */}
      <path d="M63 45C66 43 71 44 74 46" stroke="#18181B" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M86 46C89 44 94 43 97 45" stroke="#18181B" strokeWidth="2.8" strokeLinecap="round" />

      {/* Nose */}
      <path d="M78 57C79 59 81 59 82 57" stroke="#DEB193" strokeWidth="2.2" strokeLinecap="round" />

      {/* Smirk Smile */}
      <path d="M72 66C76 69 85 68 89 64" stroke="#18181B" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 5. CharValen (Valentina - High Top Bun & Hoop Earring)
 * Pure character with high top hair bun popping out top.
 */
export function CharValen({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `valen-clip-${rawId.replace(/:/g, "_")}`;
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
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#F43F5E" />
        <path d="M64 86C74 94 86 94 96 86" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 74V98H88V74H72Z" fill="#A77044" />
      </g>

      {/* LAYER 2: Pop-out High Hair Bun, Earrings & Face */}
      {/* High Top Bun Popping Out Top */}
      <circle cx="80" cy="18" r="16" fill="#2E1C14" />
      <circle cx="80" cy="22" r="6" fill="#F43F5E" />

      {/* Hair Shape */}
      <path
        d="M46 44C46 26 60 22 80 22C100 22 114 26 114 44C116 60 114 74 106 80C96 84 64 84 54 80C46 74 44 60 46 44Z"
        fill="#2E1C14"
      />

      {/* Face & Ears */}
      <ellipse cx="80" cy="56" rx="25" ry="25" fill="#C68642" />
      <ellipse cx="55" cy="58" rx="4.5" ry="5.5" fill="#C68642" />
      <ellipse cx="105" cy="58" rx="4.5" ry="5.5" fill="#C68642" />

      {/* Golden Hoop Earrings */}
      <circle cx="53" cy="65" r="4.5" stroke="#FBBF24" strokeWidth="1.8" fill="none" />
      <circle cx="107" cy="65" r="4.5" stroke="#FBBF24" strokeWidth="1.8" fill="none" />

      {/* Eyes with Lashes */}
      <ellipse cx="68" cy="54" rx="4" ry="5" fill="#18181B" />
      <ellipse cx="92" cy="54" rx="4" ry="5" fill="#18181B" />
      <circle cx="66.5" cy="52.5" r="1.5" fill="#FFFFFF" />
      <circle cx="90.5" cy="52.5" r="1.5" fill="#FFFFFF" />
      <path d="M64 50L60 47M96 50L100 47" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />

      {/* Eyebrows */}
      <path d="M64 45C67 43 71 43 74 45" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M86 45C89 43 93 43 96 45" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" />

      {/* Nose */}
      <circle cx="80" cy="59" r="1.8" fill="#A77044" />

      {/* Radiant Smile */}
      <path d="M72 65C76 70 84 70 88 65" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M74 66C77 69 83 69 86 66" fill="#FDA4AF" />
    </svg>
  );
}

/**
 * 6. CharJoaquin (Joaquín - Stylish Round Glasses & Clean Fade)
 * Pure character with stylish round spectacles and side-fade hair.
 */
export function CharJoaquin({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `joaquin-clip-${rawId.replace(/:/g, "_")}`;
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
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#0D9488" />
        <path d="M64 86C74 94 86 94 96 86" stroke="#115E59" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 74V98H88V74H72Z" fill="#DEB193" />
      </g>

      {/* LAYER 2: Pop-out Fade Hair, Glasses & Face */}
      {/* Fade Hair Popping Out Top */}
      <path
        d="M52 24C52 14 66 10 80 12C94 14 104 22 104 36H52V24Z"
        fill="#1C1816"
      />

      {/* Face & Ears */}
      <ellipse cx="80" cy="56" rx="26" ry="26" fill="#F6D1B8" />
      <ellipse cx="54" cy="58" rx="5" ry="6" fill="#F6D1B8" />
      <ellipse cx="106" cy="58" rx="5" ry="6" fill="#F6D1B8" />

      {/* Stylish Modern Glasses */}
      <circle cx="68" cy="54" r="9" stroke="#18181B" strokeWidth="2.5" fill="none" />
      <circle cx="92" cy="54" r="9" stroke="#18181B" strokeWidth="2.5" fill="none" />
      <path d="M77 54H83" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M59 52L54 50M101 52L106 50" stroke="#18181B" strokeWidth="2.2" strokeLinecap="round" />

      {/* Eyes Behind Glasses */}
      <circle cx="68" cy="54" r="3.2" fill="#18181B" />
      <circle cx="92" cy="54" r="3.2" fill="#18181B" />
      <circle cx="67" cy="53" r="1.2" fill="#FFFFFF" />
      <circle cx="91" cy="53" r="1.2" fill="#FFFFFF" />

      {/* Eyebrows */}
      <path d="M63 41C66 39 71 40 74 42" stroke="#1C1816" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M86 42C89 40 94 39 97 41" stroke="#1C1816" strokeWidth="2.8" strokeLinecap="round" />

      {/* Nose */}
      <path d="M78 58C79 60 81 60 82 58" stroke="#DEB193" strokeWidth="2.2" strokeLinecap="round" />

      {/* Friendly Smile */}
      <path d="M72 66C76 70 84 70 88 66" stroke="#18181B" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 7. CharCamila (Camila - Wavy Blonde Hair & Warm Expression)
 * Pure character with flowing wavy hair popping out top.
 */
export function CharCamila({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `camila-clip-${rawId.replace(/:/g, "_")}`;
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

      {/* LAYER 1: Clipped inside bottom circle */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#F59E0B" />
        <path d="M64 86C74 94 86 94 96 86" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M72 74V98H88V74H72Z" fill="#DEB193" />
      </g>

      {/* LAYER 2: Pop-out Wavy Hair & Face */}
      <path
        d="M50 24C65 10 88 12 98 24C108 34 112 48 108 64C104 76 98 88 94 96H66C62 88 56 80 52 68C46 56 42 40 44 30C46 24 48 22 50 24Z"
        fill="#E5A952"
      />

      {/* Face & Ears */}
      <ellipse cx="80" cy="56" rx="25" ry="25" fill="#F6D1B8" />
      <ellipse cx="55" cy="58" rx="4.5" ry="5.5" fill="#F6D1B8" />
      <ellipse cx="105" cy="58" rx="4.5" ry="5.5" fill="#F6D1B8" />

      {/* Expressive Eyes */}
      <ellipse cx="68" cy="54" rx="4" ry="5.2" fill="#18181B" />
      <ellipse cx="92" cy="54" rx="4" ry="5.2" fill="#18181B" />
      <circle cx="66.5" cy="52.5" r="1.6" fill="#FFFFFF" />
      <circle cx="90.5" cy="52.5" r="1.6" fill="#FFFFFF" />

      {/* Eyebrows */}
      <path d="M64 45C67 43 71 43 74 45" stroke="#8C5320" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M86 45C89 43 93 43 96 45" stroke="#8C5320" strokeWidth="2.2" strokeLinecap="round" />

      {/* Nose */}
      <circle cx="80" cy="59" r="1.8" fill="#DEB193" />

      {/* Warm Smile */}
      <path d="M72 65C76 70 84 70 88 65" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M74 66C77 69 83 69 86 66" fill="#FDA4AF" />

      {/* Rosy Cheeks */}
      <circle cx="62" cy="62" r="4.5" fill="#FDA4AF" opacity="0.5" />
      <circle cx="98" cy="62" r="4.5" fill="#FDA4AF" opacity="0.5" />
    </svg>
  );
}

/**
 * 8. CharFirulais (Firulais el Perrito)
 * Pure mascot character: Adorable puppy with floppy brown ears popping out top and red collar.
 */
export function CharFirulais({ className = "w-full h-full", gradientId }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `dog-clip-${rawId.replace(/:/g, "_")}`;
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
        <path d="M20 102C40 82 120 82 140 102V160H20Z" fill="#C48B5E" />
        <path d="M56 102C68 92 92 92 104 102C106 122 100 150 80 160C60 150 54 122 56 102Z" fill="#FFFDF8" />

        {/* Collar & Golden Tag */}
        <path d="M48 94C64 104 96 104 112 94L114 100C96 110 64 110 46 100L48 94Z" fill="#2563EB" />
        <circle cx="80" cy="104" r="5.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
        <circle cx="80" cy="104.5" r="1.2" fill="#78350F" />
      </g>

      {/* LAYER 2: Pop-out Puppy Head & Floppy Ears */}
      {/* Left Floppy Ear */}
      <path d="M48 38C40 22 28 32 30 52C32 68 44 72 48 56L48 38Z" fill="#8C5320" />

      {/* Right Floppy Ear */}
      <path d="M112 38C120 22 132 32 130 52C128 68 116 72 112 56L112 38Z" fill="#8C5320" />

      {/* Puppy Head Base */}
      <ellipse cx="80" cy="56" rx="36" ry="30" fill="#C48B5E" />

      {/* White Snout */}
      <ellipse cx="80" cy="66" rx="18" ry="14" fill="#FFFDF8" />

      {/* Shiny Black Nose */}
      <ellipse cx="80" cy="62" rx="7" ry="5.5" fill="#1C1816" />
      <ellipse cx="78" cy="60.5" rx="2.5" ry="1.5" fill="#FFFFFF" />

      {/* Puppy Eyes */}
      <ellipse cx="64" cy="52" rx="4.5" ry="6" fill="#1C1816" />
      <ellipse cx="96" cy="52" rx="4.5" ry="6" fill="#1C1816" />
      <circle cx="62.5" cy="50" r="2" fill="#FFFFFF" />
      <circle cx="94.5" cy="50" r="2" fill="#FFFFFF" />

      {/* Cheerful Puppy Tongue / Smile */}
      <path d="M74 69C76 72 80 72 80 69C80 72 84 72 86 69" stroke="#1C1816" strokeWidth="2" strokeLinecap="round" />
      <path d="M77 71C77 75 83 75 83 71Z" fill="#F43F5E" />
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
      return <CharLucas className={className} gradientId={gradientId} />;
    case "char-sofia":
    case "char-bowl-girl":
    case "char-brunette-bob":
      return <CharSofia className={className} gradientId={gradientId} />;
    case "char-mateo":
    case "char-burrito-guy":
    case "char-taco-crunch":
      return <CharMateo className={className} gradientId={gradientId} />;
    case "char-valen":
    case "char-curly-red":
    case "char-icecream-smile":
      return <CharValen className={className} gradientId={gradientId} />;
    case "char-joaquin":
    case "char-burger-double":
    case "char-fade-beard":
      return <CharJoaquin className={className} gradientId={gradientId} />;
    case "char-camila":
    case "char-pizza-slice":
    case "char-blonde-waves":
      return <CharCamila className={className} gradientId={gradientId} />;
    case "char-firulais":
    case "char-ramen-bowl":
      return <CharFirulais className={className} gradientId={gradientId} />;
    default:
      return <CharCatMichi className={className} gradientId={gradientId} />;
  }
}
