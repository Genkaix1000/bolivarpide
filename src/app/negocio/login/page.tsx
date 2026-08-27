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
      subtitle="Ingresá tus datos"
      altHref="/login"
      altPrefix="¿Sos cliente?"
      altLabel="Iniciar sesión"
      lema={["Tu local,", "siempre listo"]}
    />
  );
}
