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
      subtitle="Entrá con Google para pedir y seguir tu perfil."
      panelTitle="Pedí en San Carlos de Bolívar"
      panelBody="Card placeholder — acá va el visual / mockup del cliente."
      altHref="/negocio/login"
      altLabel="¿Tenés un local? Acceso negocio"
    />
  );
}
