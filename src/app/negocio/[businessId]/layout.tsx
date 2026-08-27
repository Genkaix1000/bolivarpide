import { BusinessLayout } from "@/components/business/BusinessLayout";
import { requireBusinessAccess } from "@/lib/business/queries";

export default async function BusinessScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  await requireBusinessAccess(businessId);
  return <BusinessLayout businessId={businessId}>{children}</BusinessLayout>;
}
