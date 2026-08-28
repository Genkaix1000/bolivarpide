import { z } from "zod";
import { BOLIVAR_DEFAULTS } from "@/lib/addresses/constants";

export const addressFormSchema = z
  .object({
    street: z.string().trim().min(2, "Ingresá la calle"),
    streetNumber: z.string().trim(),
    noNumber: z.boolean(),
    deliveryNotes: z.string().trim().max(300),
    contactFirstName: z.string().trim().min(1, "Ingresá tu nombre"),
    contactLastName: z.string().trim().min(1, "Ingresá tu apellido"),
    contactPhoneLocal: z.string().trim().min(1, "Ingresá un teléfono"),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.noNumber && !data.streetNumber.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresá el número o marcá «Sin número»",
        path: ["streetNumber"],
      });
    }
    const digits = data.contactPhoneLocal.replace(/\D/g, "");
    if (digits.length < 8) {
      ctx.addIssue({
        code: "custom",
        message: "El teléfono debe tener al menos 8 dígitos",
        path: ["contactPhoneLocal"],
      });
    }
  });

export type AddressFormInput = z.infer<typeof addressFormSchema>;

export const addressDefaults = {
  city: BOLIVAR_DEFAULTS.city,
  province: BOLIVAR_DEFAULTS.province,
  postalCode: BOLIVAR_DEFAULTS.postalCode,
} as const;
