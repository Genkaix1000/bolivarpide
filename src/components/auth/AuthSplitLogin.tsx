"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signInWithGoogle } from "@/lib/auth/actions";
import { passwordIsValid, unmetPasswordRules } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";
import { MaterialSymbol } from "@/components/ui/material-symbol";

type Props = {
  next: string;
  error?: string;
  formSide?: "left" | "right";
  title: string;
  subtitle: string;
  altHref: string;
  altPrefix: string;
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
  altHref,
  altPrefix,
  altLabel,
}: Props) {
  const router = useRouter();
  const formFirst = formSide === "left";

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pendingRules = useMemo(() => unmetPasswordRules(password), [password]);
  const isSignUp = mode === "signup";
  const showHint = isSignUp && passwordFocused && password.length > 0;

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
          options: { data: { full_name: name.trim(), name: name.trim() } },
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

  const inputClass =
    "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400";

  function EyeToggle({
    shown,
    onToggle,
    hideLabel,
    showLabel,
  }: {
    shown: boolean;
    onToggle: () => void;
    hideLabel: string;
    showLabel: string;
  }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={shown ? hideLabel : showLabel}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
      >
        <MaterialSymbol
          icon={shown ? "visibility_off" : "visibility"}
          size={18}
          className="leading-none"
        />
      </button>
    );
  }

  const formPane = (
    <section className="flex h-full flex-col justify-center bg-white px-7 py-7 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-[400px]">
        {/* Logo */}
        <Link href="/" className="mb-5 inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-[14px] font-black text-white shadow-sm">
            B
          </span>
          <span className="text-[17px] font-bold tracking-tight text-stone-900">
            BolivarPide
          </span>
        </Link>

        <h1 className="text-[22px] font-bold tracking-tight text-stone-900 leading-tight">
          {isSignUp ? "Creá tu cuenta" : title}
        </h1>
        <p className="mt-1 text-[13px] text-stone-500">
          {isSignUp ? "Completá tus datos" : subtitle}
        </p>

        <div className="mt-4 flex gap-4 text-[13px]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(null);
              setInfo(null);
            }}
            className={`cursor-pointer pb-1 font-medium ${
              !isSignUp
                ? "border-b-2 border-[#9a0002] text-stone-900"
                : "text-stone-400 hover:text-stone-700"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setFormError(null);
              setInfo(null);
            }}
            className={`cursor-pointer pb-1 font-medium ${
              isSignUp
                ? "border-b-2 border-[#9a0002] text-stone-900"
                : "text-stone-400 hover:text-stone-700"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {(urlError === "auth" || urlError === "forbidden" || formError || info) && (
          <p className={`mt-3 text-[12px] ${info ? "text-emerald-700" : "text-red-700"}`}>
            {info ||
              formError ||
              (urlError === "forbidden"
                ? "No tenés permiso para esa sección."
                : "No se pudo completar el inicio de sesión.")}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-2.5">
          <label className={`block ${isSignUp ? "" : "invisible pointer-events-none"}`}>
            <span className="mb-1 block text-[12px] font-medium text-stone-700">Nombre</span>
            <input
              required={isSignUp}
              tabIndex={isSignUp ? 0 : -1}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Tu nombre"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-stone-700">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="Ingresá tu email"
              className={inputClass}
            />
          </label>

          <div>
            <span className="mb-1 block text-[12px] font-medium text-stone-700">Contraseña</span>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className={`${inputClass} pr-9`}
                />
                <EyeToggle
                  shown={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  hideLabel="Ocultar contraseña"
                  showLabel="Ver contraseña"
                />
              </div>
              {isSignUp && (
                <div className="flex w-[128px] shrink-0 flex-wrap content-center gap-1">
                  {showHint &&
                    pendingRules.map((r) => (
                      <span
                        key={r.id}
                        className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] leading-none text-stone-500"
                      >
                        {r.short}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          <label className={`block ${isSignUp ? "" : "invisible pointer-events-none"}`}>
            <span className="mb-1 block text-[12px] font-medium text-stone-700">
              Confirmar contraseña
            </span>
            <div className="relative">
              <input
                required={isSignUp}
                tabIndex={isSignUp ? 0 : -1}
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={`${inputClass} pr-9`}
              />
              <EyeToggle
                shown={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                hideLabel="Ocultar contraseña"
                showLabel="Ver contraseña"
              />
            </div>
          </label>

          <label
            className={`flex items-center gap-2 text-[12px] text-stone-600 select-none ${
              isSignUp ? "invisible pointer-events-none" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              tabIndex={isSignUp ? -1 : 0}
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 accent-[#9a0002]"
            />
            Guardar sesión
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#9a0002] py-2.5 text-[13px] font-semibold text-white hover:bg-[#6b0001] cursor-pointer disabled:opacity-60"
          >
            {pending ? "Esperá…" : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
            o
          </span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white py-2.5 text-[13px] font-medium text-stone-800 hover:bg-stone-50 cursor-pointer"
          >
            <GoogleGlyph />
            Continuar con Google
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-stone-400">
          Al continuar aceptás nuestros{" "}
          <span className="underline decoration-stone-300">Términos de uso</span>.
        </p>
        <p className="mt-2 text-center text-[12px] text-stone-500">
          {altPrefix}{" "}
          <Link href={altHref} className="font-medium text-[#9a0002] hover:underline">
            {altLabel}
          </Link>
        </p>
      </div>
    </section>
  );

  const brandPane = (
    <div className="hidden md:flex h-full items-center justify-center bg-[#fbf9f6] dark:bg-[#1c1917] p-6 lg:p-10 select-none overflow-hidden">
      <img
        src="/images/login_illustration.jpg"
        alt="BolivarPide"
        className="w-full max-w-[420px] max-h-[520px] object-contain rounded-2xl drop-shadow-xs"
        draggable={false}
      />
    </div>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#e8e4de] p-4 sm:p-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-24px_rgba(40,30,20,0.25)] md:grid-cols-2 md:min-h-[620px]">
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
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
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
