"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signInWithGoogle } from "@/lib/auth/actions";
import { authErrorEs } from "@/lib/auth/errors";
import { PASSWORD_RULES, passwordIsValid } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";
import { flashToast } from "@/components/FlashToast";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { BP_REMEMBER_KEY } from "@/lib/auth/rememberedAccount";

type Field = "name" | "email" | "password" | "confirm";
type FieldErrors = Partial<Record<Field, string>>;
type Touched = Partial<Record<Field, boolean>>;

function emailError(value: string) {
  if (!value.trim()) return "Ingresá tu email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email inválido.";
  return null;
}

type Props = {
  next: string;
  error?: string;
  formSide?: "left" | "right";
  title: string;
  subtitle: string;
  altHref: string;
  altPrefix: string;
  altLabel: string;
  /** Lema del panel visual (2 líneas recomendadas) */
  lema: [string, string];
};

type Mode = "login" | "signup";

const REMEMBER_KEY = BP_REMEMBER_KEY;

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

export function AuthSplitLogin({
  next,
  error: urlError,
  formSide = "left",
  title,
  subtitle,
  altHref,
  altPrefix,
  altLabel,
  lema,
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
  const [touched, setTouched] = useState<Touched>({});
  const [attempted, setAttempted] = useState(false);

  const isSignUp = mode === "signup";
  const showHint = isSignUp && passwordFocused;

  const fieldErrors = useMemo((): FieldErrors => {
    const errors: FieldErrors = {};
    if (isSignUp && !name.trim()) errors.name = "Ingresá tu nombre.";
    const mail = emailError(email);
    if (mail) errors.email = mail;
    if (!password) errors.password = "Ingresá tu contraseña.";
    else if (isSignUp && !passwordIsValid(password)) {
      errors.password = "La contraseña no cumple los requisitos.";
    }
    if (isSignUp) {
      if (!confirm) errors.confirm = "Confirmá tu contraseña.";
      else if (password !== confirm) errors.confirm = "Las contraseñas no coinciden.";
    }
    return errors;
  }, [isSignUp, name, email, password, confirm]);

  function fieldMsg(field: Field) {
    return (touched[field] || attempted) ? fieldErrors[field] : undefined;
  }

  function markTouched(field: Field) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  function resetFieldState() {
    setTouched({});
    setAttempted(false);
    setFormError(null);
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    resetFieldState();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAttempted(true);

    if (Object.keys(fieldErrors).length > 0) return;

    setPending(true);
    try {
      localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
      const supabase = createClient({ remember });

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFormError(authErrorEs(error));
          return;
        }
        flashToast("Sesión iniciada.");
      } else {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim(), name: name.trim() },
            emailRedirectTo,
          },
        });
        if (error) {
          setFormError(authErrorEs(error));
          return;
        }
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            const needsConfirm = /confirm|not confirmed/i.test(signInError.message);
            if (needsConfirm) {
              flashToast("Te enviamos un email para confirmar tu cuenta.");
              router.push(
                `/auth/confirmar?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
              );
              return;
            }
            setFormError(authErrorEs(signInError));
            return;
          }
        }
        flashToast("Tu cuenta se creó correctamente.");
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setFormError(authErrorEs(err instanceof Error ? err.message : "Error inesperado"));
    } finally {
      setPending(false);
    }
  }

  function inputClass(invalid?: boolean) {
    return `w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 ${
      invalid
        ? "border-red-400 focus:border-red-500"
        : "border-stone-200 focus:border-stone-400"
    }`;
  }

  const formPane = (
    <section className="flex h-full flex-col justify-center bg-white px-6 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[380px]">
        <Link href="/" className="mb-3 inline-flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-[13px] font-black text-white shadow-sm">
            B
          </span>
          <span className="text-[16px] font-bold tracking-tight text-stone-900">
            BolivarPide
          </span>
        </Link>

        <h1 className="text-[20px] font-bold tracking-tight text-stone-900 leading-tight">
          {isSignUp ? "Creá tu cuenta" : title}
        </h1>
        <p className="mt-0.5 text-[12px] text-stone-500">
          {isSignUp ? "Completá tus datos" : subtitle}
        </p>

        <div className="mt-3 flex gap-4 text-[13px]">
          <button
            type="button"
            onClick={() => switchMode("login")}
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
            onClick={() => switchMode("signup")}
            className={`cursor-pointer pb-1 font-medium ${
              isSignUp
                ? "border-b-2 border-[#9a0002] text-stone-900"
                : "text-stone-400 hover:text-stone-700"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {(urlError === "auth" || urlError === "forbidden" || formError) && (
          <p className="mt-2 text-[12px] text-red-700">
            {formError ||
              (urlError === "forbidden"
                ? "No tenés permiso para esa sección."
                : "No se pudo completar el inicio de sesión.")}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-3 space-y-2">
          {isSignUp && (
            <label className="block">
              <span className="mb-0.5 block text-[12px] font-medium text-stone-700">Nombre</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markTouched("name")}
                autoComplete="name"
                placeholder="Tu nombre"
                aria-invalid={!!fieldMsg("name")}
                className={inputClass(!!fieldMsg("name"))}
              />
              {fieldMsg("name") && (
                <span className="mt-0.5 block text-[11px] text-red-600">{fieldMsg("name")}</span>
              )}
            </label>
          )}

          <label className="block">
            <span className="mb-0.5 block text-[12px] font-medium text-stone-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => markTouched("email")}
              autoComplete="email"
              placeholder="Ingresá tu email"
              aria-invalid={!!fieldMsg("email")}
              className={inputClass(!!fieldMsg("email"))}
            />
            {fieldMsg("email") && (
              <span className="mt-0.5 block text-[11px] text-red-600">{fieldMsg("email")}</span>
            )}
          </label>

          <div>
            <span className="mb-0.5 block text-[12px] font-medium text-stone-700">Contraseña</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  setPasswordFocused(false);
                  markTouched("password");
                }}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                aria-invalid={!!fieldMsg("password")}
                className={`${inputClass(!!fieldMsg("password"))} pr-9`}
              />
              <EyeToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                hideLabel="Ocultar contraseña"
                showLabel="Ver contraseña"
              />
              {showHint && (
                <div
                  role="status"
                  className="absolute top-[calc(100%+8px)] left-0 z-20 w-full min-w-[240px] rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 shadow-lg"
                >
                  <p className="mb-1.5 text-[12px] text-stone-600">
                    La contraseña tiene que tener al menos:
                  </p>
                  <ul className="space-y-0.5">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-2 rounded px-1.5 py-1 text-[12px] ${
                            ok ? "bg-emerald-100/80 text-emerald-800" : "text-stone-500"
                          }`}
                        >
                          <span className="flex w-4 shrink-0 justify-center">
                            {ok ? (
                              <MaterialSymbol
                                icon="check"
                                size={14}
                                className="leading-none text-emerald-700"
                              />
                            ) : null}
                          </span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            {fieldMsg("password") && (
              <span className="mt-0.5 block text-[11px] text-red-600">{fieldMsg("password")}</span>
            )}
          </div>

          {isSignUp && (
            <label className="block">
              <span className="mb-0.5 block text-[12px] font-medium text-stone-700">
                Confirmar contraseña
              </span>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => markTouched("confirm")}
                  autoComplete="new-password"
                  aria-invalid={!!fieldMsg("confirm")}
                  className={`${inputClass(!!fieldMsg("confirm"))} pr-9`}
                />
                <EyeToggle
                  shown={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  hideLabel="Ocultar contraseña"
                  showLabel="Ver contraseña"
                />
              </div>
              {fieldMsg("confirm") && (
                <span className="mt-0.5 block text-[11px] text-red-600">{fieldMsg("confirm")}</span>
              )}
            </label>
          )}

          {!isSignUp && (
            <div className="flex items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-stone-600 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-stone-300 accent-[#9a0002]"
                />
                Guardar sesión
              </label>
              <Link
                href={`/auth/olvide-pass?next=${encodeURIComponent(next)}`}
                className="text-[12px] font-medium text-[#9a0002] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#9a0002] py-2 text-[13px] font-semibold text-white hover:bg-[#6b0001] cursor-pointer disabled:opacity-60"
          >
            {pending ? "Esperá…" : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        <div className="my-3 flex items-center gap-3">
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white py-2 text-[13px] font-medium text-stone-800 hover:bg-stone-50 cursor-pointer"
          >
            <GoogleGlyph />
            Continuar con Google
          </button>
        </form>

        <p className="mt-3 text-center text-[11px] text-stone-400">
          Al continuar aceptás nuestros{" "}
          <span className="underline decoration-stone-300">Términos de uso</span>.
        </p>
        <p className="mt-1.5 text-center text-[12px] text-stone-500">
          {altPrefix}{" "}
          <Link href={altHref} className="font-medium text-[#9a0002] hover:underline">
            {altLabel}
          </Link>
        </p>
      </div>
    </section>
  );

  const brandPane = (
    <div className={`hidden h-full md:block ${formFirst ? "p-3 pl-2" : "p-3 pr-2"}`}>
      <section className="relative flex h-full min-h-[596px] flex-col overflow-hidden rounded-xl bg-[#9a0002]">
        {/* Soft wave / mesh pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: [
              "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(255,255,255,0.22) 0%, transparent 55%)",
              "radial-gradient(ellipse 70% 50% at 95% 85%, rgba(0,0,0,0.22) 0%, transparent 50%)",
              "radial-gradient(ellipse 55% 40% at 70% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)",
            ].join(", "),
          }}
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          viewBox="0 0 400 700"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 180 C80 120 160 240 240 180 C320 120 360 200 400 160 L400 0 L0 0 Z"
            fill="white"
          />
          <path
            d="M0 420 C90 360 150 480 250 410 C330 360 370 450 400 400 L400 700 L0 700 Z"
            fill="black"
          />
          <path
            d="M0 520 C110 480 180 580 280 530 C350 500 380 560 400 540 L400 700 L0 700 Z"
            fill="white"
          />
        </svg>

        {/* Logo + lema */}
        <div className="relative z-10 px-8 pt-8 lg:px-10 lg:pt-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[14px] font-black text-[#9a0002] shadow-sm">
              B
            </span>
            <span className="text-[16px] font-bold tracking-tight text-white">BolivarPide</span>
          </div>
          <h2 className="mt-5 max-w-[280px] text-[28px] font-bold leading-[1.15] tracking-tight text-white lg:text-[32px]">
            {lema[0]}
            <br />
            {lema[1]}
          </h2>
        </div>

        {/* Illustration */}
        <div className="relative z-10 mt-auto flex flex-1 items-end justify-center px-4 pb-6 pt-4">
          <Image
            src="/images/login_illustration.png"
            alt="BolivarPide"
            width={520}
            height={420}
            className="h-auto w-full max-w-[420px] object-contain object-bottom drop-shadow-xl"
            priority
          />
        </div>
      </section>
    </div>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#9a0002] p-4 sm:p-6 md:bg-[#e8e4de]">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-[0_20px_60px_-24px_rgba(40,30,20,0.35)] md:grid-cols-2 md:min-h-[620px]">
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
