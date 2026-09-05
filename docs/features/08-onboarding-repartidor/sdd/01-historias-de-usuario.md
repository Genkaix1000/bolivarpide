# SDD 01 — Historias de usuario

## Repartidor (postulante)

### HU-D01 — Acceder desde Mi Perfil / Centro de ayuda

**Como** usuario logueado
**Quiero** un acceso claro "Ser repartidor" desde Mi Perfil → Centro de ayuda
**Para** postularme sin salir de la app

**Criterios de aceptación — entry point state-aware**

| Estado de postulación | Qué muestra el botón/tarjeta |
|-----------------------|------------------------------|
| Sin postulación | "Ser repartidor" · "Horarios flexibles" → abre el flujo |
| `pending_review` | Tarjeta "Postulación en revisión" · no accionable |
| `approved` | Tarjeta verde "Repartidor aprobado" · no accionable |
| `rejected` | "Reintentar postulación" · motivo de rechazo → abre flujo precargado |

- El estado se lee con `getMyDriverProfileAction()` al montar el perfil y se refresca tras cada envío.
- Al reabrir tras un rechazo, el modal conserva el vehículo anterior y muestra un aviso del motivo.

---

### HU-D02 — Vehículo y disponibilidad

**Como** postulante
**Quiero** elegir mi vehículo y turno
**Para** que se determinen los documentos que debo subir y mi disponibilidad operativa

**Criterios de aceptación**

- Vehículos: **Bicicleta · Moto · Auto · A pie** (`bicycle | motorcycle | car | on_foot`).
- Disponibilidad: `flexible | noches | mediodia | completo` (select con labels legibles).
- Sin vehículo seleccionado no se avanza de paso.

---

### HU-D03 — Documentación dinámica

**Como** postulante
**Quiero** subir solo los documentos que mi vehículo exige
**Para** entregar trámites mínimos y en orden

**Criterios de aceptación — matriz (server + client)**

| Vehículo | Documentos requeridos |
|----------|------------------------|
| `bicycle` / `on_foot` | DNI frente + DNI dorso |
| `motorcycle` / `car` | DNI frente + DNI dorso + licencia de conducir |

- Cada documento se sube con **preview** (imagen o ícono PDF según tipo) y botón "Cambiar"/quitar.
- Formato: JPG/PNG/WebP/PDF, máximo **5 MB** (validado client-side con `driverDocInvalidReason` y revalidado en el servidor).
- Sin los docs requeridos o con error de formato no se avanza.

---

### HU-D04 — CUIL validado

**Como** postulante
**Quiero** cargar mi CUIL con validación en vivo
**Para** que el dato quede correcto para futura facturación

**Criterios de aceptación**

- Input numérico de 11 dígitos (se filtran no-dígitos).
- Validación **módulo 11** (`cuilValidate`) con feedback inline: rojo "CUIL inválido" / verde "CUIL válido ✓".
- Prelados válidos de persona: 20, 23, 24, 27.
- Sin CUIL válido se bloquea el envío.

---

### HU-D05 — Enviar y seguir la postulación

**Como** postulante
**Quiero** enviar mi postulación y que quede registrada
**Para** esperar la aprobación y saber qué pasa

**Criterios de aceptación**

- Al enviar: documentos subidos a `kyc-documents` (bucket **privado**), fila en `delivery_profiles` con `status='pending_review'`.
- Pantalla de éxito + el entry point pasa a "Postulación en revisión".
- Al ser aprobada o rechazada llega **notificación push** (`category system`, dedupe `driver_review:<uid>:<resultado>`).
- Feature **resubmit**: un rechazo se puede corregir y volver a enviar (se reemplazan los docs viejos).

---

### HU-A01 — Revisar postulaciones (admin)

**Como** admin de plataforma
**Quiero** una sección "Repartidores" en el panel con las postulaciones
**Para** validar la documentación y aprobar/rechazar

**Criterios de aceptación**

- KPI de "Repartidores pending"; lista ordenada por `submitted_at` (más reciente primero).
- Cada fila: nombre, vehículo, disponibilidad, **CUIL completo**, estado, motivo de rechazo si existe.
- **Preview de docs** vía signed URLs (bucket privado — nunca URLs públicas): DNI frente, DNI dorso, licencia.
- Acciones solo para `pending_review`: **Aprobar** y **Rechazar** (motivo obligatorio, mínimo 10 caracteres).
- Toda acción queda en `admin_audit_log` (`approve_driver_profile` / `reject_driver_profile`).

---

### HU-A02 — Seguridad del documento

**Como** cualquier usuario
**Quiero** que mi DNI/licencia no sea accesible por cualquiera
**Para** proteger datos sensibles

**Criterios de aceptación**

- El bucket `kyc-documents` es **privado** (`public=false`): no se accede vía `/object/public`.
- RLS en storage: el dueño de la carpeta o el admin pueden leer; nada de escritura para `authenticated` (service-only).
- RLS en tabla: SELECT propio o admin; mutaciones solo `service_role`.
- Acceso a previews solo por signed URL generada server-side (180 s).