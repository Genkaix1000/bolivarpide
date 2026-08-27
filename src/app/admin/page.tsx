import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import {
  approveLead,
  rejectLead,
  setPlan,
  setPublished,
} from "@/lib/business/actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let service;
  try {
    service = createServiceClient();
  } catch {
    return (
      <main className="min-h-dvh grid place-items-center px-4">
        <p className="text-sm text-stone-600">
          Falta <code>SUPABASE_SERVICE_ROLE_KEY</code> en <code>.env.local</code>.
        </p>
      </main>
    );
  }
  const [{ data: leads }, { data: businesses }, { count: ordersToday }] =
    await Promise.all([
      service.from("leads").select("*").order("created_at", { ascending: false }).limit(50),
      service
        .from("businesses")
        .select("id, name, slug, published, plan, is_open, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      service
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

  const pendingLeads = (leads ?? []).filter((l) => l.status === "pending").length;
  const published = (businesses ?? []).filter((b) => b.published).length;

  return (
    <main className="min-h-dvh bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
            <p className="text-sm text-stone-600">{user?.email}</p>
          </div>
          <form action={signOut}>
            <input type="hidden" name="next" value="/admin/login" />
            <button
              type="submit"
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm cursor-pointer"
            >
              Salir
            </button>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Comercios", businesses?.length ?? 0],
            ["Publicados", published],
            ["Leads pending", pendingLeads],
            ["Pedidos hoy", ordersToday ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">Leads</h2>
          <ul className="space-y-2">
            {(leads ?? []).map((lead) => (
              <li
                key={lead.id}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{lead.business_name}</p>
                    <p className="text-xs text-stone-500">
                      {lead.email} · {lead.status}
                    </p>
                  </div>
                  {lead.status === "pending" ? (
                    <div className="flex gap-2">
                      <form action={approveLead}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-[#9a0002] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                        >
                          Aprobar
                        </button>
                      </form>
                      <form action={rejectLead}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <button
                          type="submit"
                          className="rounded-full border px-3 py-1.5 text-xs cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </form>
                    </div>
                  ) : lead.claim_token ? (
                    <code className="text-[10px] break-all text-stone-600">
                      /negocio/onboarding?claim={lead.claim_token}
                    </code>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Comercios</h2>
          <ul className="space-y-2">
            {(businesses ?? []).map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-stone-500">
                    {b.slug} · {b.plan} · {b.published ? "published" : "draft"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={setPublished}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <input
                      type="hidden"
                      name="published"
                      value={b.published ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="rounded-full border px-3 py-1.5 text-xs cursor-pointer"
                    >
                      {b.published ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  <form action={setPlan}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <input
                      type="hidden"
                      name="plan"
                      value={b.plan === "premium" ? "free" : "premium"}
                    />
                    <button
                      type="submit"
                      className="rounded-full border px-3 py-1.5 text-xs cursor-pointer"
                    >
                      Plan → {b.plan === "premium" ? "free" : "premium"}
                    </button>
                  </form>
                  <Link
                    href={`/negocio/${b.id}/dashboard?impersonate=true`}
                    className="rounded-full border px-3 py-1.5 text-xs"
                  >
                    Ojo
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
