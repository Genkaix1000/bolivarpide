# TDD — 01: Arquitectura Técnica & Helper de Horarios

> **Módulo:** `06-marketplace-cliente`  
> **Fase:** 6  

---

## 1. Helper Puro de Horarios (`src/lib/business/hours.ts`)

```typescript
export interface BusinessHour {
  weekday: number;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
}

export function isBusinessCurrentlyOpen(
  isOpenManual: boolean,
  hours: BusinessHour[],
  now: Date = new Date()
): boolean {
  if (!isOpenManual) return false;

  const currentDay = now.getDay();
  const todayConfig = hours.find((h) => h.weekday === currentDay);

  if (!todayConfig || todayConfig.closed) return false;
  if (!todayConfig.open_time || !todayConfig.close_time) return true;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayConfig.open_time.split(':').map(Number);
  const [closeH, closeM] = todayConfig.close_time.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}
```
