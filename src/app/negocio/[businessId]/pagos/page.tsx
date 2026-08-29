import { Suspense } from "react";
import { requireBusinessAccess } from "@/lib/business/queries";
import { PagosSection } from "@/components/business/PagosSection";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export default async function PagosPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  await requireBusinessAccess(businessId);

  return (
    <div className="max-w-3xl mx-auto">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <MaterialSymbol icon="progress_activity" size={32} className="animate-spin text-gray-400" />
          </div>
        }
      >
        <PagosSection businessId={businessId} />
      </Suspense>
    </div>
  );
}
