"use server";

import { redirect } from "next/navigation";
import { endImpersonation, startImpersonation } from "@/lib/business/impersonate";

export async function startImpersonationAndGo(formData: FormData) {
  const businessId = String(formData.get("businessId") || "");
  if (!businessId) throw new Error("businessId requerido");
  await startImpersonation(businessId);
  redirect(`/negocio/${businessId}/dashboard`);
}

export async function endImpersonationAndGo() {
  await endImpersonation();
  redirect("/admin/comercios");
}
