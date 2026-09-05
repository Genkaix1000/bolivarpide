import { SettingsSubnav } from "@/components/business/SettingsSubnav";

export default async function ConfiguracionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  return (
    <div className="flex w-full flex-col gap-5 pb-12 md:flex-row md:gap-8 lg:gap-10">
      <SettingsSubnav businessId={businessId} />
      <div className="min-w-0 flex-1 md:max-w-5xl">{children}</div>
    </div>
  );
}
