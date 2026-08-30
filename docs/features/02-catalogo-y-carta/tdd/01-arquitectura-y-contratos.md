# TDD — 01: Arquitectura Técnica, Zod & Moneda

> **Módulo:** `02-catalogo-y-carta`  
> **Fase:** 2  

---

## 1. Esquemas Zod (`src/lib/products/schemas.ts`)

```typescript
import { z } from 'zod';

export const CreateProductSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1, 'Debe seleccionar o indicar una categoría').default('General'),
  price: z.number().positive('El precio debe ser mayor a 0'), // Pesos decimales
  available: z.boolean().default(true),
  imagePath: z.string().optional(),
});

export const ToggleAvailabilitySchema = z.object({
  productId: z.string().uuid(),
  businessId: z.string().uuid(),
  available: z.boolean(),
});
```

---

## 2. Helpers de Moneda (`src/lib/utils/money.ts`)

```typescript
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
```
