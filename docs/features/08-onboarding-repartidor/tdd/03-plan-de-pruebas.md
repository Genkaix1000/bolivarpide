# TDD 03 — Plan de pruebas

Archivos de check runnable (patrón ponytail):

| Archivo | Cubre |
|---------|-------|
| `src/lib/delivery/profile.check.ts` | `cuilValidate` (módulo 11), `requiredDocsForVehicle`, tipos |

Ejecutar: `pnpm test` (corre todos los `*.check.ts`).

---

## Matriz — CUIL (`cuilValidate`)

| Entrada | Esperado |
|---------|----------|
| `"20271234563"` (computado módulo 11) | ✓ true |
| `"27392188741"` (computado módulo 11) | ✓ true |
| `"20-27123456-3"` (con guiones) | ✓ true |
| `" 20271234563 "` (espacios) | ✓ true |
| `"20271234564"` (verificador incorrecto) | ✗ false |
| `"12345678901"` (prefijo inválido) | ✗ false |
| `"2027123456"` (10 dígitos) | ✗ false |
| `"2027123456312"` (13 dígitos) | ✗ false |
| `""` / no numérico | ✗ false |

---

## Matriz — documentos por vehículo

| Vehículo | Docs requeridos |
|----------|-----------------|
| `bicycle` | `[dni_front, dni_back]` |
| `on_foot` | `[dni_front, dni_back]` |
| `motorcycle` | `[dni_front, dni_back, license]` |
| `car` | `[dni_front, dni_back, license]` |

---

## Matriz — validaciones server (`submitDriverApplicationAction`)

| Caso | Resultado esperado |
|------|--------------------|
| Vehículo inexistente | `{ok:false, error}` antes de subir |
| CUIL inválido | `{ok:false, error}` antes de subir |
| Falta `dniFront` / `dniBack` | error |
| Moto/auto sin licencia | error |
| Formato no permitido | error (client + server) |
| Archivo > 5 MB | error |
| Happy path | 2–3 uploads OK, upsert `pending_review`, docs viejos borrados |
| Error en el 2.º upload | se borran los parciales (sin huérfanos) |

---

## Matriz — permisos y auditoría

| Escenario | Esperado |
|-----------|----------|
| `getMyDriverProfileAction` de otro user | null/own (RLS own select) |
| Admin lee todas las postulaciones | ✓ (policy `is_platform_admin`) |
| `approveDriverProfileAction` sin ser admin | throw "Sin permisos" |
| `approveDriverProfileAction` de postulación inexistente | throw "Postulación no encontrada" |
| `rejectDriverProfileAction` con motivo < 10 | throw "Motivo mínimo 10" |
| Aprobar/rechazar OK | status + `reviewed_by/at` + `admin_audit_log` + notificación con `dedupeKey` |

---

## Matriz — storage / RLS

| Escenario | Esperado |
|-----------|----------|
| `public=false` en bucket | no accesible por `/object/public/` |
| SELECT de un user sobre carpeta ajena | 0 filas (policy `foldername` + uid) |
| Admin SELECT sobre cualquier carpeta | ✓ |
| INSERT/UPDATE/DELETE `authenticated` sobre el bucket | denegado (privilege revocado) |
| Signed URL expirada (180 s) | 403 desde storage |
| Preview de path que ya no está en la fila | el admin solo firma paths de la fila actual |

---

## Matriz — UI (smoke / snapshot manual)

### DriverApplicationModal

| Paso | Estado | Render / gating |
|------|--------|-----------------|
| 0 | sin vehículo | "Continuar" deshabilitado |
| 0 | vehículo elegido | avanza a documentos |
| 1 | bici/a pie | solo DNI frente + dorso |
| 1 | moto/auto | agrega Licencia |
| 1 | archivo inválido | error inline, no avanza |
| 2 | CUIL 11 dígitos válido | check verde + habilita Enviar |
| 2 | CUIL inválido | rojo, Enviar bloqueado |
| 3 | enviado | pantalla de éxito |
| reabrir tras rechazo | — | banner de motivo + vehículo precargado |

### Entry point ProfileView

| Estado | Muestra |
|--------|---------|
| sin postulación | "Ser repartidor" |
| pending_review | "Postulación en revisión" |
| approved | "Repartidor aprobado" |
| rejected | "Reintentar postulación" + motivo |

### Panel admin — sección Repartidores

| Estado | Muestra |
|--------|---------|
| pending_review | botones Aprobar / Rechazar (motivo) + previews |
| approved | badge verde, sin acciones |
| rejected | badge rojo + motivo, sin acciones |
| KPIs | card "Repartidores pending" |

---

## Casos E2E manuales (checklist QA)

1. Usuario (bici): Mi Perfil → Centro de ayuda → Ser repartidor → bici + turno → sube DNI frente/dorso → CUIL válido → Enviar → "Postulación en revisión".
2. Intento con CUIL falso: no permite Enviar.
3. Admin `/admin`: aparece la postulación en Repartidores; abrir preview de DNI frente/dorso → **Aprobar**.
4. El postulante recibe push y ve "Repartidor aprobado".
5. Otro usuario (moto): pide licencia; sube todo; admin la **Rechaza** con motivo → push con motivo → "Reintentar postulación".
6. Reenvío: corrige y envía → vuelve a `pending_review`, se limpian los docs viejos.
7. Regresión: `/negocio/[id]/reparto` (funcionalidades previas) intactas; un usuario sin sessión no puede postular.