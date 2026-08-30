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
- [01-historias-de-usuario.md](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/sdd/01-historias-de-usuario.md) — Invitar colaboradores, responder invitaciones y salir de un equipo.
- [02-flujos-y-estados.md](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/sdd/02-flujos-y-estados.md) — Máquina de estados de membresía y jerarquía de permisos.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/tdd/01-arquitectura-y-contratos.md) — Esquemas Zod y Server Actions de invitación/respuesta.
- [02-base-de-datos-y-rls.md](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/tdd/02-base-de-datos-y-rls.md) — Políticas RLS para responder invitaciones y ver compañeros.
- [03-plan-de-pruebas.md](file:///home/cipher/Projects/delivery/docs/features/03-equipo-e-invitaciones/tdd/03-plan-de-pruebas.md) — Tests de validación y flujo de invitaciones.

---

## ✅ Checklist de Cierre

- [ ] UI `/negocio/[businessId]/equipo` para enviar y listar invitaciones.
- [ ] Banner en `/negocio` para aceptar o rechazar invitaciones.
- [ ] Protección del último owner en base de datos.
