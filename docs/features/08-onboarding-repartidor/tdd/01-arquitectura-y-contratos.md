# TDD 01 — Arquitectura y contratos

## Dominio de reglas puras — `src/lib/delivery/profile.ts` (sin `"use server"`)

```typescript
export type DeliveryVehicleType = "bicycle" | "motorcycle" | "car" | "on_foot";
export type DriverApplicationStatus = "pending_review" | "approved" | "rejected";
export type DriverDocKind = "dni_front" | "dni_back" | "license";

export const DELIVERY_VEHICLES: DeliveryVehicleType[];
export const VEHICLE_LABELS: Record<DeliveryVehicleType, string>;
export const VEHICLE_ICONS: Record<DeliveryVehicleType, string>;
export const DRIVER_AVAILABILITY: { id: string; label: string }[];

export function cuilValidate(value: string): boolean;
// 11 dígitos, prefijo 20|23|24|27, dígito verificador módulo 11.
// (pesos [5,4,3,2,7,6,5,4,3,2]; resto 0→dv 0, resto 1→dv 9, resto n→11-n)

export function requiredDocsForVehicle(v: DeliveryVehicleType): DriverDocKind[];
// bicycle|on_foot → [dni_front, dni_back]
// motorcycle|car    → [dni_front, dni_back, license]

export const DRIVER_DOC_ALLOWED_TYPES: Set<string>; // jpeg/png/webp/pdf
export const DRIVER_DOC_MAX_BYTES = 5 * 1024 * 1024;
export function driverDocInvalidReason(file: { type: string; size: number }): string | null;
```

## Server Actions — `src/lib/delivery/profileActions.ts` (`"use server"`)

```typescript
export type DriverApplicationResult = { ok: true } | { ok: false; error: string };

export type MyDriverProfileView = {
  exists: boolean;
  status?: DriverApplicationStatus;
  vehicleType?: DeliveryVehicleType;
  hasLicense?: boolean;
  rejectionReason?: string | null;
  submittedAt?: string;
};

export async function submitDriverApplicationAction(fd: FormData): Promise<DriverApplicationResult>;
// Campos: vehicleType, availability, cuil, dniFront, dniBack, license?
// Authz: session user. Escritura con service client (kyc-documents + delivery_profiles).
// Errores: devueltos en el Result (usado desde client con useTransition).

export async function getMyDriverProfileAction(): Promise<MyDriverProfileView | null>;
// Lectura vía user client (RLS own select).

export async function approveDriverProfileAction(fd: FormData): Promise<void>;  // userId
export async function rejectDriverProfileAction(fd: FormData): Promise<void>;   // userId + reason (≥10)
// Requieren admin (app_metadata.role); THROW en error (patrón approveLead/rejectLead:
// `<form action={serverAction}>` exige void|Promise<void>). Side effects:
// update status + reviewed_by/at, admin_audit_log, insertNotification (push) + revalidatePath("/admin").
```

**Punto clave**: las acciones bound a `<form>` devuelven `Promise<void>` y lanzan errores; las que se llaman desde client con `useTransition` devuelven `DriverApplicationResult`.

## Modal de onboarding — `src/components/profile/DriverApplicationModal.tsx`

Props: `isOpen, onClose, initialStatus?, initialVehicle?, onSubmitted?`.

Pasos `step ∈ 0..3`:

| Paso | Contenido | Avanza si |
|------|-----------|-----------|
| 0 | Vehículo (4 botones) + disponibilidad | vehículo válido |
| 1 | Docs dinámicos (`DNI frente`, `DNI dorso`; `licencia` si moto/auto) con preview | docs presentes y sin errores |
| 2 | CUIL (validación en vivo) + resumen | `cuilValidate` |
| 3 | "Postulación enviada" | se muestra en éxito |

- Files en estado local + previews con `URL.createObjectURL` (revocados en unmount).
- Envío: `const fd = new FormData(); ... submitDriverApplicationAction(fd)` dentro de `useTransition`.
- Reset de pasos al cerrar: `queueMicrotask` (regla de lint react-set-state-in-effect).
- Rechazo previo: banner de motivo arriba, vehículo precargado.

## Entry point — `src/components/profile/ProfileView.tsx`

- `getMyDriverProfileAction()` al montar → `driverProfile`.
- `driverStatus = driverProfile?.exists ? driverProfile.status : null`.
- Botón "Ser repartidor" (Centro de ayuda) con 4 estados visuales (ser repartidor / en revisión / aprobado / reintentar).
- `onSubmitted` → re-fetch del estado.

## Panel admin — `src/app/admin/page.tsx` (server component)

- Query `delivery_profiles` (limit 50, `submitted_at` desc) + `user_profiles` de los postulantes (nombres).
- Signed URLs **in-page**: `createSignedUrl(path, 180)` por doc (no hay API route — la ruta `/api/admin/kyc/preview` fue eliminada por muerta).
- KPI "Repartidores pending" (quinta card).
- Sección "Repartidores": fila con nombre, vehículo, disponibilidad, CUIL, badge de estado, previews (DNI frente/dorso, licencia) y, si `pending_review`, `<form action>` de Aprobar / Rechazar (motivo min 10).

## Tabla de archivos

| Archivo | Rol |
|---------|-----|
| `src/lib/delivery/profile.ts` | Reglas puras (CUIL, matriz, labels, límites de docs) |
| `src/lib/delivery/profile.check.ts` | Tests ponytail de `profile.ts` |
| `src/lib/delivery/profileActions.ts` | Server actions (submit/get/approve/reject) |
| `src/components/profile/DriverApplicationModal.tsx` | Onboarding multipaso |
| `src/components/profile/ProfileView.tsx` | Entry point state-aware |
| `src/app/admin/page.tsx` | Sección Repartidores + previews |
| `supabase/migrations/20260907000000_delivery_profiles.sql` | Tabla + bucket + RLS |

## Dependencias

Ninguna nueva. Reutiliza:

- `@/lib/supabase/service` (writes) y `@/lib/supabase/server` (session user)
- `@/lib/notifications/repository` → `insertNotification` (push del resultado)
- `@/lib/delivery/queries` → `driverDisplayName` (nombres en el admin)
- Material Symbols + framer-motion (modal) como el resto del perfil