import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/webhooks/whatsapp
 *
 * Inbound order creation from the n8n WhatsApp bot. n8n receives the Meta
 * webhook, runs the conversational flow with the customer, and upon explicit
 * confirmation POSTs the confirmed order here. The shared secret in the
 * `x-whatsapp-secret` header authenticates the caller (n8n workflow).
 */
const whatsappOrderSchema = z.object({
  businessId: z.string().uuid(),
  customerName: z.string().min(1).max(120).optional(),
  customerPhone: z.string().min(8).max(20).optional(),
  waChatId: z.string().min(1).max(20),
  deliveryAddress: z.string().min(1).max(300).optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(120),
        quantity: z.number().int().min(1).max(99),
        unitPriceCents: z.number().int().min(0).max(100_000_000),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("WhatsApp webhook: WHATSAPP_WEBHOOK_SECRET not configured");
    return Response.json({ success: false }, { status: 500 });
  }

  const provided = request.headers.get("x-whatsapp-secret");
  if (!provided || provided !== secret) {
    return Response.json({ success: false }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  const parsed = whatsappOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "Validación fallida",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { data, error } = await createServiceClient().rpc("create_order", {
    p_business_id: parsed.data.businessId,
    p_customer_name: parsed.data.customerName ?? null,
    p_customer_phone: parsed.data.customerPhone ?? null,
    p_source: "whatsapp",
    p_wa_chat_id: parsed.data.waChatId,
    p_delivery_address: parsed.data.deliveryAddress ?? null,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      product_id: item.productId ?? null,
      name: item.name,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents,
    })),
  });

  if (error) {
    console.error("WhatsApp webhook create_order error:", error);
    return Response.json({ success: false }, { status: 500 });
  }

  return Response.json({ success: true, orderId: data }, { status: 201 });
}