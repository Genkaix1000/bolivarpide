import { z } from "zod";

export const OnboardingStep2Schema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(40),
  categorySelection: z.string().min(1, "Seleccioná un rubro"),
  customCategoryInput: z.string().trim().max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{8,20}$/, "Teléfono / WhatsApp inválido"),
  address: z.string().trim().min(3, "Ingresá la calle y número"),
});

export const OnboardingStep3Schema = z.object({
  plan: z.enum(["free", "impulso", "lider"]).default("free"),
});

export const CreateBusinessOnboardingSchema = OnboardingStep2Schema.merge(
  OnboardingStep3Schema,
);

export type CreateBusinessOnboardingInput = z.infer<
  typeof CreateBusinessOnboardingSchema
>;
