import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  business_name: z.string().min(2, "El nombre del negocio es requerido.").max(100),
  business_type: z.string().min(1, "El tipo de negocio es requerido."),
  restaurant_category: z.string().optional(),
  responsible_name: z.string().min(2, "El nombre del responsable es requerido.").max(100),
  whatsapp: z.string().min(8, "El WhatsApp es requerido.").max(20),
  country_code: z.string().min(1, "El código de país es requerido."),
  email: z.string().email("Ingresa un correo electrónico válido."),
  city: z.literal("San Carlos de Bolivar"),
  province: z.literal("Buenos Aires"),
  postal_code: z.literal("6550"),
  message: z.string().max(500, "El mensaje es demasiado largo.").optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "Debes autorizar el contacto para continuar.",
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Validación fallida",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { error } = await supabase.from("leads").insert({
      business_name: parsed.data.business_name,
      business_type: parsed.data.business_type,
      restaurant_category: parsed.data.restaurant_category || null,
      responsible_name: parsed.data.responsible_name,
      whatsapp: `${parsed.data.country_code} ${parsed.data.whatsapp}`,
      email: parsed.data.email,
      city: parsed.data.city,
      province: parsed.data.province,
      postal_code: parsed.data.postal_code,
      message: parsed.data.message || null,
      source: "landing_registro",
      status: "pending",
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json(
        {
          success: false,
          message: "No pudimos guardar tu solicitud. Intentá más tarde.",
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "¡Recibimos tu solicitud! Revisamos tu negocio manualmente y te contactamos por WhatsApp en 24-48 horas hábiles.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact API error:", error);
    return Response.json(
      {
        success: false,
        message: "Ocurrió un error inesperado. Intentá más tarde.",
      },
      { status: 500 }
    );
  }
}
