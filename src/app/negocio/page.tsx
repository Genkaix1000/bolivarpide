import { redirect } from "next/navigation";
import { listMyMemberships } from "@/lib/business/queries";
import { respondInvite } from "@/lib/business/actions";
import { HubBusinessGrid } from "@/components/business/hub/HubBusinessGrid";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default async function NegocioHubPage() {
  const memberships = await listMyMemberships();
  const active = memberships.filter((m) => m.status === "active");
  const invited = memberships.filter((m) => m.status === "invited");

  if (active.length === 0 && invited.length === 0) {
    redirect("/negocio/registro");
  }

  return (
    <main className="min-h-dvh bg-[#f3efe8] dark:bg-[#141210] px-4 sm:px-8 py-8 sm:py-12 transition-colors">
      <div className="mx-auto max-w-7xl space-y-8">
        {invited.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <MaterialSymbol icon="mail" size={16} />
              <span>Invitaciones pendientes ({invited.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invited.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 shadow-sm"
                >
                  <div>
                    <p className="font-extrabold text-stone-900 dark:text-stone-100">
                      {m.businesses?.name ?? "Local"}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                      Te invitaron con rol: <strong className="capitalize">{m.role}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={respondInvite}>
                      <input type="hidden" name="memberId" value={m.id} />
                      <input type="hidden" name="accept" value="true" />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-full bg-[#9a0002] hover:bg-[#800001] px-4 py-1.5 text-xs font-bold text-white transition-colors shadow-sm"
                      >
                        Aceptar
                      </button>
                    </form>
                    <form action={respondInvite}>
                      <input type="hidden" name="memberId" value={m.id} />
                      <input type="hidden" name="accept" value="false" />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <HubBusinessGrid memberships={active} />
      </div>
    </main>
  );
}
