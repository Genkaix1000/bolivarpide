import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { requirePlatformAdmin } from "@/lib/admin/platform";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, platformRole } = await requirePlatformAdmin();

  return (
    <div className="flex min-h-dvh bg-[#f3efe8] dark:bg-[#1c1917]">
      <AdminSidebar platformRole={platformRole} email={user.email ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title="Admin" platformRole={platformRole} />
        <main className="flex min-h-0 flex-1 flex-col px-4 py-5 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}
