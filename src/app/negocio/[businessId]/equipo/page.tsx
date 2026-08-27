import { createClient } from "@/lib/supabase/server";
import { requireBusinessAccess } from "@/lib/business/queries";
import { inviteMember, leaveBusiness } from "@/lib/business/actions";

export default async function EquipoPage({
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Equipo</h1>
        <p className="text-sm text-stone-600">
          Invitá staff/driver (el email debe existir en Auth).
        </p>
      </div>

      <form
        action={inviteMember}
        className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-4"
      >
        <input type="hidden" name="businessId" value={businessId} />
        <input
          name="email"
          type="email"
          required
          placeholder="email@ejemplo.com"
          className="min-w-[220px] flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
        <select name="role" className="rounded-xl border border-stone-300 px-3 py-2 text-sm">
          <option value="staff">staff</option>
          <option value="driver">driver</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-[#9a0002] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
        >
          Invitar
        </button>
      </form>

      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {(members ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {m.user_id.slice(0, 8)}… · {m.role} · {m.status}
            </span>
            {m.user_id === user.id && m.role !== "owner" ? (
              <form action={leaveBusiness}>
                <input type="hidden" name="businessId" value={businessId} />
                <button type="submit" className="text-xs text-red-700 cursor-pointer">
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
