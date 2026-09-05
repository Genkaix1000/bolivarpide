"use client";

import { useEffect, useRef, useState } from "react";
import { flashToast } from "@/components/FlashToast";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { authErrorEs } from "@/lib/auth/errors";
import { PASSWORD_RULES, passwordIsValid } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";
import { profileInputClass } from "./IdentityVerificationPanel";

function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Ocultar contraseña" : "Ver contraseña"}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute inset-y-0 right-2 flex w-8 items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
    >
      <MaterialSymbol icon={shown ? "visibility_off" : "visibility"} size={18} />
    </button>
  );
}

export function ChangePasswordSection() {
  const [hasPassword, setHasPassword] = useState(true);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsRelogin, setNeedsRelogin] = useState(false);
  const [touched, setTouched] = useState({
    currentPass: false,
    newPass: false,
    confirm: false,
  });
  const [attempted, setAttempted] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        setHasPassword(Boolean(data.user?.identities?.some((i) => i.provider === "email")));
      } catch {
        if (!cancelled) setHasPassword(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const newError =
    !newPass
      ? "Ingresá la contraseña nueva."
      : !passwordIsValid(newPass)
        ? "La contraseña no cumple los requisitos."
        : null;
  const confirmError =
    !confirm
      ? "Confirmá la contraseña."
      : confirm !== newPass
        ? "Las contraseñas no coinciden."
        : null;
  const currentError = hasPassword && !currentPass ? "Ingresá tu contraseña actual." : null;

  const fieldMsgs = {
    current: touched.currentPass || attempted ? currentError : undefined,
    new: touched.newPass || attempted ? newError : undefined,
    confirm: touched.confirm || attempted ? confirmError : undefined,
  };

  function markTouched(field: "currentPass" | "newPass" | "confirm") {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setNeedsRelogin(false);
    setAttempted(true);
    if (submittingRef.current) return;
    if (currentError || newError || confirmError) return;
    submittingRef.current = true;
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPass,
        ...(hasPassword ? { current_password: currentPass } : {}),
      });
      if (error) {
        if (error.code === "reauthentication_needed") {
          setNeedsRelogin(true);
          return;
        }
        setFormError(authErrorEs(error));
        return;
      }
      flashToast("Contraseña actualizada.");
      setCurrentPass("");
      setNewPass("");
      setConfirm("");
      setTouched({ currentPass: false, newPass: false, confirm: false });
      setAttempted(false);
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      setFormError(authErrorEs(err instanceof Error ? err.message : "Error inesperado"));
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  async function handleRelogin() {
    await createClient().auth.signOut();
    window.location.href = `/login?next=${encodeURIComponent("/?tab=profile&section=security")}`;
  }

  return (
    <div className="pt-3 space-y-3">
      {!hasPassword && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          Todavía no tenés contraseña. Creá una para entrar también con tu email y contraseña.
        </p>
      )}

      {needsRelogin ? (
        <div className="space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <MaterialSymbol icon="lock" size={15} className="mt-0.5 flex-shrink-0" />
            <span>
              Tu sesión es de hace más de un día. Por seguridad, volvé a iniciar sesión antes de
              cambiar la contraseña.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleRelogin()}
            className="w-full py-2.5 rounded-xl border border-[#9a0002]/30 bg-[#9a0002]/5 text-[#9a0002] dark:text-red-300 text-[13px] font-bold hover:bg-[#9a0002]/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MaterialSymbol icon="logout" size={16} />
            Cerrar sesión y volver a intentar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {hasPassword && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  onBlur={() => markTouched("currentPass")}
                  autoComplete="current-password"
                  aria-invalid={!!fieldMsgs.current}
                  className={`${profileInputClass} pr-9`}
                />
                <EyeToggle shown={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
              </div>
              {fieldMsgs.current && (
                <span className="mt-1 block text-[11px] text-red-600">{fieldMsgs.current}</span>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Contraseña nueva
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                onFocus={() => setNewFocused(true)}
                onBlur={() => {
                  setNewFocused(false);
                  markTouched("newPass");
                }}
                autoComplete="new-password"
                aria-invalid={!!fieldMsgs.new}
                className={`${profileInputClass} pr-9`}
              />
              <EyeToggle shown={showNew} onToggle={() => setShowNew((v) => !v)} />
            </div>
            {newFocused && (
              <ul className="mt-1.5 space-y-0.5">
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(newPass);
                  return (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-[10px] rounded px-1.5 py-0.5 ${
                        ok ? "bg-emerald-100/80 text-emerald-800" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <MaterialSymbol
                        icon={ok ? "check" : "circle"}
                        size={11}
                        className={ok ? "text-emerald-700" : "text-gray-300 dark:text-gray-600"}
                      />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
            {fieldMsgs.new && (
              <span className="mt-1 block text-[11px] text-red-600">{fieldMsgs.new}</span>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => markTouched("confirm")}
                autoComplete="new-password"
                aria-invalid={!!fieldMsgs.confirm}
                className={`${profileInputClass} pr-9`}
              />
              <EyeToggle shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
            </div>
            {fieldMsgs.confirm && (
              <span className="mt-1 block text-[11px] text-red-600">{fieldMsgs.confirm}</span>
            )}
          </div>

          {formError && (
            <p className="px-0 pt-0.5 text-[11px] text-red-600 leading-relaxed">{formError}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 rounded-xl bg-[#9a0002] text-white text-[13px] font-bold shadow-md shadow-[#9a0002]/25 hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <MaterialSymbol icon="lock_reset" size={16} />
            {pending ? "Guardando…" : "Guardar contraseña"}
          </button>

          <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
            Tu sesión continúa activa después del cambio.
          </p>
        </form>
      )}
    </div>
  );
}