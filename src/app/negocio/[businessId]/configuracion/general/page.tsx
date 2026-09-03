import { requireBusinessAccess } from "@/lib/business/queries";
import { GeneralSettingsForm } from "@/components/business/GeneralSettingsForm";

export default async function ConfiguracionGeneralPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { business } = await requireBusinessAccess(businessId);

  return (
    <GeneralSettingsForm
      businessId={businessId}
      name={business.name}
      slug={business.slug}
      tagline={business.tagline}
      address={business.address}
      city={business.city}
      phone={business.phone}
      logoPath={business.logo_path}
      bannerPath={business.banner_path}
    />
  );
}
