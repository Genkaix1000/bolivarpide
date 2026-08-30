import { createServiceClient } from "@/lib/supabase/service";

export const DEFAULT_PAYMENT_SETTINGS = {
  offerQrPay: true,
  absorbFastPayFee: false,
};

export type BusinessPaymentSettings = typeof DEFAULT_PAYMENT_SETTINGS;

export async function getBusinessPaymentSettings(
  businessId: string,
): Promise<BusinessPaymentSettings> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("businesses")
    .select("offer_qr_pay, absorb_fast_pay_fee")
    .eq("id", businessId)
    .single();

  if (error) {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }

  return {
    offerQrPay: data.offer_qr_pay ?? true,
    absorbFastPayFee: data.absorb_fast_pay_fee ?? false,
  };
}

export async function updateBusinessPaymentSettings(
  businessId: string,
  patch: { offerQrPay?: boolean; absorbFastPayFee?: boolean },
): Promise<BusinessPaymentSettings> {
  const row: Record<string, boolean> = {};
  if (typeof patch.offerQrPay === "boolean") row.offer_qr_pay = patch.offerQrPay;
  if (typeof patch.absorbFastPayFee === "boolean") row.absorb_fast_pay_fee = patch.absorbFastPayFee;
  if (!Object.keys(row).length) {
    return getBusinessPaymentSettings(businessId);
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("businesses")
    .update(row)
    .eq("id", businessId)
    .select("offer_qr_pay, absorb_fast_pay_fee")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    offerQrPay: data.offer_qr_pay ?? true,
    absorbFastPayFee: data.absorb_fast_pay_fee ?? false,
  };
}
