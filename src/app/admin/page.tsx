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
import {
  approveDriverProfileAction,
  rejectDriverProfileAction,
} from "@/lib/delivery/profileActions";
import { driverDisplayName } from "@/lib/delivery/queries";
import { DRIVER_AVAILABILITY, VEHICLE_LABELS } from "@/lib/delivery/profile";
import { AdminInstallButton } from "@/components/pwa/AdminInstallButton";
import {
  listWhatsAppConnectionsAdmin,
} from "@/lib/business/whatsappQueries";
import { setWhatsAppActive } from "@/lib/business/whatsapp";

type DriverProfileRow = {
  user_id: string;
  vehicle_type: string;
  status: string;
  cuil: string;
  dni_doc_path: string;
  dni_back_doc_path: string;
  license_doc_path: string | null;
  availability: string;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

async function signedUrl(svc: ReturnType<typeof createServiceClient>, path: string): Promise<string> {
  const { data } = await svc.storage
    .from("kyc-documents")
    .createSignedUrl(path.replace(/^\//, ""), 180);
  return data?.signedUrl ?? "";
}

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
  const [{ data: leads }, { data: businesses }, { count: ordersToday }, { data: driverProfiles }] =
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
      service
        .from("delivery_profiles")
        .select(
          "user_id, vehicle_type, status, cuil, dni_doc_path, dni_back_doc_path, license_doc_path, availability, rejection_reason, submitted_at, reviewed_at",
        )
        .order("submitted_at", { ascending: false })
        .limit(50),
    ]);

  const driverRows = (driverProfiles ?? []) as unknown as DriverProfileRow[];
  const driverUserIds = driverRows.map((d) => d.user_id);
  const { data: driverUsers } = driverUserIds.length
    ? await service
        .from("user_profiles")
        .select("user_id, first_name, last_name, display_name")
        .in("user_id", driverUserIds)
    : { data: [] as never[] };
  const driverName = new Map(
    ((driverUsers ?? []) as Array<{
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
    }>).map((u) => [u.user_id, driverDisplayName(u, null)] as const),
  );
  const driverSigned = await Promise.all(
    driverRows.map((d) =>
      Promise.all([
        signedUrl(service, d.dni_doc_path),
        signedUrl(service, d.dni_back_doc_path),
        d.license_doc_path ? signedUrl(service, d.license_doc_path) : Promise.resolve(""),
      ]),
    ),
  );
  const pendingDrivers = driverRows.filter((d) => d.status === "pending_review").length;

  const pendingLeads = (leads ?? []).filter((l) => l.status === "pending").length;
  const published = (businesses ?? []).filter((b) => b.published).length;
  const whatsappConnections = await listWhatsAppConnectionsAdmin();

  return (
    <main className="min-h-dvh bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Admin</h1>
            <p className="text-sm text-stone-600">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <AdminInstallButton />
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
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {[
            ["Comercios", businesses?.length ?? 0],
            ["Publicados", published],
            ["Leads pending", pendingLeads],
            ["Pedidos hoy", ordersToday ?? 0],
            ["Repartidores pending", pendingDrivers],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">WhatsApp</h2>
          {whatsappConnections.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500">
              Sin números conectados. Los comercios los vinculan desde su panel de configuración.
            </p>
          ) : (
            <ul className="space-y-2">
              {whatsappConnections.map((conn) => (
                <li
                  key={conn.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {conn.businesses?.name ?? "Comercio"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {conn.display_phone_number ?? conn.phone_number_id} ·{" "}
                      {conn.status} ·{" "}
                      {conn.is_active ? "activo" : "inactivo"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] break-all text-stone-500 max-w-[220px]">
                      phone_id: {conn.phone_number_id}
                    </code>
                    <form action={setWhatsAppActive}>
                      <input type="hidden" name="connectionId" value={conn.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={conn.is_active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1.5 text-xs cursor-pointer ${
                          conn.is_active
                            ? "border border-stone-300"
                            : "bg-[#9a0002] text-white font-semibold"
                        }`}
                      >
                        {conn.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

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
          <h2 className="font-semibold">Repartidores</h2>
          {driverRows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500">
              Sin postulaciones de repartidor todavía.
            </p>
          ) : (
            <ul className="space-y-2">
              {driverRows.map((d, idx) => {
                const signed = driverSigned[idx] ?? ["", "", ""];
                const statusColor =
                  d.status === "approved"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : d.status === "rejected"
                      ? "bg-red-500/15 text-red-600"
                      : "bg-amber-500/15 text-amber-700";
                return (
                  <li
                    key={d.user_id}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {driverName.get(d.user_id) ?? "Repartidor"}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor}`}>
                            {d.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {VEHICLE_LABELS[d.vehicle_type as keyof typeof VEHICLE_LABELS] ?? d.vehicle_type} ·{" "}
                          {DRIVER_AVAILABILITY.find((a) => a.id === d.availability)?.label ?? d.availability} ·{" "}
                          CUIL {d.cuil}
                        </p>
                        {d.rejection_reason ? (
                          <p className="mt-0.5 text-xs text-stone-500">Motivo: {d.rejection_reason}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {signed[0] ? (
                            <a href={signed[0]} target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1.5 text-xs">
                              DNI frente
                            </a>
                          ) : null}
                          {signed[1] ? (
                            <a href={signed[1]} target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1.5 text-xs">
                              DNI dorso
                            </a>
                          ) : null}
                          {d.license_doc_path && signed[2] ? (
                            <a href={signed[2]} target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1.5 text-xs">
                              Licencia
                            </a>
                          ) : null}
                        </div>
                        {d.status === "pending_review" ? (
                          <>
                            <form action={approveDriverProfileAction}>
                              <input type="hidden" name="userId" value={d.user_id} />
                              <button
                                type="submit"
                                className="rounded-full bg-[#9a0002] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                              >
                                Aprobar
                              </button>
                            </form>
                            <form action={rejectDriverProfileAction}>
                              <input type="hidden" name="userId" value={d.user_id} />
                              <input
                                type="text"
                                name="reason"
                                required
                                minLength={10}
                                placeholder="Motivo (mín 10)"
                                className="w-40 rounded-full border px-3 py-1.5 text-xs"
                              />
                              <button
                                type="submit"
                                className="rounded-full border px-3 py-1.5 text-xs cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
                      value={
                        b.plan === "free" ? "impulso" : b.plan === "impulso" ? "lider" : "free"
                      }
                    />
                    <button
                      type="submit"
                      className="rounded-full border px-3 py-1.5 text-xs cursor-pointer"
                    >
                      Plan →{" "}
                      {b.plan === "free" ? "impulso" : b.plan === "impulso" ? "lider" : "free"}
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
