import { OAuthLogin } from "@/components/auth/OAuthLogin";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <OAuthLogin
      title="Acceso admin"
      subtitle="Solo cuentas con rol de plataforma."
      next={sp.next ?? "/admin"}
      error={sp.error}
    />
  );
}
