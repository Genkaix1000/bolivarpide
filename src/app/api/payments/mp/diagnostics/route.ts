import { NextRequest, NextResponse } from "next/server";
import { requireBusinessMember } from "@/lib/business/require-member-api";
import { getMpHealth, listRecentPaymentSessions, listRecentWebhooks, probeMpUser } from "@/lib/mercadopago/health";
import { getProvisioningStatus } from "@/lib/mercadopago/repository";
import { mpEnv } from "@/lib/mercadopago/env";

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const auth = await requireBusinessMember(businessId);
  if ("error" in auth && auth.error) return auth.error;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 25);

  try {
    const [health, status, sessions, webhooks, probe] = await Promise.all([
      getMpHealth(businessId),
      getProvisioningStatus(businessId),
      listRecentPaymentSessions(businessId, limit),
      listRecentWebhooks(limit),
      probeMpUser(businessId),
    ]);
    return NextResponse.json({
      health,
      status,
      sessions,
      webhooks,
      probe,
      webhookSecretConfigured: Boolean(mpEnv().webhookSecret),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
