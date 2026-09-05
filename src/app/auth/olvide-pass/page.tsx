import { RequestPasswordReset } from "@/components/auth/RequestPasswordReset";
import { safeNextPath } from "@/lib/auth/paths";

export default async function OlvidePassPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    enviado?: string;
    error?: string;
    email?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <RequestPasswordReset
      next={safeNextPath(sp.next)}
      enviado={sp.enviado === "1"}
      error={sp.error}
      email={(sp.email ?? "").trim()}
    />
  );
}