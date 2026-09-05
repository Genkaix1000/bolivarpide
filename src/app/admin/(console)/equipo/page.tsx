import { requirePlatformSuperadmin } from "@/lib/admin/platform";
import { listPlatformMembers } from "@/lib/admin/queries";
import { AdminEquipoView } from "@/components/admin/AdminEquipoView";

export default async function AdminEquipoPage() {
  const { user } = await requirePlatformSuperadmin();
  const members = await listPlatformMembers();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminEquipoView currentUserId={user.id} initialMembers={members} />
    </div>
  );
}

