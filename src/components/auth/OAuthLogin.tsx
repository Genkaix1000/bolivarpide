import { signInWithGoogle } from "@/lib/auth/actions";

type Props = {
  title: string;
  subtitle: string;
  next: string;
  error?: string;
};

export function OAuthLogin({ title, subtitle, next, error }: Props) {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[var(--brand-cream)] px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9a0002]">
            BolivarPide
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">{title}</h1>
          <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
        </div>

        {error === "forbidden" ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            No tenés permiso de admin en esta cuenta.
          </p>
        ) : error === "auth" ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            No se pudo completar el inicio de sesión. Probá de nuevo.
          </p>
        ) : null}

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full rounded-full bg-[#9a0002] py-3 text-sm font-semibold text-white shadow-md shadow-[#9a0002]/20 transition hover:bg-[#6b0001] active:scale-[0.99] cursor-pointer"
          >
            Continuar con Google
          </button>
        </form>
      </div>
    </main>
  );
}
