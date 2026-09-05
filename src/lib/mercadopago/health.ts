import { createServiceClient } from "@/lib/supabase/service";
import { getAccessTokenForBusiness, getConnection, getProvisioningStatus } from "@/lib/mercadopago/repository";
import { mpEnv } from "@/lib/mercadopago/env";
import { mpFetch } from "@/lib/mercadopago/mp-fetch";

export type MpHealthCheck = { ok: boolean | null; detail: string; action?: string };

export type MpHealth = {
  checks: {
    oauthLinked: MpHealthCheck;
    refreshToken: MpHealthCheck;
    storeProvisioned: MpHealthCheck;
    posProvisioned: MpHealthCheck;
    mpReady: MpHealthCheck;
    tokenExpires: MpHealthCheck;
  };
  blocking: boolean;
  checkedAt: string;
};

export async function getMpHealth(businessId: string): Promise<MpHealth> {
  const status = await getProvisioningStatus(businessId);
  const { webhookSecret } = mpEnv();

  const tokenExpires: MpHealthCheck = { ok: null, detail: "Sin vencimiento registrado" };
  if (status.expiresAt) {
    const ms = new Date(status.expiresAt).getTime() - Date.now();
    if (ms < 0) tokenExpires.ok = false;
    else if (ms < 5 * 86400000) tokenExpires.ok = false;
    else tokenExpires.ok = true;
    tokenExpires.detail =
      ms < 0
        ? "Access token vencido — se refrescará al cobrar"
        : `Vence ${new Date(status.expiresAt).toLocaleDateString("es-AR")}`;
  }

  const checks: MpHealth["checks"] = {
    oauthLinked: {
      ok: status.linked,
      detail: status.linked ? "Cuenta MP vinculada (app bolivarpide)" : "Sin vincular OAuth",
      action: status.linked ? undefined : "Usá «Vincular Mercado Pago»",
    },
    refreshToken: {
      ok: status.linked ? true : null,
      detail: status.linked ? "Refresh token presente" : "—",
    },
    storeProvisioned: {
      ok: status.store ? true : false,
      detail: status.store ? `Sucursal ${status.store.name}` : "Falta crear sucursal en MP",
      action: status.store ? undefined : "Re-asociar sucursal y caja",
    },
    posProvisioned: {
      ok: status.pos ? true : false,
      detail: status.pos ? `Caja ${status.pos.externalPosId}` : "Falta caja PDV en MP",
      action: status.pos ? undefined : "Re-asociar sucursal y caja",
    },
    mpReady: {
      ok: status.mpReady,
      detail: status.mpReady
        ? "Checkout QR habilitado"
        : !status.store
          ? "Falta sucursal MP"
          : !status.pos
            ? "Falta caja MP (sucursal ok)"
            : "Configurando automáticamente…",
    },
    tokenExpires,
  };

  if (status.isOrphan) {
    checks.posProvisioned = {
      ok: false,
      detail: "Caja huérfana — cuenta MP cambió",
      action: "Re-asociar sucursal y caja",
    };
  }

  const blocking = !status.mpReady || !status.linked || status.isOrphan;

  // Probe token if linked
  if (status.linked) {
    try {
      await getAccessTokenForBusiness(businessId);
      checks.refreshToken.ok = true;
    } catch {
      checks.refreshToken.ok = false;
      checks.refreshToken.detail = "No se pudo refrescar el token";
      checks.refreshToken.action = "Re-vincular Mercado Pago";
    }
  }

  if (!webhookSecret) {
    checks.mpReady.detail += " · MP_WEBHOOK_SECRET no configurado en servidor";
  }

  return { checks, blocking, checkedAt: new Date().toISOString() };
}

export async function listRecentPaymentSessions(businessId: string, limit = 10) {
  const svc = createServiceClient();
  const { data } = await svc
    .from("payment_sessions")
    .select("id, mp_order_id, amount_cents, status, channel, created_at, expires_at, payment_id")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listRecentWebhooks(businessId: string, limit = 10) {
  const svc = createServiceClient();
  const { data } = await svc
    .from("mp_webhook_events")
    .select("id, x_request_id, data_id, event_type, processed, attempts, last_error, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function probeMpUser(businessId: string) {
  const conn = await getConnection(businessId);
  if (!conn) return { ok: false, message: "Sin conexión" };
  try {
    const token = await getAccessTokenForBusiness(businessId);
    const me = await mpFetch<{ id?: number; nickname?: string }>(token, "/users/me", { method: "GET" });
    return { ok: true, message: `Token válido · user ${me.id ?? conn.mp_user_id}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error" };
  }
}
