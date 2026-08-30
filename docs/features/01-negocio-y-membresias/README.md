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
- [01-historias-de-usuario.md](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/sdd/01-historias-de-usuario.md) — Historias de usuario, selección de sucursal y gestión de horarios.
- [02-flujos-y-estados.md](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/sdd/02-flujos-y-estados.md) — Roles (`owner`, `staff`, `driver`), routing scoped y reglas de negocio.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/tdd/01-arquitectura-y-contratos.md) — Esquemas Zod y Server Actions de actualización scoped.
- [02-base-de-datos-y-rls.md](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/tdd/02-base-de-datos-y-rls.md) — Tablas `businesses`, `business_members`, `business_hours` y políticas RLS.
- [03-plan-de-pruebas.md](file:///home/cipher/Projects/delivery/docs/features/01-negocio-y-membresias/tdd/03-plan-de-pruebas.md) — Tests de validación Zod y pruebas de aislamiento RLS multi-tenant.

---

## ✅ Checklist de Cierre

- [ ] Tablas creadas con RLS activo en Supabase.
- [ ] Layout `/negocio/[businessId]/layout.tsx` validando membresía activa.
- [ ] Hub `/negocio/page.tsx` listando comercios asociados.
- [ ] Tests de aislamiento multi-tenant aprobados.
