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
      subtitle="Pedí comida, seguí tus entregas y coleccioná insignias."
      panelTitle="Pedí lo mejor de Bolívar en minutos"
      panelBody="Descubrí los mejores restaurantes, hamburgueserías y cafeterías de la ciudad con entregas en tiempo real."
      altHref="/negocio/login"
      altLabel="¿Tenés un comercio? Acceso negocio"
    />
  );
}
