# 🛍️ Fase 6: Marketplace Cliente & Feed de Locales

> **Módulo:** `06-marketplace-cliente`  
> **Fase Roadmap:** Fase 6  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Superficie pública del marketplace (`/`). Muestra los comercios locales publicados (`published = true`), filtra comercios abiertos/cerrados según su horario comercial, y renderiza la carta pública en `/c/[slug]`.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) — Feed público y navegación de la carta digital.
- [02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) — Filtros de visibilidad y reglas de horarios.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) — Helper puro `isBusinessCurrentlyOpen` y data fetching.
- [02-base-de-datos-y-queries.md](./tdd/02-base-de-datos-y-queries.md) — Query de comercios publicados con JOIN a `business_hours`.
- [03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) — Tests unitarios de cálculo de horarios de atención.

---

## ✅ Checklist de Cierre

- [x] Feed en `/` consumiendo datos de DB (`published = true`) — `src/lib/business/homeData.ts:39-139`, `src/app/page.tsx` con ISR de 60s.
- [ ] Función de horarios testeada con horarios partidos — **nota (2026-09):** el helper shippeado se llama `isOpenByHours` (`src/lib/business/hours.ts:51`), no `isBusinessCurrentlyOpen`, y **queda pendiente**: no tiene `*.check.ts` propio, evalúa una sola franja por día (sin horarios partidos) y lleva un `ponytail:` en la línea 1 avisando que no cruza medianoche. El abierto/cerrado que hoy muestra el feed sale del flag manual `businesses.is_open` (mapeo cubierto por `src/lib/business/home.check.ts`).
- [x] Vista SSR `/c/[slug]` renderizando carta de productos (`src/app/c/[slug]/page.tsx:16-83`).
