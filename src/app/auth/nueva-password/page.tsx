import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export default async function NuevaPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/olvide-pass?error=link");
  }

  return <NewPasswordForm next={safeNextPath(sp.next)} />;
}