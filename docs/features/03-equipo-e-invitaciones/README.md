# 👥 Fase 3: Equipo, Invitaciones & Staff

> **Módulo:** `03-equipo-e-invitaciones`  
> **Fase Roadmap:** Fase 3  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Permite a los propietarios (`owner`) delegar tareas y sumar miembros a su equipo (`staff`, `driver`), gestionar el ciclo de vida de las invitaciones y regular la baja voluntaria o revocación de accesos.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) — Invitar colaboradores, responder invitaciones y salir de un equipo.
- [02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) — Máquina de estados de membresía y jerarquía de permisos.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) — Esquemas Zod y Server Actions de invitación/respuesta.
- [02-base-de-datos-y-rls.md](./tdd/02-base-de-datos-y-rls.md) — Políticas RLS para responder invitaciones y ver compañeros.
- [03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) — Tests de validación y flujo de invitaciones.

---

## ✅ Checklist de Cierre

- [x] UI para enviar y listar invitaciones — **nota (2026-09):** la ruta shippeada es `/negocio/[businessId]/configuracion/equipo`, no `/negocio/[businessId]/equipo` (`src/app/negocio/[businessId]/configuracion/equipo/page.tsx` + `src/components/business/settings/TabEquipo.tsx`).
- [x] Banner en `/negocio` para aceptar o rechazar invitaciones (`src/app/negocio/page.tsx:19-64`, con `respondInvite` en `src/lib/business/actions.ts:275-290`).
- [x] Protección del último owner en base de datos (`src/lib/business/actions.ts:300` y `:324`).
