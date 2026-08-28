"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { flashToast } from "@/components/FlashToast";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { authErrorEs } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/paths";

type Props = {
  email: string;
  next: string;
};

export function ConfirmEmailWaiting({ email, next }: Props) {
  const router = useRouter();
  const safeNext = safeNextPath(next);
  const loginHref = safeNext.startsWith("/negocio")
    ? `/negocio/login?next=${encodeURIComponent(safeNext)}`
    : `/login?next=${encodeURIComponent(safeNext)}`;

  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        flashToast("Cuenta confirmada. ¡Bienvenido!");
        router.replace(safeNext);
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, safeNext]);

  async function resend() {
    if (!email || pending) return;
    setPending(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setMsg(authErrorEs(error));
        return;
      }
      flashToast("Te reenviamos el email de confirmación.");
    } catch (err) {
      setMsg(authErrorEs(err instanceof Error ? err.message : "No se pudo reenviar."));
    } finally {
      setPending(false);
    }
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
          <span className="text-[16px] font-bold tracking-tight text-stone-900">BolivarPide</span>
        </Link>

        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9a0002]/10 text-[#9a0002]">
          <MaterialSymbol icon="mark_email_unread" size={28} fill />
        </div>

        <h1 className="text-[22px] font-bold tracking-tight text-stone-900 leading-tight">
          Confirmá tu email
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
          Te enviamos un link a{" "}
          <span className="font-semibold text-stone-800">{email || "tu correo"}</span>.
          Abrilo para activar la cuenta; esta página te va a meter solo cuando confirmes.
        </p>

        {msg && <p className="mt-3 text-[12px] text-red-700">{msg}</p>}

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={resend}
            disabled={pending || !email}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#9a0002] px-4 text-[13px] font-bold text-white transition hover:bg-[#7a0002] disabled:opacity-60 cursor-pointer"
          >
            <MaterialSymbol icon="outgoing_mail" size={18} />
            {pending ? "Reenviando…" : "Reenviar email"}
          </button>
          <Link
            href={loginHref}
            className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 px-4 text-[13px] font-semibold text-stone-700 hover:bg-stone-50"
          >
            Ir a iniciar sesión
          </Link>
        </div>

        <p className="mt-5 text-center text-[11px] text-stone-400">
          ¿No llegó? Revisá spam o reenviá el correo.
        </p>
      </div>
    </div>
  );
}
