# 🍕 Fase 2: Catálogo & Carta Digital

> **Módulo:** `02-catalogo-y-carta`  
> **Fase Roadmap:** Fase 2  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Gestiona el catálogo de productos y categorías de los comercios gastronómicos (`/negocio/[businessId]/carta`), con soporte para precios exactos en centavos, toggles rápidos de disponibilidad ("Hay stock / Agotado") y subida de imágenes a Supabase Storage.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) — Historias de usuario, CRUD de productos y estados de disponibilidad.
- [02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) — Modelo de dominio y reglas de negocio.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) — Esquemas Zod y helpers de conversión de moneda (`toCents` / `fromCents`).
- [02-base-de-datos-y-storage.md](./tdd/02-base-de-datos-y-storage.md) — Tabla `products`, bucket `product-images` y políticas RLS.
- [03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) — Tests unitarios de centavos y pruebas de integración CRUD.

---

## ✅ Checklist de Cierre

- [x] Tabla `products` con constraint `price_cents >= 0` (`supabase/migrations/20260827100000_core_business_schema.sql:58`).
- [x] Bucket de Storage configurado con RLS — **nota (2026-09):** el bucket shippeado se llama `business-assets`, no `product-images`; las imágenes de producto se suben ahí (`src/lib/business/menuActions.ts:41`) y la escritura es service-only (`20260903000000_security_rls.sql:363`).
- [x] Server Actions de creación, edición y toggle de disponibilidad (`src/lib/business/menuActions.ts`).
- [x] Tests de conversión de dinero y RLS aprobados (`src/lib/business/menuOptionTypes.check.ts`, `categories.check.ts`, `planLimits.check.ts`).
