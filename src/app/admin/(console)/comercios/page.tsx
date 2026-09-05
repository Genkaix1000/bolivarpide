import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin/platform";
import { listAdminBusinesses } from "@/lib/admin/queries";
import { setPlan, setPublished } from "@/lib/business/actions";
import { startImpersonationAndGo } from "@/lib/admin/impersonateActions";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";

export default async function AdminComerciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { platformRole } = await requirePlatformAdmin();
  const sp = await searchParams;
  const businesses = await listAdminBusinesses(sp.q);
  const isSuper = platformRole === "superadmin";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ShellPageHeader
        title="Comercios"
        description={`${businesses.length} resultados`}
        as="h2"
        actions={
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Nombre, slug o teléfono"
              className="rounded-xl border border-[#e8e0d6] bg-white px-3 py-2 text-[13px] font-medium outline-none focus:border-[#9a0002]/50 dark:border-[#3d3732] dark:bg-[#2a2623]"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-[#9a0002] px-4 py-2 text-[13px] font-semibold text-white"
            >
              Buscar
            </button>
          </form>
        }
      />

      <ul className="space-y-2">
        {businesses.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8e0d6] bg-white px-4 py-3 dark:border-[#3d3732] dark:bg-[#1c1917]"
          >
            <div className="min-w-0">
              <p className="font-semibold">{b.name}</p>
              <p className="text-xs text-stone-500">
                /{b.slug} · {b.plan} · {b.published ? "publicado" : "oculto"} ·{" "}
                {b.is_open ? "abierto" : "cerrado"} · {b.ordersCount} pedidos
              </p>
              {(b.ownerName || b.ownerEmail) && (
                <p className="text-[11px] text-stone-400">
                  Titular: {b.ownerName ?? "—"} {b.ownerEmail ? `· ${b.ownerEmail}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/c/${b.slug}`}
                target="_blank"
                className="rounded-full border px-3 py-1.5 text-xs"
              >
                Tienda
              </Link>
              {isSuper && (
                <>
                  <form action={setPublished}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <input type="hidden" name="published" value={b.published ? "false" : "true"} />
                    <button type="submit" className="cursor-pointer rounded-full border px-3 py-1.5 text-xs">
                      {b.published ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  <form action={setPlan}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <input
                      type="hidden"
                      name="plan"
                      value={b.plan === "free" ? "impulso" : b.plan === "impulso" ? "lider" : "free"}
                    />
                    <button type="submit" className="cursor-pointer rounded-full border px-3 py-1.5 text-xs">
                      Plan → {b.plan === "free" ? "impulso" : b.plan === "impulso" ? "lider" : "free"}
                    </button>
                  </form>
                  <form action={startImpersonationAndGo}>
                    <input type="hidden" name="businessId" value={b.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-full bg-[#9a0002] px-3 py-1.5 text-xs font-bold text-white"
                      title="Modo Escudo"
                    >
                      🛡️ Escudo
                    </button>
                  </form>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
