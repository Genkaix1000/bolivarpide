"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { insertNotification } from "@/lib/notifications/repository";
import {
  cuilValidate,
  DELIVERY_VEHICLES,
  DRIVER_AVAILABILITY,
  DRIVER_DOC_ALLOWED_TYPES,
  DRIVER_DOC_MAX_BYTES,
  requiredDocsForVehicle,
  type DeliveryVehicleType,
  type DriverApplicationStatus,
} from "@/lib/delivery/profile";

export type DriverApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

export type MyDriverProfileView = {
  exists: boolean;
  status?: DriverApplicationStatus;
  vehicleType?: DeliveryVehicleType;
  hasLicense?: boolean;
  rejectionReason?: string | null;
  submittedAt?: string;
};

const REJECT_MIN = 10;

function extFromMime(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

async function uploadDoc(
  svc: ReturnType<typeof createServiceClient>,
  userId: string,
  kind: "dni-front" | "dni-back" | "license",
  file: File,
): Promise<string> {
  if (!DRIVER_DOC_ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato no soportado: usá JPG, PNG, WebP o PDF.");
  }
  if (file.size > DRIVER_DOC_MAX_BYTES) {
    throw new Error("El documento debe pesar menos de 5 MB.");
  }
  const path = `${userId}/${kind}-${randomUUID().slice(0, 8)}.${extFromMime(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await svc.storage.from("kyc-documents").upload(path, bytes, {
    upsert: false,
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  return path;
}

async function removeDocs(
  svc: ReturnType<typeof createServiceClient>,
  paths: (string | null | undefined)[],
): Promise<void> {
  const clean = paths
    .filter((p): p is string => Boolean(p))
    .map((p) => p.replace(/^\//, ""));
  if (clean.length === 0) return;
  await svc.storage.from("kyc-documents").remove(clean);
}

// ---------------------------------------------------------------------------
// Postulación (del propio usuario)
// ---------------------------------------------------------------------------

export async function submitDriverApplicationAction(
  fd: FormData,
): Promise<DriverApplicationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tenés que iniciar sesión" };

  const vehicleRaw = (fd.get("vehicleType")?.toString() ?? "").trim();
  const availability = (fd.get("availability")?.toString() ?? "").trim();
  const cuil = (fd.get("cuil")?.toString() ?? "").trim();
  const dniFront = fd.get("dniFront");
  const dniBack = fd.get("dniBack");
  const license = fd.get("license");

  if (!DELIVERY_VEHICLES.includes(vehicleRaw as DeliveryVehicleType)) {
    return { ok: false, error: "Elegí un vehículo." };
  }
  if (!DRIVER_AVAILABILITY.some((a) => a.id === availability)) {
    return { ok: false, error: "Elegí una disponibilidad." };
  }
  if (!cuilValidate(cuil)) {
    return { ok: false, error: "El CUIL no es válido." };
  }
  if (!(dniFront instanceof File) || dniFront.size === 0) {
    return { ok: false, error: "Subí el frente del DNI." };
  }
  if (!(dniBack instanceof File) || dniBack.size === 0) {
    return { ok: false, error: "Subí el dorso del DNI." };
  }

  const vehicle = vehicleRaw as DeliveryVehicleType;
  const needsLicense = requiredDocsForVehicle(vehicle).includes("license");
  if (needsLicense && (!(license instanceof File) || license.size === 0)) {
    return { ok: false, error: "Subí la licencia de conducir." };
  }

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("delivery_profiles")
    .select("dni_doc_path, dni_back_doc_path, license_doc_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const uploaded: string[] = [];
  try {
    const frontPath = await uploadDoc(svc, user.id, "dni-front", dniFront);
    uploaded.push(frontPath);
    const backPath = await uploadDoc(svc, user.id, "dni-back", dniBack);
    uploaded.push(backPath);
    let licensePath: string | null = null;
    if (needsLicense) {
      licensePath = await uploadDoc(svc, user.id, "license", license as File);
      uploaded.push(licensePath);
    }

    const { error } = await svc.from("delivery_profiles").upsert(
      {
        user_id: user.id,
        vehicle_type: vehicle,
        availability,
        cuil,
        dni_doc_path: frontPath,
        dni_back_doc_path: backPath,
        license_doc_path: licensePath,
        status: "pending_review",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) {
      await removeDocs(svc, uploaded);
      return { ok: false, error: error.message };
    }

    // Reemplazo: los docs viejos ya no se usan.
    if (existing) {
      await removeDocs(svc, [
        existing.dni_doc_path,
        existing.dni_back_doc_path,
        existing.license_doc_path,
      ]);
    }

    return { ok: true };
  } catch (e) {
    await removeDocs(svc, uploaded);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo enviar la postulación.",
    };
  }
}

export async function getMyDriverProfileAction(): Promise<MyDriverProfileView | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("delivery_profiles")
    .select("status, vehicle_type, license_doc_path, rejection_reason, submitted_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return { exists: false };

  return {
    exists: true,
    status: data.status as DriverApplicationStatus,
    vehicleType: data.vehicle_type as DeliveryVehicleType,
    hasLicense: Boolean(data.license_doc_path),
    rejectionReason: data.rejection_reason,
    submittedAt: data.submitted_at,
  };
}

// ---------------------------------------------------------------------------
// Revisión (admin de plataforma)
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<{ adminId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  if (user.app_metadata?.role !== "admin") {
    return { error: "Sin permisos de administrador" };
  }
  return { adminId: user.id };
}

export async function approveDriverProfileAction(fd: FormData): Promise<void> {
  const auth = await requireAdmin();
  if ("error" in auth) throw new Error(auth.error);

  const userId = fd.get("userId")?.toString() ?? "";
  if (!userId) throw new Error("Falta userId");

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("delivery_profiles")
    .select("user_id")
.eq("user_id", userId)
    .maybeSingle();
  if (!existing) throw new Error("Postulación no encontrada");

  const now = new Date().toISOString();
  const { error } = await svc
    .from("delivery_profiles")
    .update({
      status: "approved",
      rejection_reason: null,
      reviewed_by: auth.adminId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  await svc.from("admin_audit_log").insert({
    actor_user_id: auth.adminId,
    action: "approve_driver_profile",
    target_type: "delivery_profile",
    target_id: userId,
    meta: {},
  });

  await insertNotification({
    userId,
    category: "system",
    priority: 2,
    title: "¡Sos repartidor en BolivarPide!",
    body: "Tu postulación fue aprobada.",
    emoji: "🛵",
    actionUrl: "/",
    entityType: "delivery_profile",
    entityId: userId,
    dedupeKey: `driver_review:${userId}:approved`,
  });

  revalidatePath("/admin");
}

export async function rejectDriverProfileAction(fd: FormData): Promise<void> {
  const auth = await requireAdmin();
  if ("error" in auth) throw new Error(auth.error);

  const userId = fd.get("userId")?.toString() ?? "";
  const reason = fd.get("reason")?.toString()?.trim() ?? "";
  if (!userId) throw new Error("Falta userId");
  if (reason.length < REJECT_MIN) {
    throw new Error(`Motivo mínimo ${REJECT_MIN} caracteres`);
  }

  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("delivery_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing) throw new Error("Postulación no encontrada");

  const now = new Date().toISOString();
  const { error } = await svc
    .from("delivery_profiles")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: auth.adminId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  await svc.from("admin_audit_log").insert({
    actor_user_id: auth.adminId,
    action: "reject_driver_profile",
    target_type: "delivery_profile",
    target_id: userId,
    meta: { reason },
  });

  await insertNotification({
    userId,
    category: "system",
    priority: 0,
    title: "Tu postulación de repartidor fue rechazada",
    body: reason,
    emoji: "✕",
    actionUrl: "/",
    entityType: "delivery_profile",
    entityId: userId,
    dedupeKey: `driver_review:${userId}:rejected`,
  });

  revalidatePath("/admin");
}
