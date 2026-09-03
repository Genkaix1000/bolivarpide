import { redirect } from "next/navigation";

export default async function EquipoRedirectPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  redirect(`/negocio/${businessId}/configuracion/equipo`);
}
