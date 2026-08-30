# TDD — 01: Arquitectura Técnica & Contratos

> **Módulo:** `01-negocio-y-membresias`  
> **Fase:** 1  

---

## 1. Esquemas Zod (`src/lib/business/schemas.ts`)

```typescript
import { z } from 'zod';

export const UpdateBusinessProfileSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  tagline: z.string().max(100).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, 'Teléfono inválido').optional(),
  address: z.string().min(3).optional(),
  isOpen: z.boolean(),
  prepTimeMinutes: z.number().int().min(5).max(180),
});

export const RespondInvitationSchema = z.object({
  membershipId: z.string().uuid(),
  accept: z.boolean(),
});
```

---

## 2. Server Action Scoped (`src/lib/business/actions.ts`)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { UpdateBusinessProfileSchema } from './schemas';
import { revalidatePath } from 'next/cache';

export async function updateBusinessProfile(data: unknown) {
  const parsed = UpdateBusinessProfileSchema.parse(data);
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('No autorizado');

  const { data: updated, error } = await supabase
    .from('businesses')
    .update({
      name: parsed.name,
      tagline: parsed.tagline,
      phone: parsed.phone,
      address: parsed.address,
      is_open: parsed.isOpen,
      prep_time_minutes: parsed.prepTimeMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.businessId)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar local: ${error.message}`);

  revalidatePath(`/negocio/${parsed.businessId}`);
  return updated;
}
```
