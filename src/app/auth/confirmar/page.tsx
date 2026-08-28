import { ConfirmEmailWaiting } from "@/components/auth/ConfirmEmailWaiting";
import { safeNextPath } from "@/lib/auth/paths";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <ConfirmEmailWaiting
      email={(sp.email ?? "").trim()}
      next={safeNextPath(sp.next)}
    />
  );
}
