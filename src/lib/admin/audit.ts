import { createServiceClient } from "@/lib/supabase/service";

export type AuditAction =
  | "impersonate_start"
  | "impersonate_end"
  | "approve_lead"
  | "reject_lead"
  | "set_published"
  | "set_plan"
  | "platform_role_assign"
  | "platform_role_change"
  | "platform_role_revoke"
  | "whatsapp_set_active"
  | "business_update_admin";

export async function writeAdminAudit(input: {
  actorUserId: string;
  action: AuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const service = createServiceClient();
  await service.from("admin_audit_log").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    meta: input.meta ?? {},
  });
}
