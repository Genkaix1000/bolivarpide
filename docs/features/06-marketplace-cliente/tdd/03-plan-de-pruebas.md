# TDD — 03: Plan de Pruebas Unitarias

> **Módulo:** `06-marketplace-cliente`  
> **Fase:** 6  

---

## 1. Pruebas Unitarias (`__tests__/unit/business/hours.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { isBusinessCurrentlyOpen, type BusinessHour } from '@/lib/business/hours';

describe('TDD Business - Horarios de Atención', () => {
  const sampleHours: BusinessHour[] = [
    { weekday: 1, open_time: '19:00:00', close_time: '23:30:00', closed: false }, // Lunes
    { weekday: 2, open_time: '19:00:00', close_time: '23:30:00', closed: true },  // Martes cerrado
  ];

  it('devuelve false si el switch manual está apagado', () => {
    const monday20hs = new Date('2026-08-31T20:00:00'); // Lunes 20:00
    expect(isBusinessCurrentlyOpen(false, sampleHours, monday20hs)).toBe(false);
  });

  it('devuelve true si está dentro del horario y switch prendido', () => {
    const monday20hs = new Date('2026-08-31T20:00:00'); // Lunes 20:00
    expect(isBusinessCurrentlyOpen(true, sampleHours, monday20hs)).toBe(true);
  });

  it('devuelve false si el día está marcado como closed', () => {
    const tuesday20hs = new Date('2026-09-01T20:00:00'); // Martes 20:00
    expect(isBusinessCurrentlyOpen(true, sampleHours, tuesday20hs)).toBe(false);
  });
});
```
