import { requireBusinessAccess } from "@/lib/business/queries";
import { getChatDetail, listChatSummaries } from "@/lib/business/chatQueries";
import { listProductsSafe } from "@/lib/business/menuQueries";
import { getWhatsAppConnection } from "@/lib/business/whatsappQueries";
import { WhatsAppChatView } from "@/components/business/chat/WhatsAppChatView";

type ChatProduct = {
  id: string;
  name: string;
  price_cents: number;
  available: boolean | null;
  description?: string | null;
  image_path?: string | null;
};

export default async function WhatsAppPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { business } = await requireBusinessAccess(businessId);

  const [summaries, products, connection] = await Promise.all([
    listChatSummaries(businessId).catch(() => []),
    listProductsSafe(businessId).catch(() => [] as ChatProduct[]),
    getWhatsAppConnection(businessId),
  ]);

  // Sólo el detalle del primer chat: el resto se carga al seleccionarlo.
  const firstChatId = summaries[0]?.id;
  const initialDetail = firstChatId
    ? await getChatDetail(businessId, firstChatId).catch(() => null)
    : null;

  return (
    <WhatsAppChatView
      businessId={businessId}
      businessName={business.name}
      initialSummaries={summaries}
      initialConversation={initialDetail?.conversation ?? null}
      initialCursor={initialDetail?.nextCursor ?? null}
      products={products as ChatProduct[]}
      whatsappConnected={connection?.status === "connected" && connection.is_active === true}
    />
  );
}