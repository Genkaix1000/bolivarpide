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
| [README.md](./README.md) | Resumen, decisiones de producto y checklist |
| [sdd/01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) | HU postulante + admin con criterios de aceptación |
| [sdd/02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) | Máquina de estados, permisos, flujos feliz/rechazo/reenvío |
| [tdd/01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) | Reglas puras, server actions, componentes, archivos |
| [tdd/02-base-de-datos-y-storage.md](./tdd/02-base-de-datos-y-storage.md) | Migración, bucket privado, RLS, acceso por signed URL |
| [tdd/03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) | Matrices CUIL/docs/permisos/storage + E2E QA |

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
- [x] `pnpm test` (35/35) + `tsc --noEmit` + `lint` (0 errores)
- [x] QA manual E2E aprobado por usuario
- [x] Docs sdd/tdd completados

## Fuera de alcance (v2)

- Emisión de comprobantes (AFIP/ARCA): acá solo se **recolecta CUIL** para facturación futura.
- Descubrimiento de repartidores por negocios (contratar desde la plataforma).
- Rating/estadísticas de repartidor.
- Validación de CUIL contra AFIP (solo módulo 11 por ahora).