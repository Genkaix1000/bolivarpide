"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle } from "@/lib/auth/actions";
import { passwordIsValid, unmetPasswordRules } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

type Props = {
  next: string;
  error?: string;
  formSide?: "left" | "right";
  title: string;
  subtitle: string;
  panelTitle: string;
  panelBody: string;
  altHref: string;
  altLabel: string;
};

type Mode = "login" | "signup";

const REMEMBER_KEY = "bp_remember_session";

export function AuthSplitLogin({
  next,
  error: urlError,
  formSide = "left",
  title,
  subtitle,
  panelTitle,
  panelBody,
  altHref,
  altLabel,
}: Props) {
  const router = useRouter();
  const formFirst = formSide === "left";
  const isBusiness = !formFirst; // Business login has form on right side

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pendingRules = useMemo(() => unmetPasswordRules(password), [password]);
  const isSignUp = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    if (isSignUp) {
      if (!name.trim()) {
        setFormError("Ingresá tu nombre.");
        return;
      }
      if (!passwordIsValid(password)) {
        setFormError("La contraseña no cumple los requisitos.");
        setHintOpen(true);
        return;
      }
      if (password !== confirm) {
        setFormError("Las contraseñas no coinciden.");
        return;
      }
    }

    setPending(true);
    try {
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
      const supabase = createClient({ remember });

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFormError(error.message);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim(), name: name.trim() },
          },
        });
        if (error) {
          setFormError(error.message);
          return;
        }
        if (data.user && !data.session) {
          setInfo("Revisá tu email para confirmar la cuenta, después iniciá sesión.");
          setMode("login");
          setPassword("");
          setConfirm("");
          return;
        }
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setPending(false);
    }
  }

  // ─── FORM PANE ─────────────────────────────────────────────────────────────
  const formPane = (
    <section className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-sm font-black text-white shadow-sm group-hover:scale-105 transition-transform">
              B
            </span>
            <span className="text-[17px] font-bold tracking-tight text-stone-900 dark:text-stone-100">
              BolivarPide
            </span>
          </Link>

          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
              isBusiness
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                : "bg-[#9a0002]/10 text-[#9a0002] dark:text-red-300 border border-[#9a0002]/15"
            )}
          >
            {isBusiness ? "Panel Comercio" : "App Clientes"}
          </span>
        </div>

        {/* Dynamic Titles */}
        <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
          {mode === "login" ? title : "Creá tu cuenta"}
        </h1>
        <p className="mt-1.5 text-[13px] sm:text-[14px] text-stone-500 dark:text-stone-400">
          {mode === "login" ? subtitle : "Completá tus datos para empezar a pedir en Bolívar."}
        </p>

        {/* Mode Switcher Tab (Color morphs dynamically!) */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 dark:bg-[#25211e] p-1 border border-stone-200/70 dark:border-stone-800">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(null);
              setInfo(null);
            }}
            className={cn(
              "rounded-lg py-2 text-[13px] font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5",
              mode === "login"
                ? "bg-white dark:bg-[#1c1917] text-[#9a0002] dark:text-red-400 shadow-sm"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            )}
          >
            <MaterialSymbol icon="login" size={16} fill={mode === "login"} />
            <span>Iniciar sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setFormError(null);
              setInfo(null);
            }}
            className={cn(
              "rounded-lg py-2 text-[13px] font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5",
              mode === "signup"
                ? "bg-white dark:bg-[#1c1917] text-emerald-700 dark:text-emerald-400 shadow-sm"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
            )}
          >
            <MaterialSymbol icon="person_add" size={16} fill={mode === "signup"} />
            <span>Crear cuenta</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {(urlError === "auth" || urlError === "forbidden" || formError || info) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-4 rounded-xl px-3.5 py-2.5 text-[13px] font-medium flex items-center gap-2",
              info
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-500/20"
            )}
          >
            <MaterialSymbol icon={info ? "check_circle" : "error"} size={17} />
            <span>
              {info ||
                formError ||
                (urlError === "forbidden"
                  ? "No tenés permiso para esa sección."
                  : "No se pudo completar el inicio de sesión.")}
            </span>
          </motion.div>
        )}

        {/* Main Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
          {isSignUp && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="block"
            >
              <span className="mb-1 block text-[12px] font-semibold text-stone-700 dark:text-stone-300">
                Nombre completo
              </span>
              <div className="relative">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre y apellido"
                  className={cn(
                    "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1917] px-3.5 py-2.5 text-[14px] text-stone-900 dark:text-stone-100 outline-none transition",
                    isSignUp
                      ? "focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                      : "focus:border-[#9a0002] focus:ring-2 focus:ring-[#9a0002]/15"
                  )}
                />
              </div>
            </motion.label>
          )}

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-stone-700 dark:text-stone-300">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu@email.com"
              className={cn(
                "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1917] px-3.5 py-2.5 text-[14px] text-stone-900 dark:text-stone-100 outline-none transition",
                isSignUp
                  ? "focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  : "focus:border-[#9a0002] focus:ring-2 focus:ring-[#9a0002]/15"
              )}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-stone-700 dark:text-stone-300">
              Contraseña
            </span>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => isSignUp && setHintOpen(true)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1917] px-3.5 py-2.5 pr-11 text-[14px] text-stone-900 dark:text-stone-100 outline-none transition",
                  isSignUp
                    ? "focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    : "focus:border-[#9a0002] focus:ring-2 focus:ring-[#9a0002]/15"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 cursor-pointer"
              >
                <MaterialSymbol icon={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
            {isSignUp && hintOpen && (
              <div className="mt-2 space-y-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-2.5 text-[11px]">
                {pendingRules.length > 0 ? (
                  pendingRules.map((r) => (
                    <div key={r.id} className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/60" />
                      <span>{r.label}</span>
                    </div>
                  ))
                ) : (
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Contraseña segura
                  </p>
                )}
              </div>
            )}
          </label>

          {isSignUp && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="block"
            >
              <span className="mb-1 block text-[12px] font-semibold text-stone-700 dark:text-stone-300">
                Confirmar contraseña
              </span>
              <div className="relative">
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1917] px-3.5 py-2.5 pr-11 text-[14px] text-stone-900 dark:text-stone-100 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 cursor-pointer"
                >
                  <MaterialSymbol icon={showConfirm ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </motion.label>
          )}

          {mode === "login" && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[12px] text-stone-600 dark:text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-[#9a0002]"
                />
                <span>Recordarme</span>
              </label>

              <button
                type="button"
                onClick={() => setInfo("Comunícate con soporte o inicia con Google para restablecer tu cuenta.")}
                className="text-[12px] font-semibold text-[#9a0002] dark:text-red-400 hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Action CTA Button with dynamic color switch */}
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-[14px] font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60",
              isSignUp
                ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25"
                : "bg-gradient-to-r from-[#9a0002] to-[#750001] hover:from-[#850002] hover:to-[#600001] shadow-[#9a0002]/25"
            )}
          >
            {pending ? (
              <span>Procesando…</span>
            ) : isSignUp ? (
              <>
                <span>Crear mi cuenta</span>
                <MaterialSymbol icon="arrow_forward" size={16} />
              </>
            ) : (
              <>
                <span>Iniciar sesión</span>
                <MaterialSymbol icon="arrow_forward" size={16} />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            o continuar con
          </span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        {/* Google OAuth Button */}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1917] py-2.5 text-[13px] font-semibold text-stone-800 dark:text-stone-200 transition hover:bg-stone-50 dark:hover:bg-stone-800/60 shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <GoogleGlyph />
            <span>Continuar con Google</span>
          </button>
        </form>

        {/* Footer info & Alternate login link */}
        <p className="mt-5 text-center text-[11px] text-stone-400 leading-relaxed">
          Al continuar aceptás los{" "}
          <span className="underline decoration-stone-300">Términos de servicio</span> y la{" "}
          <span className="underline decoration-stone-300">Política de privacidad</span>.
        </p>

        <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800 text-center">
          <Link
            href={altHref}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#9a0002] dark:text-red-400 hover:underline"
          >
            <MaterialSymbol icon={isBusiness ? "person" : "storefront"} size={16} />
            <span>{altLabel}</span>
          </Link>
        </div>
      </div>
    </section>
  );

  // ─── BRAND VISUAL SHOWCASE PANE (Like reference) ───────────────────────────
  const brandPane = (
    <section className="flex-1 relative overflow-hidden rounded-[24px] lg:rounded-[28px] bg-gradient-to-br from-[#9a0002] via-[#820002] to-[#400001] p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-inner text-white min-h-[460px] lg:min-h-0">
      {/* Background Decorative Mesh Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.7) 0, transparent 40%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.4) 0, transparent 45%)",
        }}
      />
      <div
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-red-400/20 blur-3xl pointer-events-none"
      />

      {/* Top Header & Tagline */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs text-xs font-black text-white shadow-xs">
            B
          </div>
          <span className="text-[12px] font-black uppercase tracking-[0.18em] text-red-200">
            BolivarPide
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
          {panelTitle}
        </h2>
        <p className="text-[13px] leading-relaxed text-white/80 max-w-sm">
          {panelBody}
        </p>
      </div>

      {/* Tilted Modern Device / Interactive UI Mockup Card */}
      <div className="relative z-10 mt-6 lg:mt-8 flex items-end justify-center lg:justify-end overflow-visible">
        {isBusiness ? (
          /* Business Dashboard Showcase */
          <div className="w-full max-w-[380px] bg-[#1c1917]/95 backdrop-blur-md rounded-2xl border border-white/20 p-4 shadow-2xl space-y-3 text-stone-100 transform transition-transform duration-300 hover:scale-102">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[12px] font-bold">Comandera en vivo</span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                18 pedidos activos
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-stone-400">Ventas de hoy</span>
                <p className="text-[15px] font-black text-amber-300 mt-0.5">$214.500</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-stone-400">Tiempo promedio</span>
                <p className="text-[15px] font-black text-white mt-0.5">22 min</p>
              </div>
            </div>

            {/* Live Order Queue Preview */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🍣</span>
                  <div>
                    <p className="text-[11px] font-bold leading-tight">#1042 • Michi Sushi</p>
                    <span className="text-[9px] text-stone-400">2x Uramaki Salmón</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                  En cocina 🔥
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🍔</span>
                  <div>
                    <p className="text-[11px] font-bold leading-tight">#1043 • Lucas Burger</p>
                    <span className="text-[9px] text-stone-400">1x Doble Bacon + Papas</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  Listo p/ entrega 🛵
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Client Delivery Tracking Showcase */
          <div className="w-full max-w-[380px] bg-white/95 dark:bg-[#1e1b18]/95 backdrop-blur-md rounded-2xl border border-white/30 p-4 shadow-2xl space-y-3 text-stone-900 dark:text-stone-100 transform transition-transform duration-300 hover:scale-102">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[12px] font-bold text-stone-900 dark:text-stone-100">
                  Seguimiento en vivo
                </span>
              </div>
              <span className="text-[11px] font-black text-[#9a0002] dark:text-red-400">
                Llega en 18 min
              </span>
            </div>

            {/* Live Repartidor Card */}
            <div className="p-2.5 rounded-xl bg-[#faf6f1] dark:bg-[#2a2622] flex items-center justify-between border border-[#ede5db] dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#9a0002] text-white flex items-center justify-center text-xs font-bold">
                  🛵
                </div>
                <div>
                  <p className="text-[12px] font-bold leading-tight">Carlos M. • Repartidor</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    En camino a tu dirección
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-800 dark:text-amber-300">
                ★ 4.9
              </span>
            </div>

            {/* Order Items Summary */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1">
                  <span>🍣</span>
                  <span>1x Roll Uramaki Especial</span>
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">$8.400</span>
              </div>
              <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1">
                  <span>🍔</span>
                  <span>1x Doble Burger Cheese</span>
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">$9.200</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="pt-1">
              <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-[#9a0002] to-emerald-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4efea] dark:bg-[#141210] p-3 sm:p-5 lg:p-8">
      {/* Contained Main Card matching reference */}
      <div className="w-full max-w-[1140px] bg-white dark:bg-[#1e1b18] rounded-[28px] sm:rounded-[32px] p-3 sm:p-4 lg:p-5 shadow-[0_25px_80px_-20px_rgba(50,30,20,0.18)] border border-[#ede5db] dark:border-[#332e29] flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[720px] transition-all">
        {formFirst ? (
          <>
            {formPane}
            {brandPane}
          </>
        ) : (
          <>
            {brandPane}
            {formPane}
          </>
        )}
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.9 26.8 37 24 37c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.3 5.2C39.2 36.3 44 31 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
