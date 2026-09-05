"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformSuperadmin } from "@/lib/admin/platform";
import { writeAdminAudit } from "@/lib/admin/audit";
import type { PlatformRole } from "@/lib/admin/platform";

export async function assignPlatformRole(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") || "") as PlatformRole;
  if (!email || !["superadmin", "soporte"].includes(role)) throw new Error("Datos inválidos");

  const { user, service } = await requirePlatformSuperadmin();
  const { data: listed } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
  const target = listed.users.find((u) => u.email?.toLowerCase() === email);
  if (!target) throw new Error("Usuario no encontrado. Debe haber iniciado sesión al menos una vez.");

  const { data: existing } = await service
    .from("platform_users")
    .select("role")
    .eq("user_id", target.id)
    .maybeSingle();

  await service.from("platform_users").upsert({
    user_id: target.id,
    role,
    assigned_by: user.id,
    updated_at: new Date().toISOString(),
  });

  await service.auth.admin.updateUserById(target.id, {
    app_metadata: {
      ...target.app_metadata,
      role: "admin",
      platform_role: role,
    },
  });

  await writeAdminAudit({
    actorUserId: user.id,
    action: existing ? "platform_role_change" : "platform_role_assign",
    targetType: "user",
    targetId: target.id,
    meta: existing
      ? { from: existing.role, to: role, email }
      : { role, email },
  });

  revalidatePath("/admin/equipo");
  revalidatePath("/admin/auditoria");
}

export async function revokePlatformRole(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  if (!userId) throw new Error("Datos inválidos");

  const { user, service } = await requirePlatformSuperadmin();
  if (userId === user.id) throw new Error("No podés revocarte a vos mismo.");

  const { count } = await service
    .from("platform_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "superadmin");
  const { data: targetRow } = await service
    .from("platform_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!targetRow) throw new Error("No es miembro de plataforma");
  if (targetRow.role === "superadmin" && (count ?? 0) <= 1) {
    throw new Error("No se puede revocar al último superadmin.");
  }

  const { data: targetUser } = await service.auth.admin.getUserById(userId);
  await service.from("platform_users").delete().eq("user_id", userId);
  if (targetUser.user) {
    const meta = { ...targetUser.user.app_metadata };
    delete meta.platform_role;
    delete meta.role;
    await service.auth.admin.updateUserById(userId, { app_metadata: meta });
  }

  await writeAdminAudit({
    actorUserId: user.id,
    action: "platform_role_revoke",
    targetType: "user",
    targetId: userId,
    meta: {
      previous_role: targetRow.role,
      email: targetUser.user?.email ?? null,
    },
  });

  revalidatePath("/admin/equipo");
  revalidatePath("/admin/auditoria");
}

export async function changePlatformRole(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as PlatformRole;
  if (!userId || !["superadmin", "soporte"].includes(role)) throw new Error("Datos inválidos");

  const { user, service } = await requirePlatformSuperadmin();
  const { data: existing } = await service
    .from("platform_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing) throw new Error("No es miembro de plataforma");

  if (existing.role === "superadmin" && role !== "superadmin") {
    if (userId === user.id) throw new Error("No podés auto-degradarte.");
    const { count } = await service
      .from("platform_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "superadmin");
    if ((count ?? 0) <= 1) throw new Error("No se puede degradar al último superadmin.");
  }

  await service
    .from("platform_users")
    .update({ role, updated_at: new Date().toISOString(), assigned_by: user.id })
    .eq("user_id", userId);

  const { data: targetUser } = await service.auth.admin.getUserById(userId);
  if (targetUser.user) {
    await service.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...targetUser.user.app_metadata,
        role: "admin",
        platform_role: role,
      },
    });
  }

  await writeAdminAudit({
    actorUserId: user.id,
    action: "platform_role_change",
    targetType: "user",
    targetId: userId,
    meta: { from: existing.role, to: role, email: targetUser.user?.email ?? null },
  });

  revalidatePath("/admin/equipo");
  revalidatePath("/admin/auditoria");
}
