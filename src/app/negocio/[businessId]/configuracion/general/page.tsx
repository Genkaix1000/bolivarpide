import { requireBusinessAccess } from "@/lib/business/queries";
import { GeneralSettingsForm } from "@/components/business/GeneralSettingsForm";
import { DangerZone } from "@/components/business/settings/DangerZone";

export default async function ConfiguracionGeneralPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { business, member } = await requireBusinessAccess(businessId);
  const isOwner = member?.role === "owner";

  return (
    <div className="space-y-8">
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

      <DangerZone
        businessId={businessId}
        businessName={business.name}
        isOwner={isOwner}
      />
    </div>
  );
}
