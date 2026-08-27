"use client";

import React, { useId } from "react";
import { getColorPalette } from "@/lib/userProfile";

interface CharacterSVGProps {
  className?: string;
  gradientId?: string;
}

/**
 * 1. CharSushiBoy (Reference 1)
 * Convex round shoulder dome, perfect bottom circle, puffy afro hair popping out top.
 */
export function CharSushiBoy({ className = "w-full h-full", gradientId = "mustard" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `sushi-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "mustard" ? "#F7A828" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped inside bottom circle with convex shoulder dome */}
      <g clipPath={`url(#${clipId})`}>
        {/* Convex dome shirt */}
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#FDF5EC" />
        <path d="M64 80C74 88 86 88 96 80" stroke="#E2D4C1" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 110L38 136M114 110L122 136" stroke="#E2D4C1" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 120L34 94L46 102L34 130Z" fill="#7B4B3D" />
      </g>

      {/* LAYER 2: Pop-Out Puffy Dark Hair (Breaks top of circle at y=8..34) */}
      <path
        d="M66 22C62 14 70 8 78 8C86 8 90 14 92 18C96 14 104 15 108 22C113 26 114 34 110 39C115 44 117 53 113 60C110 65 105 67 101 68C101 74 97 80 91 82C84 84 78 80 75 76C69 78 62 75 58 70C54 66 54 60 56 56C50 55 45 49 47 43C48 38 52 34 57 33C54 28 58 22 66 22Z"
        fill="#2D263D"
      />

      {/* Neck */}
      <path d="M74 70V94L86 98V76L74 70Z" fill="#583428" />

      {/* Head & Face */}
      <path
        d="M60 44C60 34 70 28 82 30C94 32 100 42 102 54C104 66 98 76 86 80C74 84 62 78 58 68C55 63 54 56 54 50C54 46 58 44 60 44Z"
        fill="#7B4B3D"
      />
      {/* Ear */}
      <ellipse cx="100" cy="58" rx="6" ry="7" transform="rotate(10 100 58)" fill="#7B4B3D" />
      <path d="M99 56C101 57 101 60 99 61" stroke="#583428" strokeWidth="1.5" strokeLinecap="round" />

      {/* Happy Closed Eyes (^ ^) */}
      <path d="M62 47C65 44 70 44 73 47" stroke="#1A1523" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M78 50C81 47 86 47 89 50" stroke="#1A1523" strokeWidth="3.2" strokeLinecap="round" />
      {/* Eyebrows */}
      <path d="M63 40C66 38 71 39 73 41" stroke="#2D263D" strokeWidth="3" strokeLinecap="round" />
      <path d="M80 43C83 41 87 42 90 44" stroke="#2D263D" strokeWidth="3" strokeLinecap="round" />

      {/* Nose */}
      <path d="M57 51C59 54 62 54 63 52" stroke="#583428" strokeWidth="2.2" strokeLinecap="round" />

      {/* Wide Joyful Mouth */}
      <path
        d="M55 57C55 57 66 58 74 61C71 70 61 71 55 66V57Z"
        fill="#1C1816"
      />
      <path d="M56 58H71C70 62 65 63 59 62L56 58Z" fill="#FFFFFF" />
      <path d="M58 64C60 62 65 63 67 65C64 68 60 67 58 64Z" fill="#E85D75" />

      {/* Upper Arm and Hand holding Sushi Roll */}
      <path d="M26 100C26 86 33 72 45 65L55 78C46 84 40 96 38 108L26 100Z" fill="#7B4B3D" />
      <path d="M43 65C40 61 45 56 51 58L56 70C50 72 46 69 43 65Z" fill="#7B4B3D" />

      {/* Salmon Uramaki Sushi Roll */}
      <g transform="translate(42, 49)">
        <path
          d="M2 12C-2 5 5 -2 12 0L20 6C25 10 24 18 18 21L11 20C5 19 2 16 2 12Z"
          fill="#F45B42"
        />
        <ellipse cx="12" cy="11" rx="6.5" ry="7" fill="#FFFFFF" />
        <circle cx="12" cy="11" r="3.2" fill="#52B788" />
        <circle cx="11" cy="10" r="1.6" fill="#FFEAA7" />
        <circle cx="5" cy="5" r="0.8" fill="#FFFFFF" />
        <circle cx="10" cy="3" r="0.8" fill="#FFFFFF" />
        <circle cx="16" cy="5" r="0.8" fill="#FFFFFF" />
        <circle cx="18" cy="10" r="0.8" fill="#FFFFFF" />
        <circle cx="7" cy="9" r="0.8" fill="#FFFFFF" />
        <circle cx="14" cy="15" r="0.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * 2. CharBurritoGuy (Reference 2 / media_1787790590464.png)
 * Convex round shoulder dome, perfect bottom circle, spiky hair popping out top.
 */
export function CharBurritoGuy({ className = "w-full h-full", gradientId = "navy" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `burrito-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "navy" ? "#352F5B" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped strictly inside the circle with smooth convex shoulder dome */}
      <g clipPath={`url(#${clipId})`}>
        {/* Sage Green Shirt with gentle convex curved dome */}
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#5EAA8C" />
        <path d="M124 92L134 118" stroke="#2F5445" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 110L42 94L54 104L42 126Z" fill="#FA877F" />
        <path d="M110 100L126 124L138 116L122 92Z" fill="#FA877F" />
      </g>

      {/* LAYER 2: Head, Spiky Hair, Burrito & Thumbs Up on top */}
      <path
        d="M58 48C56 38 60 26 70 20C73 14 78 8 83 8C88 8 92 14 96 18C103 16 109 22 110 30C111 38 107 48 105 56L58 48Z"
        fill="#5A3930"
      />
      <path d="M72 20L78 10L84 18L92 10L96 22" fill="#5A3930" />

      {/* Neck */}
      <path d="M74 68V88H86V68H74Z" fill="#FA877F" />

      {/* Face */}
      <path
        d="M62 42C62 30 70 26 80 26C90 26 98 30 98 42C98 56 94 68 80 68C66 68 62 56 62 42Z"
        fill="#FA877F"
      />
      {/* Ears */}
      <circle cx="62" cy="46" r="4.5" fill="#FA877F" />
      <circle cx="98" cy="46" r="4.5" fill="#FA877F" />

      {/* Dot Eyes */}
      <circle cx="71" cy="42" r="2.8" fill="#1C1816" />
      <circle cx="89" cy="42" r="2.8" fill="#1C1816" />
      {/* Eyebrows */}
      <path d="M68 36C70 35 73 35 75 36" stroke="#5A3930" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M85 36C87 35 90 35 92 36" stroke="#5A3930" strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose */}
      <rect x="77" y="47" width="6" height="3" rx="1.5" fill="#E26A62" />

      {/* Big White Smile */}
      <path
        d="M72 52C72 52 75 58 80 58C85 58 88 52 88 52H72Z"
        fill="#FFFFFF"
      />

      {/* Left Hand Holding Burrito */}
      <path d="M42 98C36 86 42 74 54 70L62 82C56 86 52 94 50 106L42 98Z" fill="#FA877F" />
      <path d="M40 102C46 112 70 110 78 102C78 96 74 92 68 92L46 94L40 102Z" fill="#FA877F" />

      {/* Wrap / Burrito */}
      <g transform="translate(56, 72)">
        <path d="M2 18C0 8 6 2 16 0C26 0 30 8 30 18L28 32C28 34 6 34 4 32L2 18Z" fill="#FAF0DE" stroke="#E8DCBE" strokeWidth="1.5" />
        <path d="M4 14C6 8 12 4 18 4C24 4 28 8 28 14C24 16 18 16 14 18C8 20 6 18 4 14Z" fill="#4B8638" />
        <circle cx="10" cy="12" r="4.5" fill="#F5C542" />
        <path d="M16 8C20 6 25 8 26 13C22 14 18 12 16 8Z" fill="#E64A38" />
        <circle cx="21" cy="9" r="0.8" fill="#FFFFFF" />
        <circle cx="23" cy="11" r="0.8" fill="#FFFFFF" />
      </g>

      {/* Right Hand: Thumbs Up 👍 */}
      <g transform="translate(98, 76)">
        <path
          d="M18 26C18 36 28 44 38 48L44 38C38 32 36 24 36 12L24 16C20 20 18 22 18 26Z"
          fill="#FA877F"
        />
        <path
          d="M20 12C20 6 24 0 28 0C32 0 34 4 33 10L32 16H20V12Z"
          fill="#FA877F"
        />
        <path d="M12 16C12 14 16 12 24 14L32 16C32 26 24 30 16 28C12 26 12 20 12 16Z" fill="#FA877F" />
      </g>
    </svg>
  );
}

/**
 * 3. CharBowlGirl (Reference 3)
 * Convex round shoulder dome, perfect bottom circle, white bow headband popping out top.
 */
export function CharBowlGirl({ className = "w-full h-full", gradientId = "navy" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `bowl-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "navy" ? "#352F5B" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped inside bottom circle with convex shoulder dome */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#6E8947" />
        <path d="M52 96C52 126 62 140 80 140C98 140 108 126 108 96Z" fill="#F5A623" stroke="#D48B14" strokeWidth="1.5" />
      </g>

      {/* LAYER 2: Head, Bow Headband, Food & Fork on top */}
      <path
        d="M48 52C42 32 54 12 80 12C106 12 118 32 112 52C118 68 120 90 114 104H46C40 90 42 68 48 52Z"
        fill="#684F4A"
      />
      <path
        d="M52 46C56 26 66 18 80 18C94 18 104 26 108 46"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M74 16C72 12 76 8 80 10C84 8 88 12 86 16C84 18 76 18 74 16Z" fill="#FFFFFF" />

      {/* Neck */}
      <path d="M74 68V88H86V68H74Z" fill="#FA837A" />

      {/* Face */}
      <path
        d="M56 46C56 34 66 30 80 30C94 30 104 34 104 46C104 60 96 70 80 70C64 70 56 60 56 46Z"
        fill="#FA837A"
      />
      <path d="M56 44C66 32 76 34 80 36C84 34 94 32 104 44C94 36 86 36 80 38C74 36 66 36 56 44Z" fill="#583F3A" />

      {/* Happy Closed Curved Eyes (^ ^) */}
      <path d="M66 48C68 45 73 45 75 48" stroke="#2B1A17" strokeWidth="3" strokeLinecap="round" />
      <path d="M85 48C87 45 92 45 94 48" stroke="#2B1A17" strokeWidth="3" strokeLinecap="round" />
      {/* Eyebrows */}
      <path d="M66 41C68 40 72 40 74 41" stroke="#583F3A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M86 41C88 40 92 40 94 41" stroke="#583F3A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose */}
      <rect x="77" y="50" width="6" height="2.5" rx="1.2" fill="#E26A62" />

      {/* Wide White Smile */}
      <path
        d="M70 55C70 55 74 62 80 62C86 62 90 55 90 55H70Z"
        fill="#FFFFFF"
      />

      {/* Right Hand with White Fork */}
      <g transform="translate(34, 66)">
        <path d="M0 24C4 18 10 16 16 18L18 26C12 28 6 32 4 40L0 24Z" fill="#FA837A" />
        <path d="M12 4L34 10" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 10L42 7M34 10L44 11M34 10L42 15" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Left Hand & Food Contents in Bowl */}
      <g transform="translate(48, 74)">
        <ellipse cx="32" cy="22" rx="28" ry="6" fill="#352F5B" />
        <path d="M6 18C12 12 18 14 20 22H6V18Z" fill="#E64A38" />
        <circle cx="11" cy="17" r="0.8" fill="#FFFFFF" />
        <circle cx="15" cy="18" r="0.8" fill="#FFFFFF" />
        <path d="M18 16C24 10 30 12 32 20H18V16Z" fill="#E64A38" />

        <rect x="34" y="8" width="5" height="18" rx="2" transform="rotate(10 34 8)" fill="#F5C542" />
        <rect x="42" y="6" width="5" height="20" rx="2" transform="rotate(-5 42 6)" fill="#F5C542" />
        <rect x="48" y="10" width="5" height="18" rx="2" transform="rotate(15 48 10)" fill="#F5C542" />

        <circle cx="26" cy="24" r="8" fill="#67392B" />
        <circle cx="24" cy="22" r="1" fill="#4A251A" />
        <circle cx="28" cy="25" r="1" fill="#4A251A" />
        <circle cx="38" cy="26" r="7.5" fill="#67392B" />
        <circle cx="48" cy="28" r="7" fill="#67392B" />

        <path d="M38 34C44 32 54 36 58 44C54 48 44 46 38 42L38 34Z" fill="#FA837A" />
      </g>
    </svg>
  );
}

/**
 * 4. CharCatSushi
 * Convex round shoulder dome, perfect bottom circle, ears popping out top.
 */
export function CharCatSushi({ className = "w-full h-full", gradientId = "mint" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `cat-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "mint" ? "#34D399" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped inside bottom circle with convex dome */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 76 120 76 150 98V160H10Z" fill="#FB923C" />
        <ellipse cx="80" cy="116" rx="28" ry="24" fill="#FFFBEB" />
        <circle cx="80" cy="100" r="18" fill="#9A0002" />
        <circle cx="80" cy="100" r="5" fill="#FBBF24" />
        <circle cx="80" cy="100" r="1.5" fill="#78350F" />
      </g>

      {/* LAYER 2: Pop-Out Cat Ears, Head & Sushi Roll on top */}
      <path d="M44 48L52 14L74 34L44 48Z" fill="#F97316" />
      <path d="M50 44L56 20L68 34L50 44Z" fill="#FED7AA" />

      <path d="M116 48L108 14L86 34L116 48Z" fill="#F97316" />
      <path d="M110 44L104 20L92 34L110 44Z" fill="#FED7AA" />

      {/* Cat Head & Cheeks */}
      <ellipse cx="80" cy="62" rx="42" ry="34" fill="#FB923C" />
      <ellipse cx="80" cy="70" rx="30" ry="22" fill="#FFFBEB" />

      {/* Tabby Forehead Stripes */}
      <path d="M78 30V40M72 32L74 42M88 32L86 42" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />

      {/* Closed Happy Eyes (^ ^) */}
      <path d="M58 54C62 50 68 50 72 54" stroke="#431407" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M88 54C92 50 98 50 102 54" stroke="#431407" strokeWidth="3.5" strokeLinecap="round" />

      {/* Pink Cute Nose */}
      <path d="M77 62L83 62L80 66L77 62Z" fill="#F43F5E" />

      {/* Open Mouth with Tiny White Tooth & Tongue */}
      <path d="M74 67C74 67 78 76 80 76C82 76 86 67 86 67H74Z" fill="#1C1816" />
      <path d="M75 67L77 71L79 67H75Z" fill="#FFFFFF" />
      <circle cx="80" cy="72" r="2.5" fill="#FB7185" />

      {/* Cute Whiskers */}
      <path d="M44 64H28M46 72H30" stroke="#7C2D12" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M116 64H132M114 72H130" stroke="#7C2D12" strokeWidth="2.2" strokeLinecap="round" />

      {/* Chubby Paws holding Salmon Sushi Roll */}
      <g transform="translate(60, 68)">
        <ellipse cx="4" cy="18" rx="8" ry="7" fill="#FFFBEB" stroke="#FED7AA" strokeWidth="1.5" />
        <ellipse cx="36" cy="18" rx="8" ry="7" fill="#FFFBEB" stroke="#FED7AA" strokeWidth="1.5" />

        <g transform="translate(6, 2)">
          <path
            d="M2 14C-2 6 6 -2 14 0L20 4C26 8 26 18 18 22L12 21C5 20 2 18 2 14Z"
            fill="#F45B42"
          />
          <ellipse cx="14" cy="12" rx="7" ry="7.5" fill="#FFFFFF" />
          <circle cx="14" cy="12" r="3.5" fill="#52B788" />
          <circle cx="12" cy="11" r="1.8" fill="#FFEAA7" />
          <circle cx="6" cy="5" r="0.9" fill="#FFFFFF" />
          <circle cx="12" cy="3" r="0.9" fill="#FFFFFF" />
          <circle cx="18" cy="6" r="0.9" fill="#FFFFFF" />
          <circle cx="20" cy="11" r="0.9" fill="#FFFFFF" />
          <circle cx="8" cy="10" r="0.9" fill="#FFFFFF" />
          <circle cx="16" cy="17" r="0.9" fill="#FFFFFF" />
        </g>
      </g>
    </svg>
  );
}

/**
 * 5. CharPizzaSlice
 * Convex round shoulder dome, perfect bottom circle, flowing blonde hair popping out top.
 */
export function CharPizzaSlice({ className = "w-full h-full", gradientId = "cherry" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `pizza-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "cherry" ? "#9A0002" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped inside bottom circle with convex dome */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#FAF5EE" />
        <path d="M54 94C68 106 92 106 106 94" stroke="#E2D4C1" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* LAYER 2: Pop-out Hair, Face & Pizza */}
      <path
        d="M50 24C65 10 88 12 98 24C108 34 110 48 106 64C102 76 96 88 94 100H65C62 88 56 80 50 68C44 56 40 40 42 30C44 24 46 22 50 24Z"
        fill="#E5A952"
      />

      <path d="M72 70V90H84V74L72 70Z" fill="#DEB193" />

      <path
        d="M60 44C60 34 70 30 80 32C90 34 96 42 98 52C100 62 94 72 84 75C74 78 64 74 60 66C58 60 58 52 60 44Z"
        fill="#F6D1B8"
      />
      <path d="M64 48C67 46 71 46 73 48" stroke="#3D271D" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 50C81 48 85 48 87 50" stroke="#3D271D" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 42C67 40 71 41 73 43" stroke="#8C5320" strokeWidth="2.5" strokeLinecap="round" />

      <path d="M56 58C56 58 66 59 70 62C68 68 62 69 56 65V58Z" fill="#2E1B15" />
      <path d="M57 59H68C66 62 62 63 58 62L57 59Z" fill="#FFFFFF" />

      <path d="M26 100C26 88 34 76 44 70L52 82C44 87 38 98 36 112L26 100Z" fill="#F6D1B8" />

      <g transform="translate(38, 54)">
        <path d="M0 24C-2 18 2 12 8 8L20 4L22 10L14 18L4 26L0 24Z" fill="#C97B32" />
        <polygon points="6,10 24,6 18,22" fill="#FBBF24" />
        <circle cx="12" cy="14" r="3.2" fill="#DC2626" />
        <circle cx="17" cy="10" r="2.8" fill="#B91C1C" />
        <path d="M18 12C22 10 24 8 26 6" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * 6. CharBurgerDouble
 * Convex round shoulder dome, perfect bottom circle, fade haircut popping out top.
 */
export function CharBurgerDouble({ className = "w-full h-full", gradientId = "coral" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `burger-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "coral" ? "#FB923C" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped inside bottom circle with convex dome */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#262626" />
      </g>

      {/* LAYER 2: Pop-out Hair, Head & Burger */}
      <path
        d="M52 24C52 14 66 10 80 12C94 14 102 22 102 36H52V24Z"
        fill="#1C1816"
      />

      <path d="M72 70V90H84V74L72 70Z" fill="#B8825F" />

      <path
        d="M60 42C60 32 68 28 78 30C88 32 96 40 96 52C96 64 90 74 82 76C72 78 62 74 60 64V42Z"
        fill="#C9946F"
      />
      <path
        d="M60 52C60 68 68 78 80 78C90 78 96 68 96 52C96 60 90 70 78 70C66 70 60 60 60 52Z"
        fill="#1C1816"
      />
      <path d="M64 45C66 43 70 43 72 45" stroke="#1C1816" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 46C80 44 84 44 86 46" stroke="#1C1816" strokeWidth="3" strokeLinecap="round" />

      <path d="M56 54C56 54 66 55 70 58C68 64 62 65 56 62V54Z" fill="#1C1816" />
      <path d="M57 55H68C66 58 62 59 58 58L57 55Z" fill="#FFFFFF" />

      <path d="M28 96C28 84 36 74 46 68L52 78C46 82 40 92 38 104L28 96Z" fill="#C9946F" />

      <g transform="translate(38, 50)">
        <path d="M0 6C0 -2 14 -4 24 2C28 4 28 8 26 10H0V6Z" fill="#E09F3E" />
        <circle cx="8" cy="2" r="0.7" fill="#FFFBEB" />
        <circle cx="14" cy="1" r="0.7" fill="#FFFBEB" />
        <path d="M-2 10C4 8 10 12 16 9C22 12 26 9 28 10L26 12H-2V10Z" fill="#4ADE80" />
        <rect x="0" y="12" width="26" height="4" rx="2" fill="#582F0E" />
        <path d="M2 13L24 13L20 16L12 17L6 15L2 13Z" fill="#FACC15" />
        <rect x="1" y="16" width="24" height="4" rx="2" fill="#E09F3E" />
      </g>
    </svg>
  );
}

/**
 * 7. CharRamenBowl
 * Convex round shoulder dome, perfect bottom circle, topknot hair popping out top.
 */
export function CharRamenBowl({ className = "w-full h-full", gradientId = "mint" }: CharacterSVGProps) {
  const rawId = useId();
  const clipId = `ramen-clip-${rawId.replace(/:/g, "_")}`;
  const palette = getColorPalette(gradientId);
  const discColor = gradientId === "mint" ? "#34D399" : palette.color;

  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="80" cy="88" r="54" />
        </clipPath>
      </defs>

      {/* Background Disc */}
      <circle cx="80" cy="88" r="54" fill={discColor} />

      {/* LAYER 1: Clipped inside bottom circle with convex dome */}
      <g clipPath={`url(#${clipId})`}>
        <path d="M10 98C40 74 120 74 150 98V160H10Z" fill="#0F766E" />
        <path d="M54 90C54 120 64 138 80 138C96 138 106 120 106 90Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
      </g>

      {/* LAYER 2: Pop-out Bun Hair, Head, Steam & Chopsticks */}
      <path
        d="M56 46C52 30 62 14 80 14C98 14 108 30 104 46C104 60 102 78 100 88H60C58 78 56 60 56 46Z"
        fill="#262626"
      />
      <circle cx="80" cy="12" r="10" fill="#262626" />

      <path d="M74 68V88H86V68H74Z" fill="#FDE0C8" />

      <path
        d="M60 46C60 34 70 30 80 30C90 30 100 34 100 46C100 60 92 70 80 70C68 70 60 60 60 46Z"
        fill="#FDE0C8"
      />
      <path d="M66 48C68 45 73 45 75 48" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
      <path d="M85 48C87 45 92 45 94 48" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="80" cy="58" rx="4" ry="5" fill="#1F2937" />

      <g transform="translate(50, 68)">
        <path d="M26 -6C24 -2 28 2 26 6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
        <path d="M34 -8C32 -4 36 0 34 4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />

        <ellipse cx="30" cy="22" rx="26" ry="6" fill="#D97706" />
        <path d="M12 20C16 18 24 24 32 20C40 16 46 22 50 20" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="20" cy="21" rx="5" ry="3.5" fill="#FFFFFF" />
        <circle cx="20" cy="21" r="2" fill="#F59E0B" />
        <rect x="36" y="16" width="10" height="7" rx="1" fill="#14532D" transform="rotate(-15 36 16)" />

        <path d="M18 10L48 2" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 14L48 4" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M30 4C30 -4 30 -6 30 -8" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
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
    case "char-cat-sushi":
    case "char-mascot-cat":
    case "char-mascot-foodie":
      return <CharCatSushi className={className} gradientId={gradientId} />;
    case "char-burrito-guy":
    case "char-taco-crunch":
    case "char-brunette-bob":
      return <CharBurritoGuy className={className} gradientId={gradientId} />;
    case "char-sushi-boy":
    case "char-sushi-lover":
    case "char-blonde-waves":
      return <CharSushiBoy className={className} gradientId={gradientId} />;
    case "char-bowl-girl":
    case "char-curly-red":
    case "char-icecream-smile":
      return <CharBowlGirl className={className} gradientId={gradientId} />;
    case "char-pizza-slice":
    case "char-pizza-biter":
      return <CharPizzaSlice className={className} gradientId={gradientId} />;
    case "char-burger-double":
    case "char-burger-feast":
    case "char-fade-beard":
      return <CharBurgerDouble className={className} gradientId={gradientId} />;
    case "char-ramen-bowl":
    case "char-coffee-sip":
    case "char-chef-master":
      return <CharRamenBowl className={className} gradientId={gradientId} />;
    default:
      return <CharBurritoGuy className={className} gradientId={gradientId} />;
  }
}
