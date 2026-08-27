import { AuthSplitLogin } from "@/components/auth/AuthSplitLogin";

export default async function NegocioLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AuthSplitLogin
      formSide="right"
      next={sp.next ?? "/negocio"}
      error={sp.error}
      title="Acceso negocio"
      subtitle="Operá tu local con la misma cuenta Google."
      panelTitle="Tu comandera, lista"
      panelBody="Card placeholder — acá va el visual / mockup del panel negocio."
      altHref="/login"
      altLabel="¿Sos cliente? Iniciar sesión"
    />
  );
}
