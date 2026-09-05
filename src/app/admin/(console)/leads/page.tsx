import { requirePlatformAdmin } from "@/lib/admin/platform";
import { createServiceClient } from "@/lib/supabase/service";
import { approveLead, rejectLead } from "@/lib/business/actions";
import { ShellPageHeader } from "@/components/shell/ShellPageHeader";

export default async function AdminLeadsPage() {
  const { platformRole } = await requirePlatformAdmin();
  const service = createServiceClient();
  const { data: leads } = await service
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const isSuper = platformRole === "superadmin";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <ShellPageHeader
        title="Leads"
        description="Onboarding de nuevos comercios"
        as="h2"
      />
      <ul className="space-y-2">
        {(leads ?? []).map((lead) => (
          <li
            key={lead.id}
            className="rounded-2xl border border-[#e8e0d6] bg-white px-4 py-3 dark:border-[#3d3732] dark:bg-[#1c1917]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{lead.business_name}</p>
                <p className="text-xs text-stone-500">
                  {lead.email} · {lead.status}
                </p>
              </div>
              {lead.status === "pending" && isSuper ? (
                <div className="flex gap-2">
                  <form action={approveLead}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-full bg-[#9a0002] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Aprobar
                    </button>
                  </form>
                  <form action={rejectLead}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <button type="submit" className="cursor-pointer rounded-full border px-3 py-1.5 text-xs">
                      Rechazar
                    </button>
                  </form>
                </div>
              ) : lead.claim_token ? (
                <code className="break-all text-[10px] text-stone-600">
                  /negocio/onboarding?claim={lead.claim_token}
                </code>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
