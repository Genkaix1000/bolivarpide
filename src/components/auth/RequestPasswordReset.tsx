"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { authErrorEs } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/paths";
import { MaterialSymbol } from "@/components/ui/material-symbol";

type Props = {
  next: string;
  enviado: boolean;
  error?: string;
  email?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestPasswordReset({ next, enviado, error, email }: Props) {
  const safeNext = safeNextPath(next);
  const loginHref = safeNext.startsWith("/negocio")
    ? `/negocio/login?next=${encodeURIComponent(safeNext)}`
    : `/login?next=${encodeURIComponent(safeNext)}`;

  const [mail, setMail] = useState(email ?? "");
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const submittingRef = useRef(false);

  const fieldError =
    attempted && !mail.trim()
      ? "Ingresá tu email."
      : attempted && !EMAIL_RE.test(mail)
        ? "Email inválido."
        : null;

  const urlError =
    error === "link"
      ? "El link expiró o ya fue usado. Pedí uno nuevo."
      : error
        ? authErrorEs(error)
        : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    setAttempted(true);
    if (fieldError) return;
    submittingRef.current = true;
    setPending(true);
    const formData = new FormData();
    formData.set("email", mail);
    formData.set("next", safeNext);
    await requestPasswordReset(formData);
  }

  if (enviado) {
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
            <MaterialSymbol icon="mark_email_unread" size={28} fill />
          </div>

          <h1 className="text-[22px] font-bold tracking-tight text-stone-900 leading-tight">
            Revisá tu email
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
            Te enviamos un link para restablecer tu contraseña a{" "}
            <span className="font-semibold text-stone-800">
              {mail.trim() || "tu correo"}
            </span>
            . Si esa cuenta existe, el link ya está en camino.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href={loginHref}
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-200 px-4 text-[13px] font-semibold text-stone-700 hover:bg-stone-50"
            >
              Ir a iniciar sesión
            </Link>
          </div>

          <p className="mt-5 text-center text-[11px] text-stone-400">
            ¿No llegó? Revisá spam o{" "}
            <Link
              href={`/auth/olvide-pass?next=${encodeURIComponent(safeNext)}`}
              className="font-medium text-[#9a0002] hover:underline"
            >
              pedí otro link
            </Link>
            . Cada nuevo link deja sin efecto el anterior.
          </p>
        </div>
      </div>
    );
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
          <MaterialSymbol icon="lock_reset" size={28} fill />
        </div>

        <h1 className="text-[22px] font-bold tracking-tight text-stone-900 leading-tight">
          Recuperá tu contraseña
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
          Ingresá tu email y te enviamos un link para crear una nueva
          contraseña.
        </p>

        {(urlError || fieldError) && (
          <p className="mt-3 text-[12px] text-red-700">
            {fieldError || urlError}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-0.5 block text-[12px] font-medium text-stone-700">
              Email
            </span>
            <input
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              autoComplete="email"
              placeholder="Ingresá tu email"
              aria-invalid={!!fieldError}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-900 outline-none placeholder:text-stone-400 ${
                fieldError
                  ? "border-red-400 focus:border-red-500"
                  : "border-stone-200 focus:border-stone-400"
              }`}
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#9a0002] px-4 text-[13px] font-bold text-white transition hover:bg-[#7a0002] disabled:opacity-60 cursor-pointer"
          >
            <MaterialSymbol icon="outgoing_mail" size={18} />
            {pending ? "Enviando…" : "Enviar link"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-stone-500">
          ¿Recordás tu contraseña?{" "}
          <Link
            href={loginHref}
            className="font-medium text-[#9a0002] hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}