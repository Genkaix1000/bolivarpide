import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { listMyMemberships } from "@/lib/business/queries";
import { respondInvite } from "@/lib/business/actions";

export default async function NegocioHubPage() {
  const memberships = await listMyMemberships();
  const active = memberships.filter((m) => m.status === "active");
  const invited = memberships.filter((m) => m.status === "invited");

  return (
    <main className="min-h-dvh bg-[#f3efe8] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9a0002]">
              Negocio
            </p>
            <h1 className="mt-1 text-2xl font-bold text-stone-900">Mis locales</h1>
            <p className="mt-1 text-sm text-stone-600">
              Elegí un local o respondé invitaciones pendientes.
            </p>
          </div>
          <form action={signOut}>
            <input type="hidden" name="next" value="/negocio/login" />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 cursor-pointer"
            >
              Salir
            </button>
          </form>
        </div>

        {invited.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-800">Invitaciones</h2>
            {invited.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-stone-900">
                    {m.businesses?.name ?? "Local"}
                  </p>
                  <p className="text-xs text-stone-600">Rol: {m.role}</p>
                </div>
                <div className="flex gap-2">
                  <form action={respondInvite}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <input type="hidden" name="accept" value="true" />
                    <button
                      type="submit"
                      className="rounded-full bg-[#9a0002] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                    >
                      Aceptar
                    </button>
                  </form>
                  <form action={respondInvite}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <input type="hidden" name="accept" value="false" />
                    <button
                      type="submit"
                      className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-800">Activos</h2>
          {active.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-8 text-center">
              <p className="text-sm text-stone-600">Todavía no tenés un local vinculado.</p>
              <Link
                href="/negocio/registro"
                className="mt-4 inline-block rounded-full bg-[#9a0002] px-5 py-2 text-sm font-semibold text-white"
              >
                Abrir / afiliar mi negocio
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {active.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/negocio/${m.business_id}/dashboard`}
                    className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 transition hover:border-[#9a0002]/40"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">
                        {m.businesses?.name ?? "Local"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {m.role}
                        {m.businesses?.published ? " · publicado" : " · no publicado"}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#9a0002]">Entrar →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
