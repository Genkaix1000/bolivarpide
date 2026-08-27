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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    if (mode === "signup") {
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

  const formPane = (
    <section className="flex flex-col justify-center bg-white px-8 py-10 sm:px-12 lg:px-14">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9a0002] text-sm font-black text-white shadow-sm">
            B
          </span>
          <span className="text-[17px] font-bold tracking-tight text-stone-900">
            BolivarPide
          </span>
        </div>

        <h1 className="text-[28px] font-bold tracking-tight text-stone-900 leading-tight">
          {mode === "login" ? title : "Creá tu cuenta"}
        </h1>
        <p className="mt-2 text-[15px] text-stone-500">
          {mode === "login" ? subtitle : "Completá tus datos para registrarte."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(null);
              setInfo(null);
            }}
            className={`rounded-lg py-2 text-[13px] font-semibold cursor-pointer transition ${
              mode === "login"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800"
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
            className={`rounded-lg py-2 text-[13px] font-semibold cursor-pointer transition ${
              mode === "signup"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {(urlError === "auth" || urlError === "forbidden" || formError || info) && (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              info ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {info ||
              formError ||
              (urlError === "forbidden"
                ? "No tenés permiso para esa sección."
                : "No se pudo completar el inicio de sesión.")}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700">Nombre</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#9a0002]/50 focus:ring-2 focus:ring-[#9a0002]/15"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-stone-700">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#9a0002]/50 focus:ring-2 focus:ring-[#9a0002]/15"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-stone-700">Contraseña</span>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => mode === "signup" && setHintOpen(true)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 pr-11 text-[14px] outline-none focus:border-[#9a0002]/50 focus:ring-2 focus:ring-[#9a0002]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <MaterialSymbol icon={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
            {mode === "signup" && hintOpen && pendingRules.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                {pendingRules.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 text-[12px] text-stone-600"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9a0002]/50" />
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
            {mode === "signup" && hintOpen && pendingRules.length === 0 && password.length > 0 && (
              <p className="mt-2 text-[12px] font-medium text-emerald-700">Contraseña válida</p>
            )}
          </label>

          {mode === "signup" && (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
                Confirmar contraseña
              </span>
              <div className="relative">
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 pr-11 text-[14px] outline-none focus:border-[#9a0002]/50 focus:ring-2 focus:ring-[#9a0002]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
                >
                  <MaterialSymbol icon={showConfirm ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </label>
          )}

          {mode === "login" && (
            <label className="flex items-center gap-2 pt-1 text-[13px] text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 accent-[#9a0002]"
              />
              Guardar sesión
            </label>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center rounded-xl bg-[#9a0002] py-3.5 text-[15px] font-semibold text-white shadow-md shadow-[#9a0002]/25 transition hover:bg-[#6b0001] active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {pending
              ? "Esperá…"
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-stone-400">o</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-stone-300 bg-white py-3 text-[14px] font-semibold text-stone-800 transition hover:bg-stone-50 cursor-pointer"
          >
            <GoogleGlyph />
            Continuar con Google
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] text-stone-400">
          Al continuar aceptás nuestros{" "}
          <span className="underline decoration-stone-300">Términos de uso</span>.
        </p>

        <p className="mt-3 text-center text-[13px] text-stone-500">
          <Link href={altHref} className="font-semibold text-[#9a0002] hover:underline">
            {altLabel}
          </Link>
        </p>
      </div>
    </section>
  );

  const brandPane = (
    <section className="relative flex min-h-[280px] items-center justify-center bg-[#9a0002] p-8 lg:min-h-0 lg:p-10">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
        }}
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-7 text-white shadow-xl backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          BolivarPide
        </p>
        <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">{panelTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/80">{panelBody}</p>
      </div>
    </section>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#ebe6df] p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_25px_80px_-20px_rgba(61,43,31,0.35)] lg:grid-cols-2 lg:min-h-[560px]">
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
