# 09 — Tracking GPS en vivo del repartidor

> Posición real del repartidor en el mapa del cliente, con fallback a la simulación cuando no hay señal.

## Resumen

Reemplaza la **simulación** del repartidor en el mapa del cliente (`demoRouteProgress` en `src/lib/orders/routeGeometry.ts`) por **posiciones reales** compartidas por el repartidor desde la consola de reparto, con fallback a la simulación cuando no haya señal ni permisos.

| Cara | Qué cambia |
|------|------------|
| **Cliente** | El mapa `/pedido/[id]` muestra la posición GPS en vivo del repartidor (marcador real) en vez del avance simulado; vuelve a la simulación si no hay señal |
| **Repartidor** | Botón "Iniciar reparto / Dejar de compartir" en la consola (`DeliveryOrderCard`) que comparte GPS mientras el viaje dura; arranca sin compartir si no hay permiso |
| **Backend** | Tabla `delivery_locations` (escritura service-only, lectura proxied al pedido), realtime con `postgres_changes`, limpieza de la posición al entregar |
| **Privacidad** | Solo el dueño del pedido, miembro del negocio o admin lee la posición; la escritura de clientes está revocada |

## Decisiones de producto

- **Realtime con `postgres_changes`** sobre `delivery_locations` (filtro `order_id=eq.X`), NO broadcast manual `tracking-${orderId}`: consistente con el resto del repo (`orders`, `notifications`, `whatsapp_messages`) y los eventos respetan RLS (solo quien puede leer la fila recibe el evento).
- **Persistencia mínima**: se guardan puntos coordenados con throttle (~10 s) para suscriptores tardíos y auditoría — no historial completo de rutas (v2).
- **Configuración de GPS**: `getCurrentPosition` en intervalo de ~4 s (más compatible en PWA/iOS que `watchPosition` sostenido).
- **Permiso denegado**: arranca "en reparto sin compartir" y el cliente hace fallback a la simulación (el PIN igual confirma la entrega).
- **Limpieza automática**: al confirmar entrega, `advanceOrderStatus` borra las posiciones del pedido (red de seguridad idempotente) además del `stopSharingLocationAction` del driver.

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [README.md](./README.md) | Resumen, decisiones de producto y checklist |
| [sdd/01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) | HU repartidor + cliente con criterios de aceptación |
| [sdd/02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) | Estados del tracking, permisos, flujos feliz/fallo/privacidad |
| [tdd/01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) | Reglas puras, hook, server actions, componentes, archivos |
| [tdd/02-base-de-datos-y-realtime.md](./tdd/02-base-de-datos-y-realtime.md) | Migración, RLS, publicación realtime |
| [tdd/03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) | Matrices throttle/coords/permisos/RLS + E2E QA |

## Checklist de implementación

### Fase 1 — Datos y dominio
- [x] Migración `20260908000000_delivery_locations.sql` (tabla + índices + RLS proxy al pedido + high en `supabase_realtime`) aplicada y verificada en DB real
- [x] `src/lib/delivery/location.ts`: `shouldSaveLocation`, `isLocationFresh`, `isValidLatLng` + constantes de intervalos
- [x] `location.check.ts` (patrón ponytail) — `pnpm test` 36/36
- [x] Server actions `shareDeliveryLocationAction` / `stopSharingLocationAction` (`locationActions.ts`) con authz de driver

### Fase 2 — Consola driver
- [x] `src/hooks/useDriverLocation.ts`: loop de `getCurrentPosition` con throttle y estados `active/sharing/error`
- [x] Botón "Iniciar reparto / Dejar de compartir" en `DeliveryOrderCard` + aviso de GPS sin señal
- [x] Limpieza en entrega: `stop()` + `stopSharingLocationAction` + red de seguridad en `advanceOrderStatus`

### Fase 3 — Cliente (tracking)
- [x] Lectura inicial del último punto en `resolveOrderTrackingMap` (`latestLocation` en `OrderTrackingMapData` / `OrderTrackingMapView`)
- [x] Suscripción `postgres_changes` a `delivery_locations` en `OrderTrackingMap` (filtro `order_id`)
- [x] Regla de selección: posición real reciente (`isLocationFresh`) → marker real; si no → fallback `demoRouteProgress`

### Fase 4 — Verificación
- [x] `pnpm test` (36/36) + `tsc --noEmit` + `lint` (0 errores)
- [x] Migración aplicada y verificada en remoto (GET 200 `[]`, INSERT autenticado rechazado por RLS)
- [ ] QA manual E2E en dos dispositivos (driver en consola, cliente en `/pedido/[id]`)
- [x] Docs sdd/tdd completados

## Fuera de alcance (v2)

- Historial completo de rutas (trazado real del recorrido en el cliente).
- Optimización de batería en PWA instalada (Background Sync / SW location).
- Múltiples repartidores visibles (agente libre) en el mapa del cliente.
- Broadcast manual con autorización Realtime dedicada (hoy no hace falta: `postgres_changes` + RLS alcanza).