import { requirePlatformAdmin } from "@/lib/admin/platform";
import { listAdminBusinesses } from "@/lib/admin/queries";
import {
  listWhatsAppConnectionsAdmin,
} from "@/lib/business/whatsappQueries";
import { setWhatsAppActive } from "@/lib/business/whatsapp";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";

const SUPPORT_WA = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5492284000000";

export default async function AdminSoportePage() {
  const { platformRole } = await requirePlatformAdmin();
  const isSuper = platformRole === "superadmin";
  const [businesses, connections] = await Promise.all([
    listAdminBusinesses(),
    listWhatsAppConnectionsAdmin(),
  ]);

  const officialHref = `https://wa.me/${SUPPORT_WA.replace(/\D/g, "")}`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <ShellPageHeader
        title="Soporte WhatsApp"
        description="Contacto rápido con comercios y canal oficial"
        as="h2"
      />

      <a
        href={officialHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-[#e8e0d6] bg-gradient-to-r from-[#9a0002]/10 to-[#6b0001]/10 px-5 py-4 text-[#9a0002] transition hover:from-[#9a0002]/15 dark:border-[#3d3732]"
      >
        <MaterialSymbol icon="chat" size={28} fill />
        <div>
          <p className="font-bold">WhatsApp oficial BolivarPide</p>
          <p className="text-xs opacity-80">Abrir chat de asistencia</p>
        </div>
      </a>

      <section className="space-y-3">
        <h3 className="font-bold">Números conectados</h3>
        {connections.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500">
            Sin números vinculados.
          </p>
        ) : (
          <ul className="space-y-2">
            {connections.map((conn) => (
              <li
                key={conn.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8e0d6] bg-white px-4 py-3 dark:border-[#3d3732] dark:bg-[#1c1917]"
              >
                <div>
                  <p className="font-medium">{conn.businesses?.name ?? "Comercio"}</p>
                  <p className="text-xs text-stone-500">
                    {conn.display_phone_number ?? conn.phone_number_id} · {conn.status} ·{" "}
                    {conn.is_active ? "activo" : "inactivo"}
                  </p>
                </div>
                {isSuper && (
                  <form action={setWhatsAppActive}>
                    <input type="hidden" name="connectionId" value={conn.id} />
                    <input type="hidden" name="active" value={conn.is_active ? "false" : "true"} />
                    <button
                      type="submit"
                      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${
                        conn.is_active
                          ? "border border-stone-300"
                          : "bg-[#9a0002] font-semibold text-white"
                      }`}
                    >
                      {conn.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">Directorio de comercios</h3>
        <ul className="space-y-2">
          {businesses
            .filter((b) => b.phone || b.ownerEmail)
            .slice(0, 40)
            .map((b) => {
              const phone = (b.phone || "").replace(/\D/g, "");
              const text = encodeURIComponent(
                `Hola${b.ownerName ? ` ${b.ownerName}` : ""}, te contactamos desde el equipo de soporte de BolivarPide respecto a tu local ${b.name}…`,
              );
              const href = phone ? `https://wa.me/${phone}?text=${text}` : null;
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8e0d6] bg-white px-4 py-3 dark:border-[#3d3732] dark:bg-[#1c1917]"
                >
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-stone-500">{b.phone || b.ownerEmail}</p>
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs font-bold text-[#128C7E]"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-stone-400">Sin teléfono</span>
                  )}
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}
