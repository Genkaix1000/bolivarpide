import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { createClient } from "@/lib/supabase/server";
import { resolvePlatformRole } from "@/lib/admin/platform";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Acceso no autorizado (403) · BolívarPide",
  description: "Área restringida para administradores de BolívarPide.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const nextTarget = sp.next ?? "/admin";

  // Verificamos sesión en servidor para evitar render innecesario
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await resolvePlatformRole(user);
    if (role) {
      redirect(nextTarget);
    }
  }

  const isForbiddenError = sp.error === "forbidden";
  const isAuthError = sp.error === "auth";

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
          <div
            className="absolute w-44 h-44 rounded-full border-2 border-dashed border-[#9a0002]/20 animate-spin"
            style={{ animationDuration: "25s" }}
          />
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
              <circle cx="80" cy="80" r="70" fill="url(#bg-gradient-admin)" />

              {/* Character Body / Hoodie */}
              <path
                d="M40 148 C40 115 52 104 80 104 C108 104 120 115 120 148 Z"
                fill="#9a0002"
              />
              {/* Hoodie collar / zip detail */}
              <path d="M74 104 L80 120 L86 104 Z" fill="#6b0001" />
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

              {/* Shield & Security Lock in hand */}
              <g transform="translate(90, 72)">
                <path
                  d="M18 4 C25 4 31 7.5 31 7.5 C31 18.5 24.5 26 18 29.5 C11.5 26 5 18.5 5 7.5 C5 7.5 11 4 18 4 Z"
                  fill="#ffffff"
                  stroke="#9a0002"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 6.5 C23.5 6.5 28.5 9.5 28.5 9.5 C28.5 18 23 24.5 18 27.5 C13 24.5 7.5 18 7.5 9.5 C7.5 9.5 12.5 6.5 18 6.5 Z"
                  fill="#9a0002"
                  opacity="0.12"
                />
                <path
                  d="M15 15.5 V13.5 C15 11.8 16.3 10.5 18 10.5 C19.7 10.5 21 11.8 21 13.5 V15.5"
                  stroke="#9a0002"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <rect x="13" y="15.5" width="10" height="7.5" rx="2" fill="#9a0002" />
                <circle cx="18" cy="18.5" r="1.2" fill="#ffffff" />
                <path d="M18 19 L18 21.2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient
                  id="bg-gradient-admin"
                  x1="20"
                  y1="20"
                  x2="140"
                  y2="140"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#f5ebe1" />
                  <stop offset="1" stopColor="#e8d8c8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating 403 pill badge */}
          <div
            className="absolute -top-1 -right-2 flex items-center gap-1 rounded-full bg-[#9a0002] px-2.5 py-1 text-[11px] font-black tracking-wider text-white shadow-lg shadow-[#9a0002]/30 border border-white/20 animate-bounce"
            style={{ animationDuration: "2.5s" }}
          >
            <MaterialSymbol icon="lock" size={13} className="text-white" />
            <span>403</span>
          </div>
        </div>

        {/* Status Chip Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9a0002]/10 dark:bg-[#9a0002]/20 px-3.5 py-1 text-xs font-bold text-[#9a0002] dark:text-red-400 mb-2.5">
          <MaterialSymbol icon="shield_lock" size={15} />
          Acceso no autorizado
        </span>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Área restringida
        </h1>

        {/* Subtitle / Description */}
        <p className="mt-2.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400 max-w-xs sm:max-w-sm">
          Esta sección está reservada exclusivamente para el equipo de administración de BolívarPide.
          No tenés permisos para acceder a este panel.
        </p>

        {/* Current user session alert (if authenticated as regular user) */}
        {user ? (
          <div className="mt-4 w-full max-w-xs rounded-2xl border border-stone-200/80 bg-white/70 dark:border-stone-800 dark:bg-stone-900/60 p-3 text-center shadow-sm backdrop-blur">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
              Sesión iniciada como:
            </p>
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate mt-0.5">
              {user.email}
            </p>
            <span className="inline-block mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              (Sin rol de administrador)
            </span>
          </div>
        ) : null}

        {/* Error notification banner */}
        {isForbiddenError && !user ? (
          <div className="mt-4 w-full max-w-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
            Tu cuenta no tiene privilegios de plataforma.
          </div>
        ) : isAuthError ? (
          <div className="mt-4 w-full max-w-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
            No se pudo completar el inicio de sesión. Probá nuevamente.
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-7 w-full max-w-xs flex flex-col gap-2.5">
          {user ? (
            <>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#9a0002] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#9a0002]/25 hover:bg-[#7f0002] active:scale-[0.98] transition-all cursor-pointer"
              >
                <MaterialSymbol icon="home" size={19} />
                <span>Ir al inicio</span>
              </Link>
              
              <form action={signOut} className="w-full text-center mt-2">
                <input type="hidden" name="next" value="/admin/login" />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <MaterialSymbol icon="logout" size={15} />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Button to go to client login */}
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#9a0002] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#9a0002]/25 hover:bg-[#7f0002] active:scale-[0.98] transition-all cursor-pointer"
              >
                <MaterialSymbol icon="login" size={19} />
                <span>Ir al login</span>
              </Link>

              {/* Direct link back home */}
              <Link
                href="/"
                className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                <MaterialSymbol icon="arrow_back" size={15} />
                <span>Volver al inicio</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-stone-400 dark:text-stone-600">
        BolívarPide · Panel de Control Seguro
      </div>
    </div>
  );
}

