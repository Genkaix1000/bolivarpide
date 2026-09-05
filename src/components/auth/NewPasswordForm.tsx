"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { flashToast } from "@/components/FlashToast";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { authErrorEs } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/paths";
import { PASSWORD_RULES, passwordIsValid } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

type Field = "password" | "confirm";
type FieldErrors = Partial<Record<Field, string>>;
type Touched = Partial<Record<Field, boolean>>;

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

export function NewPasswordForm({ next }: { next: string }) {
  const router = useRouter();
  const safeNext = safeNextPath(next);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Touched>({});
  const [attempted, setAttempted] = useState(false);

  const fieldErrors = useMemo((): FieldErrors => {
    const errors: FieldErrors = {};
    if (!password) errors.password = "Ingresá una contraseña.";
    else if (!passwordIsValid(password)) {
      errors.password = "La contraseña no cumple los requisitos.";
    }
    if (!confirm) errors.confirm = "Confirmá tu contraseña.";
    else if (password !== confirm) errors.confirm = "Las contraseñas no coinciden.";
    return errors;
  }, [password, confirm]);

  function fieldMsg(field: Field) {
    return touched[field] || attempted ? fieldErrors[field] : undefined;
  }

  function markTouched(field: Field) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAttempted(true);

    if (Object.keys(fieldErrors).length > 0) return;

    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError(authErrorEs(error));
        return;
      }
      flashToast("Contraseña actualizada.");
      router.push(safeNext);
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

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-[#faf6f1] px-4 py-10">
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full bg-[#9a0002]/8 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-8%] h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-[90px]" />

      <div className="relative w-full max-w-[420px] rounded-[28px] border border-[#ddd4c8] bg-white p-7 shadow-[0_18px_50px_-28px_rgba(61,43,31,0.45)] sm:p-8">
        <Link href="/" className="mb-5 inline-flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#9a0002] to-[#6b0001] text-[13px] font-black text-white shadow-sm">
            B
          </span>
          <span className="text-[16px] font-bold tracking-tight text-stone-900">
            BolivarPide
          </span>
        </Link>

        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9a0002]/10 text-[#9a0002]">
          <MaterialSymbol icon="password" size={28} fill />
        </div>

        <h1 className="text-[22px] font-bold tracking-tight text-stone-900 leading-tight">
          Creá tu nueva contraseña
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
          Ingresá la contraseña nueva que vas a usar para entrar.
        </p>

        {formError && (
          <p className="mt-3 text-[12px] text-red-700">{formError}</p>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
          <div>
            <span className="mb-0.5 block text-[12px] font-medium text-stone-700">
              Nueva contraseña
            </span>
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
                autoComplete="new-password"
                aria-invalid={!!fieldMsg("password")}
                className={`${inputClass(!!fieldMsg("password"))} pr-9`}
              />
              <EyeToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                hideLabel="Ocultar contraseña"
                showLabel="Ver contraseña"
              />
              {passwordFocused && (
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

          <div>
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
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#9a0002] px-4 text-[13px] font-bold text-white transition hover:bg-[#7a0002] disabled:opacity-60 cursor-pointer"
          >
            <MaterialSymbol icon="lock_reset" size={18} />
            {pending ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-stone-400">
          Quedará iniciada tu sesión al finalizar.
        </p>
      </div>
    </div>
  );
}