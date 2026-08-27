import { AuthSplitLogin } from "@/components/auth/AuthSplitLogin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthSplitLogin
      formSide="left"
      next={sp.next ?? "/"}
      error={sp.error}
      title="Iniciá sesión en tu cuenta"
      subtitle="Ingresá tus datos"
      altHref="/negocio/login"
      altPrefix="¿Tenés un local?"
      altLabel="Acceso negocio"
    />
  );
}
