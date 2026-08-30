import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#faf6f1] dark:bg-[#141210] px-5 py-12 text-center select-none overflow-hidden relative">
      {/* Background ambient decorative glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-[#9a0002]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Character Illustration */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Radar background rings */}
          <div className="absolute w-44 h-44 rounded-full border-2 border-dashed border-[#9a0002]/20 animate-spin" style={{ animationDuration: "25s" }} />
          <div className="absolute w-36 h-36 rounded-full bg-[#9a0002]/5 animate-pulse" />

          {/* Faceless Cartoon Character Vector */}
          <div className="relative w-36 h-36 flex items-center justify-center drop-shadow-xl">
            <svg
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* Background badge disc */}
              <circle cx="80" cy="80" r="70" fill="url(#bg-gradient)" />

              {/* Character Body / Hoodie */}
              <path
                d="M40 148 C40 115 52 104 80 104 C108 104 120 115 120 148 Z"
                fill="#9a0002"
              />
              {/* Hoodie collar / zip detail */}
              <path
                d="M74 104 L80 120 L86 104 Z"
                fill="#6b0001"
              />
              <circle cx="80" cy="128" r="2.5" fill="#f5f1eb" />
              <circle cx="80" cy="136" r="2.5" fill="#f5f1eb" />

              {/* Character Neck */}
              <rect x="73" y="86" width="14" height="20" rx="7" fill="#f5c29e" />

              {/* Character Faceless Head */}
              <ellipse cx="80" cy="68" rx="24" ry="27" fill="#fcd3b6" />

              {/* Cute minimal blush */}
              <ellipse cx="64" cy="74" rx="4" ry="2.5" fill="#fca5a5" opacity="0.6" />
              <ellipse cx="96" cy="74" rx="4" ry="2.5" fill="#fca5a5" opacity="0.6" />

              {/* Character Stylized Hair / Cap (Burgundy / Brand) */}
              <path
                d="M56 64 C56 46 66 40 80 40 C94 40 104 46 104 64 C104 54 96 46 80 46 C64 46 56 54 56 64 Z"
                fill="#2c2826"
              />
              <path
                d="M53 60 C55 45 66 38 80 38 C94 38 105 45 107 60 C103 44 94 42 80 42 C66 42 57 44 53 60 Z"
                fill="#1f1c1a"
              />

              {/* Magnifying Glass / Radar in hand */}
              <g transform="translate(94, 76)">
                <circle cx="16" cy="16" r="14" fill="#ffffff" stroke="#9a0002" strokeWidth="3" />
                <circle cx="16" cy="16" r="10" fill="#9a0002" opacity="0.15" />
                <path d="M26 26 L34 34" stroke="#9a0002" strokeWidth="4" strokeLinecap="round" />
                <text x="16" y="20" textAnchor="middle" fontSize="10" fontWeight="900" fill="#9a0002" fontFamily="system-ui, sans-serif">?</text>
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient id="bg-gradient" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f5ebe1" />
                  <stop offset="1" stopColor="#e8d8c8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating 404 pill badge */}
          <div className="absolute -top-1 -right-2 flex items-center gap-1 rounded-full bg-[#9a0002] px-2.5 py-1 text-[11px] font-black tracking-wider text-white shadow-lg shadow-[#9a0002]/30 border border-white/20 animate-bounce" style={{ animationDuration: "2.5s" }}>
            <span>404</span>
          </div>
        </div>

        {/* Text Details */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9a0002]/10 dark:bg-[#9a0002]/20 px-3.5 py-1 text-xs font-bold text-[#9a0002] dark:text-red-400 mb-2.5">
          <MaterialSymbol icon="explore_off" size={15} />
          Página no encontrada
        </span>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          ¡Ups! Te perdiste en el mapa
        </h1>

        <p className="mt-2.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400 max-w-xs sm:max-w-sm">
          No pudimos encontrar la ruta que estás buscando. La dirección puede haber cambiado o ya no existir en BolívarPide.
        </p>

        {/* Action Button */}
        <div className="mt-8 w-full max-w-xs">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#9a0002] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#9a0002]/25 hover:bg-[#7f0002] active:scale-[0.98] transition-all cursor-pointer"
          >
            <MaterialSymbol icon="home" size={19} />
            <span>Ir al inicio</span>
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-stone-400 dark:text-stone-600">
        BolívarPide · Delivery & Retiro
      </div>
    </div>
  );
}
