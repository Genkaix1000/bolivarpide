import { requireBusinessAccess } from "@/lib/business/queries";
import { listChatConversations } from "@/lib/business/chatQueries";
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

  const [conversations, products, connection] = await Promise.all([
    listChatConversations(businessId).catch(() => [] as never[]),
    listProductsSafe(businessId).catch(() => [] as ChatProduct[]),
    getWhatsAppConnection(businessId),
  ]);

  return (
    <WhatsAppChatView
      businessId={businessId}
      businessName={business.name}
      initialConversations={conversations}
      products={products as ChatProduct[]}
      whatsappConnected={connection?.status === "connected" && connection.is_active === true}
    />
  );
}