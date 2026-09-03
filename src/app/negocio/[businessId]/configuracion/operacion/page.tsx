import { getBusinessHours, requireBusinessAccess } from "@/lib/business/queries";
import { OperacionSettingsForm } from "@/components/business/OperacionSettingsForm";

export default async function ConfiguracionOperacionPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { business } = await requireBusinessAccess(businessId);
  const hours = await getBusinessHours(businessId);

  return (
    <OperacionSettingsForm
      businessId={businessId}
      isOpen={business.is_open}
      prepTime={business.prep_time_minutes}
      hours={hours}
    />
  );
}
