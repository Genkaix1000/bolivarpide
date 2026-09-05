# 08 — Onboarding de Repartidor (con documentación)

> Postulación real: vehículo, DNI (frente + dorso), licencia si aplica, CUIL para facturar. Revisión por admin.

## Resumen

Reemplaza el `DriverApplicationModal` actual (que solo abría WhatsApp) por un onboarding **persistido** con subida de documentación a un bucket privado y revisión del admin de plataforma.

| Cara | Qué cambia |
|------|------------|
| **Cliente** | Mi Perfil → Centro de ayuda → "Ser repartidor": floodlight de vehículo, docs dinámicos y CUIL; estado visible (en revisión/aprobado/rechazado) |
| **Admin** | Sección "Repartidores": pendientes, preview de docs (signed URL privada), aprobar/rechazar con motivo |
| **Backend** | `delivery_profiles` (1:1 user), bucket `kyc-documents` privado (write service-only), validación CUIL módulo 11 |
| **Notificaciones** | Push al usuario al aprobar/rechazar su postulación |

## Decisiones de producto

- **Revisión por admin**: `pending_review → approved | rejected` (+ motivo) con `admin_audit_log`.
- **DNI frente + dorso**: dos fotos siempre (`dni_doc_path`, `dni_back_doc_path`).
- **Matriz por vehículo** (`bicycle|motorcycle|car|on_foot`):
  - `bicycle` y `on_foot` → DNI frente + dorso (sin licencia)
  - `motorcycle` y `car` → DNI frente + dorso + `license_doc_path`
- **CUIL** siempre obligatorio, validado **módulo 11** (`cuilValidate`).
- **CUIL es dato sensible**: `delivery_profiles` con RLS SELECT propio/admin; bucket privado; preview solo vía signed URL.

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Este documento (plan/checklist vivo) |
| `sdd/` (pendiente) | HU y flujos al cierre |
| `tdd/01` (pendiente) | Contratos TS/actions al cierre |
| `tdd/02` (pendiente) | Migración, storage, RLS al cierre |
| `tdd/03` (pendiente) | Matriz de pruebas al cierre |

## Checklist de implementación

### Fase 1 — Fundamento de datos
- [x] Migración `20260907000000_delivery_profiles.sql` (tabla + bucket `kyc-documents` privado + RLS) aplicada y verificada en DB real
- [x] `src/lib/delivery/profile.ts`: `cuilValidate` (mod 11) + `requiredDocsForVehicle` + labels/íconos
- [x] `profile.check.ts` (patrón ponytail) — `pnpm test` 35/35

### Fase 2 — Acciones y storage
- [x] `src/lib/delivery/profileActions.ts` (`submitDriverApplicationAction`, `approve/reject` vía FormData, `getMyDriverProfileAction`)
- [x] Preview de docs: signed URLs generadas **en el panel admin** (bucket privado, sin endpoints públicos)

### Fase 3 — Onboarding UI
- [x] `DriverApplicationModal` convertido en onboarding multipaso (vehículo → docs con preview → CUIL → enviado)
- [x] Entry point state-aware en `ProfileView` (en revisión / aprobado / rechazado + reintentar)

### Fase 4 — Panel admin
- [x] Sección "Repartidores" en `admin/page.tsx`: KPI, lista con estado, preview de docs (signed URLs), aprobar / rechazar con motivo

### Fase 5 — Verificación
- [ ] `pnpm test` + `tsc --noEmit` + `lint` + QA manual E2E

## Fuera de alcance (v2)

- Emisión de comprobantes (AFIP/ARCA): acá solo se **recolecta CUIL** para facturación futura.
- Descubrimiento de repartidores por negocios (contratar desde la plataforma).
- Rating/estadísticas de repartidor.
- Validación de CUIL contra AFIP (solo módulo 11 por ahora).