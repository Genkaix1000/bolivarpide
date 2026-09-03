import { requireBusinessAccess } from "@/lib/business/queries";
import { inviteMember, leaveBusiness } from "@/lib/business/actions";

export default async function ConfiguracionEquipoPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { supabase, user } = await requireBusinessAccess(businessId);
  const { data: members } = await supabase
    .from("business_members")
    .select("id, role, status, user_id, invited_at")
    .eq("business_id", businessId)
    .order("created_at");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Equipo</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Invitá staff o drivers (el email debe existir en Auth).
        </p>
      </div>

      <form
        action={inviteMember}
        className="flex flex-wrap gap-2 rounded-[20px] border border-gray-100 bg-white p-5 dark:border-[#3d3732] dark:bg-[#1c1917] penpot-shadow"
      >
        <input type="hidden" name="businessId" value={businessId} />
        <input
          name="email"
          type="email"
          required
          placeholder="email@ejemplo.com"
          className="min-w-[220px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100"
        />
        <select
          name="role"
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-[#3d3732] dark:bg-[#231f1c] dark:text-gray-100"
        >
          <option value="staff">staff</option>
          <option value="driver">driver</option>
        </select>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-[#9a0002] px-4 py-2 text-sm font-semibold text-white hover:bg-[#850002]"
        >
          Invitar
        </button>
      </form>

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-[20px] border border-gray-100 bg-white dark:divide-[#3d3732] dark:border-[#3d3732] dark:bg-[#1c1917] penpot-shadow">
        {(members ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="text-gray-800 dark:text-gray-200">
              {m.user_id.slice(0, 8)}… · {m.role} · {m.status}
            </span>
            {m.user_id === user.id && m.role !== "owner" ? (
              <form action={leaveBusiness}>
                <input type="hidden" name="businessId" value={businessId} />
                <button type="submit" className="cursor-pointer text-xs font-medium text-red-700">
                  Salir del equipo
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
