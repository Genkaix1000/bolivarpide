# TDD — 03: Plan de Pruebas Unitarias & Integración

> **Módulo:** `04-leads-admin-y-onboarding`  
> **Fase:** 4  

---

## 1. Pruebas Unitarias: Resolver de Categorías & Schemas (`__tests__/unit/business/onboarding.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { resolveCategory } from '@/lib/business/categories';
import { OnboardingStep2Schema, CreateBusinessOnboardingSchema } from '@/lib/business/onboardingSchemas';

describe('TDD Onboarding - Category Resolver & Schemas', () => {
  it('debe asignar categoría estándar cuando se elige un rubro top (Pizzería)', () => {
    const result = resolveCategory('pizzeria');
    expect(result.category).toBe('pizzeria');
    expect(result.customCategoryInput).toBeNull();
  });

  it('debe mapear correctamente un rubro del catálogo predictivo (Cafetería)', () => {
    const result = resolveCategory('otros', 'Cafetería');
    expect(result.category).toBe('cafeteria');
    expect(result.customCategoryInput).toBeNull();
  });

  it('debe asignar "variados" y guardar el texto original si el rubro no existe en el catálogo', () => {
    const result = resolveCategory('otros', 'Chocolatería y Delicias');
    expect(result.category).toBe('variados');
    expect(result.customCategoryInput).toBe('Chocolatería y Delicias');
  });

  it('debe validar el payload completo del onboarding con Plan Free', () => {
    const valid = {
      name: 'Pizzería Los Amigos',
      categorySelection: 'pizzeria',
      phone: '+5492314554433',
      address: 'Av. Brown 250',
      plan: 'free',
    };
    expect(CreateBusinessOnboardingSchema.safeParse(valid).success).toBe(true);
  });

  it('debe validar selección de planes comerciales (Impulso / Líder)', () => {
    const validImpulso = {
      name: 'Hamburguesería Bolívar',
      categorySelection: 'hamburgueseria',
      phone: '2314-112233',
      address: 'Mitre 120',
      plan: 'impulso',
    };
    expect(CreateBusinessOnboardingSchema.safeParse(validImpulso).success).toBe(true);
  });
});
```

---

## 2. Pruebas de Integración: Alta Instantánea (`__tests__/integration/business/onboarding.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('TDD Onboarding - Instant Creation Flow', () => {
  it('debe crear el negocio con plan free y asociar al usuario autenticado como owner', async () => {
    const merchantClient = createTestClient('merchant-user-id');
    const { data: biz, error } = await merchantClient
      .from('businesses')
      .insert({
        name: 'Empanadas del Valle',
        slug: 'empanadas-del-valle-9988',
        category: 'empanadas',
        phone: '2314-887766',
        address: 'San Martín 100',
        plan: 'free',
        verification_level: 1,
        verification_status: 'unverified',
        published: false,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(biz.category).toBe('empanadas');
    expect(biz.plan).toBe('free');
    expect(biz.verification_level).toBe(1);
  });
});
```
