# SDD 01 — Historias de usuario

## Cliente (gana insignias)

### HU-C01 — Ver el catálogo de insignias en el perfil

**Como** cliente de BolivarPide
**Quiero** ver en Mi perfil todas las insignias del catálogo (las ganadas y las que faltan)
**Para** saber qué logros existen y cuáles puedo desbloquear

**Criterios de aceptación**

- La sección "Insignias" de `ProfileView` lista el catálogo completo (`BADGE_DEFINITIONS`):
  - Ganadas → a color, con su rareza.
  - Bloqueadas → en silueta gris/apagada con el borde de rareza desaturado y texto "Aún no desbloqueada".
- Cada insignia ganada abre `BadgeDetailModal` con título, descripción, rareza, otorgado por y fecha.
- Se muestra el contador `ganadas/total` (ej. `3 / 12`).

---

### HU-C02 — Desbloquear una insignia al completar un hito

**Como** cliente autenticado
**Quiero** que el sistema me otorgue automáticamente la insignia cuando cumplo la métrica
**Para** sentir el reconocimiento sin tener que hacer nada

**Criterios de aceptación**

- Al entregarse un pedido (`delivered`), se evalúan las insignias del `customer_user_id` de la orden.
- Al completar hitos de onboarding (perfil completo, identidad verificada, primera dirección, primer favorito), se evalúa por usuario.
- Si una insignia se desbloquea: no se duplica en `awarded_badges`, no se revierte nunca.
- El desbloqueo persiste aunque el cliente guarde el perfil después (el cliente ya no escribe `awarded_badges`).

---

### HU-C03 — Recibir notificación y modal al desbloquear

**Como** cliente que acaba de desbloquear una insignia
**Quiero** una notificación in-app y, al volver al perfil, un modal de celebración
**Para** enterarme del logro y sentir el feedback

**Criterios de aceptación**

- Se inserta una notificación `badges` (dedupeKey `badge:<userId>:<badgeId>`) que aparece en la campana.
- Al abrir Mi perfil y detectar una insignia nueva respecto al snapshot previo, se muestra `BadgeUnlockedModal` con el badge celebrado.
- La notificación es deduplicada: repetir la evaluación no genera avisos duplicados.

---

### HU-C04 — Ver el detalle de una insignia bloqueada

**Como** cliente que todavía no ganó una insignia
**Quiero** poder ver qué insignia es aunque esté bloqueada
**Para** motivarme a cumplir el requisito

**Criterios de aceptación**

- Las siluetas también son cliqueables y abren el detalle (con su requisito metido en la descripción).
- El modal de una bloqueada muestra el estado "Bloqueada" y no una fecha/otorgador inventado.

---

## Notas de producto

- Catálogo inicial (12 insignias, mezcla onboarding + pedidos):
  1. `perfil-completo` (bronce) · `identidad-verificada` (plata) · `primera-direccion` (bronce) · `primer-favorito` (bronce)
  2. `primer-pedido` (bronce) · `cinco-pedidos` (plata) · `diez-pedidos` (oro) · `cincuenta-pedidos` (rubí)
  3. `gasto-100k` (plata) · `gasto-500k` (oro) · `pago-digital` (plata) · `racha-3d` (plata)
- El catálogo es configurable como dato: agregar una fila = agregar una insignia, sin tocar el motor.