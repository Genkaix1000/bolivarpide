# SDD 02 — Flujos y estados

## Máquina de estados de la postulación

```
         ┌──────── submit ────────┐
         ▼                        │
   pending_review ── admin ──► approved (terminal)
         │  ▲                    │
         │  │ resubmit            │
         └──┴── admin ──► rejected ──► (reenvío corre el flujo desde pending_review)
```

| Estado | Significado | Transiciones |
|--------|-------------|--------------|
| `pending_review` | Enviada por el usuario, esperando revisión | → `approved` · → `rejected` (admin) · permanece (resubmit de la misma persona) |
| `approved` | Documentación aceptada; el usuario queda habilitado como repartidor | **terminal** (no se edita) |
| `rejected` | Admin la rechazó con motivo | → `pending_review` (el usuario reenvía corregida) |

**Reglas de envejecimiento**: el resubmit de un `rejected` pisa la fila: sube docs nuevos, limpia los viejos y vuelve a `pending_review` (borra motivo/reseña previa).

## Matriz de permisos

| Acción | Postulante (dueño) | Admin | Service (server actions) |
|--------|:------------------:|:-----:|:------------------------:|
| Leer su postulación / estado | ✓ | ✓ | ✓ |
| Leer todas las postulaciones | ✗ | ✓ | ✓ |
| Insertar / modificar la fila | ✗ (solo vía acción) | ✗ | ✓ |
| Subir/eliminar documentos | ✗ (solo vía acción) | ✗ | ✓ |
| Generar signed URL de preview | ✗ | ✓ (vía página admin) | ✓ |
| Cambiar estado | ✗ | ✓ (aprob./rech.) | ✓ |

- **Escritura desde el cliente**: inexistente — todo pasa por server actions con `service_role`.
- **Regla de negocio**: la persona **no puede** auto-aprobarse; el estado lo mueve exclusivamente el admin.

## Flujo de archivos (storage)

```
submitDriverApplicationAction
  └─ valida vehículo + CUIL + matriz de docs (server-side, igual que client)
  └─ upload a kyc-documents (private):
       path = <userId>/<kind>-<uuid8>.<ext>   kind ∈ dni-front|dni-back|license
  └─ upsert delivery_profiles (status=pending_review)
       └─ éxito → remove de docs VIEJOS (reemplazo)
       └─ error → remove de docs SUBIDOS EN ESTE INTENTO (sin huérfanos)

admin (página /admin, server component)
  └─ createSignedUrl(<path>, 180) → preview en otra pestaña (link temporal)
```

## Flujo feliz

```
1. Usuario logueado → Mi Perfil → Centro de ayuda → "Ser repartidor"
2. Paso vehículo + disponibilidad
3. Paso documentos: DNI frente+dorso (+ licencia si moto/auto) con preview
4. Paso CUIL (validación módulo 11 en vivo) → Enviar
5. Server: uploads + upsert → status pending_review → pantalla de éxito
6. Mi Perfil: tarjeta "Postulación en revisión"
7. Admin /admin → Repartidores → preview docs → Aprobar
8. Notificación push "¡Sos repartidor en BolivarPide!" + tarjeta "Repartidor aprobado"
```

## Flujo de rechazo y reenvío

```
1. Admin rechaza con motivo (≥ 10 caracteres)
2. Push "Tu postulación fue rechazada" + motivo; entry point muestra motivo
3. Usuario toca "Reintentar postulación" → modal precargado (vehículo previo)
4. Corrige docs/CUIL → Enviar → pending_review de nuevo (docs viejos eliminados)
```

## Casos borde

| Caso | Comportamiento esperado |
|------|-------------------------|
| Sube archivo de formato inválido | Rechazado client + server; se mantiene en el paso de documentos |
| Archivo > 5 MB | Igual, con mensaje claro |
| El postulante reenvía con OTRO vehículo | La matriz de docs cambia (ej. de auto a bici: ya no pide licencia) |
| El admin aprueba dos veces el mismo userId | Idempotente: segunda vez marca "Postulación no encontrada"/ya resuelto (estado previo chequeado por servicio) → la UI no muestra acciones para no-pending |
| Usuario borra su cuenta | `ON DELETE CASCADE` borra la fila; `ON DELETE SET NULL` en reviewed_by |
| Documento de una postulación que ya no existe | Preview devuelve 404 (el path ya no está en la fila) |
| CUIL duplicado entre postulantes | No se valida unicidad (afuera de alcance v1) — posible control futuro |