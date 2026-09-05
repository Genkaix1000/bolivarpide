# 🏪 Fase 1: Negocios, Membresías & Hub Multi-Tenant

> **Módulo:** `01-negocio-y-membresias`  
> **Fase Roadmap:** Fase 1  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Modela el sistema multi-tenant de BolivarPide. Permite que un usuario gestione uno o más comercios, delimitando el acceso a través de rutas scoped (`/negocio/[businessId]/*`) y centralizando la selección en el Hub de Negocios (`/negocio`).

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) — Historias de usuario, selección de sucursal y gestión de horarios.
- [02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) — Roles (`owner`, `staff`, `driver`), routing scoped y reglas de negocio.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) — Esquemas Zod y Server Actions de actualización scoped.
- [02-base-de-datos-y-rls.md](./tdd/02-base-de-datos-y-rls.md) — Tablas `businesses`, `business_members`, `business_hours` y políticas RLS.
- [03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) — Tests de validación Zod y pruebas de aislamiento RLS multi-tenant.

---

## ✅ Checklist de Cierre

- [x] Tablas creadas con RLS activo en Supabase (`supabase/migrations/20260827100000_core_business_schema.sql` + `20260903000000_security_rls.sql`).
- [x] Layout `/negocio/[businessId]/layout.tsx` validando membresía activa (`src/app/negocio/[businessId]/layout.tsx`).
- [x] Hub `/negocio/page.tsx` listando comercios asociados (`src/app/negocio/page.tsx:7-67`, con `listMyMemberships` en `src/lib/business/queries.ts:456-467`).
- [x] Tests de aislamiento multi-tenant aprobados (`src/lib/business/*.check.ts`).
