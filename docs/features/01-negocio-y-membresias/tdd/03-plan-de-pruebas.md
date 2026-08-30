# TDD — 03: Plan de Pruebas Unitarias & Integración

> **Módulo:** `01-negocio-y-membresias`  
> **Fase:** 1  

---

## 1. Pruebas Unitarias (`__tests__/unit/business/schemas.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { UpdateBusinessProfileSchema } from '@/lib/business/schemas';

describe('TDD Business - Validation Schemas', () => {
  it('debe validar datos correctos de actualización', () => {
    const validData = {
      businessId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Pizzería Los Amigos',
      isOpen: true,
      prepTimeMinutes: 25,
      phone: '+5492314123456',
    };
    expect(UpdateBusinessProfileSchema.safeParse(validData).success).toBe(true);
  });

  it('debe rechazar un tiempo de preparación menor a 5 minutos', () => {
    const invalidData = {
      businessId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Pizzería Los Amigos',
      isOpen: true,
      prepTimeMinutes: 2, // Menor a 5
    };
    expect(UpdateBusinessProfileSchema.safeParse(invalidData).success).toBe(false);
  });
});
```

---

## 2. Pruebas de Integración RLS (`__tests__/integration/business/rls.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('TDD Business - RLS Isolation', () => {
  it('un usuario sin membresía no puede modificar un local ajeno', async () => {
    const intruderClient = createTestClient('intruder-user-id');
    const { error } = await intruderClient
      .from('businesses')
      .update({ name: 'Hackeado' })
      .eq('id', 'business-victima-id');

    expect(error).toBeDefined();
  });

  it('un miembro con rol "owner" puede actualizar su propio local', async () => {
    const ownerClient = createTestClient('owner-user-id');
    const { data, error } = await ownerClient
      .from('businesses')
      .update({ name: 'Nombre Actualizado' })
      .eq('id', 'business-propio-id')
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Nombre Actualizado');
  });
});
```
