# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Plataforma de delivery y catálogo digital de negocios para San Carlos de Bolívar.
- Onboarding de negocios: alta del local, logo, portada, horarios y datos de contacto.
- Panel de negocio con dashboard, carta, pedidos, WhatsApp, pagos y centro de configuración unificado.
- Catálogo de productos con ingredientes, opciones personalizadas y precios formateados (es-AR).
- Carta pública por local (`/c/[slug]`) con navegación por categorías, banners y estado abierto/cerrado.
- Búsqueda con autocompletado sobre negocios y productos.
- Direcciones de entrega con autocompletado de calles de Bolívar, mapa de pines y geolocalización.
- Sistema de pedidos completo: carrito multi-flujo, checkout, comanda en tiempo real con PIN de entrega y ticket digital.
- Seguimiento de pedido con estado en tiempo real, botón de Google Maps y reseñas.
- Pago con MercadoPago QR dinámico por comercio (OAuth del local) y efectivo.
- PWA instalable con service worker, iconos de marca y botón de instalación.
- Notificaciones push (Web Push) con preferencias por categoría.
- WhatsApp: bot de pedidos vía n8n, chat integrado en el panel, plantillas de estado y conexión self-service por OAuth con tokens cifrados en Supabase Vault.
- Autenticación con login/registro rediseñado y recuperación/cambio de contraseña desde el perfil.
- Cabecera curva con banners promocionales y página 404 personalizada.
- Sistema de avatares 2D y de badges (marcos Gold/Ruby/Sapphire).
- Scripts de seed y limpieza de comercios y cartas de prueba para el MVP.

### Security

- Migración de Row Level Security en todas las tablas y matriz de verificación.
- Precios de checkout verificados server-side (el cliente ya no define montos).
- Webhook de MercadoPago idempotente con verificación de monto y deduplicación por evento.
- Reembolsos idempotentes con clave estable y reserva atómica.
- Endpoints administrativos de pagos restringidos al rol `owner`.
- Cupones con límite de usos aplicado atómicamente (reserva en una sola operación).
- Cambio de estado de pedidos validado en base de datos (RPC), con el UPDATE directo revocado.
- Preferencias de push corregidas: las promos respetan la opción del usuario.

### Changed

- Home migrada a Server Components con regeneración incremental (ISR) y sin doble caché; eliminado el cache en localStorage.
- Estados de pedido consolidados en 6 (`pending`, `preparing`, `delivering`, `delivered`, `rejected`, `cancelled`), con `cancelled` como estado real.
- Transiciones de pedido validadas en base de datos (RPC `transition_order_status`) con verificación de PIN atómica.
- Dominio de reconciliación de pagos movido a la capa `lib`.
- El endpoint de estado de pago ya no expone filas crudas de la base de datos.
- Suite de pruebas (`*.check.ts`) reescrita sobre código real, sin copias de lógica.
- Documentación de arquitectura y README regenerados; historial de migraciones de Supabase reconciliado (28 migraciones, timestamps únicos).

### Fixed

- Flash de login evitado y persistencia de descartes de notificaciones.
- Scroll horizontal en detalle de producto y guías de recorte/resolución en el editor de imágenes.
- Carga de iconos y fotos de productos y locales en home y hub de locales.
- Alerta de nuevo pedido persistente hasta aceptar/rechazar, con botón de descarte.
- Panel de detalles de WhatsApp cerrado por defecto.
- 404 y navegación de local no disponible mejorados.
- Banner de pedido cancelado descartable permanentemente.
- Carrito: solo adicionales con costo extra y generación segura de UUID para checkout.
- Lint y reglas de hooks (setState sincrónico en effects, a11y, imports sin usar).

### Removed

- Datos y constantes mock (`mockData`) reemplazados por tipos y contenido estático reales.
- UI de configuración sin uso (SettingsLayout y tabs duplicados).
- Alias de ruta `/negocio/[businessId]/equipo` (se apunta directo a configuración).
- Scripts legacy de aplicación de migraciones (se usa la Supabase CLI).

[Unreleased]: https://github.com/Genkaix1000/bolivarpide/compare/main...HEAD