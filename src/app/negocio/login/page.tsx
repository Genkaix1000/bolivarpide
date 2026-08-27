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
      subtitle="Operá tu local, gestioná comandas y controlá tu facturación."
      panelTitle="Potenciá tus ventas y comandas"
      panelBody="Administrá pedidos en tiempo real, actualizá tu carta digital y llegá a miles de clientes en Bolívar."
      altHref="/login"
      altLabel="¿Sos cliente? Iniciar sesión"
    />
  );
}
