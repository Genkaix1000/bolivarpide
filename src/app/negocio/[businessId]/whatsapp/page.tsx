import { WhatsAppChatView } from "@/components/business/chat/WhatsAppChatView";

export default async function WhatsAppPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return <WhatsAppChatView businessId={businessId} />;
}
