# Hito 01 — Conectar el repartidor aprobado con la operación

## Objetivo

Que un repartidor aprobado por la plataforma (con KYC + CUIL, `delivery_profiles.status='approved'`)
**pueda ser contratado** por un negocio y aparezca en el panel de Reparto para recibir asignaciones.

## Problema

Hoy conviven dos mundos desconectados:

- **Equipo interno**: `business_members` con `role='driver'` invitado desde Configuración → Equipo;
  es la única fuente de `listActiveDrivers` (`src/lib/delivery/queries.ts`) que alimenta el despacho.
- **Enrutador aprobado**: `delivery_profiles` (feature `08-onboarding-repartidor`) queda como un
  ledger sin uso operativo — solo lo consulta el admin.

Un negocio no tiene forma de ver (ni contratar) a los repartidores aprobados de Bolívar, aunque el
producto pidió explícitamente el onboarding para eso.

## Alcance

**In v1**
- Query `listHirableDrivers(businessId)`: `delivery_profiles` con `status='approved'` que **no** son
  ya miembros activos de ese negocio.
- Acción `hireApprovedDriverAction` (owner/staff): crea `business_members` con `role='driver'` y
  `status='invited'` + **notificación push** al repartidor ("Un negocio quiere contratarte").
- Flujo de consentimiento: el repartidor acepta desde el hub (`respondInvite`, ya existe en `/negocio`).
- UI en **DispatchView** (`src/components/delivery/DispatchView.tsx`): estado vacío de
  "Repartidores" con botón "Contratar repartidor de Bolívar" → select de candidatos aprobados.
- Protección: no listar/contratar quien ya es miembro; `requireBusinessAccess` + `isDeliveryManager`
  (owner/staff).

**Out (v2 posibles)**
- Que el repartidor se postule a un negocio (volunteering inverso).
- Borrado/libre de contrato (sólo "quitar" del equipo saldrá por Equipo o member left).

## Decisiones a resolver en implementación

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Consentimiento | (a) invited + aceptar en hub; (b) agregado directo `active` | **(a)**: reutiliza `respondInvite` y respeta que la persona decida |
| Fuente de nombres | `user_profiles` (como admin) | `driverDisplayName` existente |
| Si ya es miembro (owner/staff) de otro negocio | permitir múltiples membresías (el modelo ya lo permite) | permitir, con dedupe por `(business_id, user_id)` |

## Tareas

### Fase A — Dominio y acciones
- [x] `src/lib/delivery/queries.ts`: `listHirableDrivers(businessId)` (approved + not member + select
      de perfil para nombre/vehículo).
- [x] `src/lib/delivery/actions.ts`: `hireApprovedDriverAction` con
      `requireBusinessAccess` + rol manager; upsert `business_members` `invited` +
      `insertNotification` (dedupe `driver_hire:<businessId>:<userId>`); `revalidatePath`.
- [x] API GET `/api/orders/hirable` (manager-gated, mismo patrón que `dispatch`).

### Fase B — UI
- [x] `DispatchView`: estado vacío de "Repartidores" → CTA "Contratar repartidor de Bolívar".
- [x] `HireDriverModal.tsx`: selector de candidatos + confirmación (`useTransition`, `flashToast`).

### Fase C — Verificación
- [x] `pnpm test` (35/35) + `tsc --noEmit` (0) + `lint` (0 errores).
- [ ] QA manual (contratar → aceptar en hub → aparece en `listActiveDrivers` y recibe asignaciones).
- [ ] Spec `docs/features/09-contratar-repartidor/` con sdd/tdd al cierre (opcional, como feature 08).

## Referencias en el código

- `src/lib/delivery/queries.ts` → `listActiveDrivers` / `listDispatchQueue`
- `src/lib/business/actions.ts` → `inviteMember` / `respondInvite` (`/negocio/page.tsx`)
- `src/lib/business/queries.ts` → `listMyMemberships`
- `src/lib/delivery/profileActions.ts` → `delivery_profiles`