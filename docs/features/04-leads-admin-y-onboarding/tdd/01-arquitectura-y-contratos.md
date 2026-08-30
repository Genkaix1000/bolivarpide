# TDD — 01: Arquitectura Técnica, Zod & Server Actions

> **Módulo:** `04-leads-admin-y-onboarding`  
> **Fase:** 4  

---

## 1. Taxonomía de Categorías & Resolver (`src/lib/business/categories.ts`)

```typescript
export const TOP_CATEGORIES = [
  { id: 'pizzeria', label: 'Pizzería', icon: 'local_pizza' },
  { id: 'hamburgueseria', label: 'Hamburguesería', icon: 'restaurant_menu' },
  { id: 'empanadas', label: 'Empanadas', icon: 'dumpling' },
  { id: 'heladeria', label: 'Helados', icon: 'icecream' },
] as const;

export const KNOWN_CATEGORIES = [
  ...TOP_CATEGORIES,
  { id: 'cafeteria', label: 'Cafetería', icon: 'local_cafe' },
  { id: 'farmacia', label: 'Farmacia', icon: 'medication' },
  { id: 'kiosco', label: 'Kiosco', icon: 'storefront' },
  { id: 'almacen', label: 'Almacén', icon: 'shopping_cart' },
  { id: 'sushi', label: 'Sushi', icon: 'set_menu' },
  { id: 'asado', label: 'Parrilla / Asado', icon: 'barbecue' },
  { id: 'pastas', label: 'Pastas / Italiana', icon: 'dinner' },
  { id: 'panaderia', label: 'Panadería', icon: 'bakery_dining' },
  { id: 'rotiseria', label: 'Rotisería', icon: 'lunch' },
] as const;

export function resolveCategory(rawSelection: string, customInput?: string) {
  const normalizedCustom = customInput?.trim().toLowerCase();

  // Si seleccionó uno de los conocidos
  const match = KNOWN_CATEGORIES.find(
    (c) => c.id === rawSelection || (normalizedCustom && c.label.toLowerCase() === normalizedCustom)
  );

  if (match) {
    return {
      category: match.id,
      customCategoryInput: null,
    };
  }

  // Fallback inteligente
  return {
    category: 'variados',
    customCategoryInput: customInput?.trim() || 'Otros',
  };
}
```

---

## 2. Esquemas Zod del Wizard (`src/lib/business/onboardingSchemas.ts`)

```typescript
import { z } from 'zod';

export const OnboardingStep2Schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  categorySelection: z.string().min(1, 'Selecciona un rubro'),
  customCategoryInput: z.string().max(80).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, 'Teléfono / WhatsApp inválido'),
  address: z.string().min(3, 'Ingresa una dirección válida').default('San Carlos de Bolívar'),
});

export const OnboardingStep3Schema = z.object({
  plan: z.enum(['free', 'impulso', 'lider']).default('free'),
});

export const CreateBusinessOnboardingSchema = OnboardingStep2Schema.merge(OnboardingStep3Schema);
export type CreateBusinessOnboardingInput = z.infer<typeof CreateBusinessOnboardingSchema>;
```

---

## 3. Server Action: Alta desde Onboarding (`src/lib/business/onboardingActions.ts`)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { CreateBusinessOnboardingSchema } from './onboardingSchemas';
import { resolveCategory } from './categories';
import { revalidatePath } from 'next/cache';

export async function createBusinessFromOnboarding(input: unknown) {
  const parsed = CreateBusinessOnboardingSchema.parse(input);
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Debe iniciar sesión para completar el registro');
  }

  // 1. Resolver taxonomía
  const { category, customCategoryInput } = resolveCategory(
    parsed.categorySelection,
    parsed.customCategoryInput
  );

  // 2. Generar slug seguro
  const slugBase = parsed.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  // 3. Insertar negocio
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      name: parsed.name,
      slug,
      category,
      custom_category_input: customCategoryInput,
      phone: parsed.phone,
      address: parsed.address,
      plan: parsed.plan,
      is_open: false,
      published: false,
      verification_level: 1,
      verification_status: 'unverified',
    })
    .select()
    .single();

  if (bizError || !business) {
    throw new Error(`Error al dar de alta el comercio: ${bizError?.message}`);
  }

  // 4. Asignar al usuario como owner activo
  const { error: memberError } = await supabase
    .from('business_members')
    .insert({
      business_id: business.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      responded_at: new Date().toISOString(),
    });

  if (memberError) {
    throw new Error(`Error al asignar titularidad: ${memberError.message}`);
  }

  revalidatePath('/negocio');
  return { success: true, businessId: business.id, slug: business.slug };
}
```
