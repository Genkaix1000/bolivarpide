import { BusinessLayout } from "@/components/business/BusinessLayout";
import { getBusinessShellData } from "@/lib/business/queries";

export default async function BusinessScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const shell = await getBusinessShellData(businessId);
  return (
    <BusinessLayout businessId={businessId} shell={shell}>
      {children}
    </BusinessLayout>
  );
}
