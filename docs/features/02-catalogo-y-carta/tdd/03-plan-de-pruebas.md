# TDD — 03: Plan de Pruebas Unitarias & Integración

> **Módulo:** `02-catalogo-y-carta`  
> **Fase:** 2  

---

## 1. Pruebas Unitarias (`__tests__/unit/products/money.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { toCents, fromCents } from '@/lib/utils/money';
import { CreateProductSchema } from '@/lib/products/schemas';

describe('TDD Products - Money & Validation', () => {
  it('debe convertir montos a centavos con precisión exacta', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(8500)).toBe(850000);
    expect(toCents(0)).toBe(0);
  });

  it('debe convertir centavos a decimal correctamente', () => {
    expect(fromCents(1999)).toBe(19.99);
    expect(fromCents(850000)).toBe(8500);
  });

  it('debe rechazar productos con precio negativo o cero', () => {
    const invalid = {
      businessId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Coca Cola',
      price: -50,
    };
    expect(CreateProductSchema.safeParse(invalid).success).toBe(false);
  });
});
```

---

## 2. Pruebas de Integración CRUD (`__tests__/integration/products/products.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('TDD Products - CRUD Operations', () => {
  it('un miembro activo del local puede crear un producto', async () => {
    const memberClient = createTestClient('staff-user-id');
    const { data, error } = await memberClient
      .from('products')
      .insert({
        business_id: 'business-1-id',
        name: 'Pizza Napolitana',
        category: 'Pizzas',
        price_cents: 950000,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Pizza Napolitana');
  });
});
```
