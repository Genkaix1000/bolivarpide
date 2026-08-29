# 🚀 SaaS Delivery Local — Documento de Arquitectura
> **Argentina · Web App (PWA) · Supabase · MercadoPago**  
> Versión: 1.0 — Julio 2026
---
## 📋 Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Web App vs Play Store](#web-app-vs-play-store)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Costos y Planes](#costos-y-planes)
5. [Arquitectura del Sistema](#arquitectura-del-sistema)
6. [Tres Caras del Producto](#tres-caras-del-producto)
   - [Usuario](#cara-1-usuario)
   - [Negocio](#cara-2-negocio)
   - [Delivery](#cara-3-delivery)
7. [Flujo de Pedido Completo](#flujo-de-pedido-completo)
8. [Esquema de Base de Datos](#esquema-de-base-de-datos-supabase)
9. [Integraciones](#integraciones)
10. [Pipelines y CI/CD](#pipelines-y-cicd)
11. [Modelo de Monetización](#modelo-de-monetización)
12. [Roadmap](#roadmap)
---
## Visión General
Plataforma de delivery y catálogo digital de tres caras que conecta **usuarios**, **negocios** y **repartidores** bajo un ecosistema propio. Los negocios pueden ser de cualquier rubro (gastronomía, farmacias, almacenes, etc.) con foco inicial en Argentina.
Monetización escalonada por tiers para negocios, con flujos automatizados de pago mediante escrow via MercadoPago Marketplace.
---
## Web App vs Play Store
### ✅ Decisión: Progressive Web App (PWA) como punto de partida
**¿Es coherente y posible? Sí, completamente.** Acá el razonamiento:
|
 Criterio 
|
 PWA Web App 
|
 App nativa Play Store 
|
|
---
|
---
|
---
|
|
 Costo de desarrollo 
|
 ✅ Una sola codebase 
|
 ❌ Separada de la web 
|
|
 Distribución 
|
 ✅ Sin fricción (solo un link) 
|
 ❌ Descarga e instalación 
|
|
 Actualizaciones 
|
 ✅ Instantáneas 
|
 ❌ Requieren update de store 
|
|
 Acceso a GPS 
|
 ✅ Web Geolocation API 
|
 ✅ Nativo 
|
|
 Push Notifications 
|
 ✅ Web Push API (Chrome/Android) 
|
 ✅ Nativo 
|
|
 Instalable en Android 
|
 ✅ "Agregar a pantalla de inicio" + TWA 
|
 ✅ 
|
|
 Instalable en iOS 
|
 ⚠️ "Agregar a pantalla de inicio" (limitado) 
|
 ❌ App Store por separado 
|
|
 Tiempo al mercado 
|
 ✅ Más rápido 
|
 ❌ Más lento 
|
**Estrategia recomendada:**
```
FASE 1 (MVP): Next.js PWA
  → Funciona en cualquier browser, sin instalar nada
  → En Android se puede "instalar" como app (TWA para Play Store sin código extra)
  → En iOS funciona como web app perfecta desde Safari
FASE 2 (tracción confirmada): Publicar en Play Store como TWA
  → Trusted Web Activity: tu PWA empaquetada como APK
  → Costo: ~0 en desarrollo (es la misma web)
  → Solo se paga la cuenta de Google Play: USD 25 única vez
FASE 3 (escala): Evaluar React Native si se necesitan features muy nativas
```
**Conclusión**: La PWA es la decisión más inteligente para este contexto. Sin fricción de instalación, un solo equipo de desarrollo, y la posibilidad de estar en Play Store casi gratis cuando quieras. Para usuarios argentinos donde el porcentaje de Android es muy alto (~85%), la TWA cubre casi todo el mercado.
---
## Stack Tecnológico
### Frontend / App
- **Framework**: Next.js 14 (App Router) — SSR, excelente SEO, PWA-ready
- **Styling**: Tailwind CSS + shadcn/ui
- **Estado global**: Zustand (ligero, sin boilerplate)
- **Formularios**: React Hook Form + Zod
- **Tiempo real**: Supabase Realtime (WebSockets nativos)
- **Maps**: Google Maps JavaScript API (para mostrar ubicación del local y tracking)
- **PWA**: next-pwa
### Backend
- **Arquitectura**: Monolito Modular via Next.js API Routes + Route Handlers
- **Lógica de negocio compleja**: Supabase Edge Functions (Deno) cuando haga falta
- **Cola de tareas / jobs**: Supabase pg_cron + Background Workers (Edge Functions)
### Base de Datos
- **Principal**: Supabase (PostgreSQL) — con PostGIS para geolocalización
- **Auth**: Supabase Auth — OAuth con Google, Apple, email magic link
- **Storage**: Supabase Storage — fotos de productos, logos, banners, fotos de delivery
- **Realtime**: Supabase Realtime — tracking de pedidos, notificaciones en vivo
### Servicios Externos
- **Pagos**: MercadoPago SDK (Checkout Pro + Marketplace API para escrow)
- **Notificaciones Push**: Web Push API + Supabase Edge Functions
- **WhatsApp Bot (Tier 2)**: Meta Cloud API + OpenAI GPT-4o
- **IA (Tier 3)**: OpenAI API (GPT-4o, Vision)
- **Email transaccional**: Resend (plan gratuito: 3.000 emails/mes)
- **Mapas**: Google Maps Platform (primer $200 de uso gratis/mes — suficiente para MVP)
### Hosting / Infraestructura
- **App**: Vercel (Free tier → luego Pro si hace falta)
- **DB / Auth / Storage / Realtime**: Supabase (Free tier → Pro)
- **CDN**: Cloudflare (gratis, se pone delante de Vercel)
- **Dominio**: Namecheap o NIC.ar (~$15 USD/año)
---
## Costos y Planes
### Escenario: Costo $0 durante el MVP (viable)
|
 Servicio 
|
 Plan Gratuito Incluye 
|
 Límite antes de pagar 
|
|
---
|
---
|
---
|
|
**
Vercel
**
|
 Hosting + CI/CD 
|
 100GB bandwidth/mes, 12 deploys/día 
|
|
**
Supabase
**
|
 500MB DB, 1GB Storage, 50k usuarios activos/mes, 2GB bandwidth, Realtime 
|
 Al superar usuarios o storage 
|
|
**
Google Maps
**
|
 $200 USD crédito/mes 
|
 ~28.000 cargas de mapa/mes gratis 
|
|
**
Resend
**
|
 3.000 emails/mes 
|
 Al superar volumen 
|
|
**
GitHub
**
|
 CI/CD Actions 
|
 2.000 minutos/mes (sobra) 
|
|
**
MercadoPago
**
|
 Sin costo fijo 
|
 Solo comisión por transacción (3.99% aprox.) 
|
|
**
Cloudflare
**
|
 CDN + SSL 
|
 Gratis para uso básico 
|
**Total fijo durante MVP: $0 USD/mes** (solo la comisión de MercadoPago por cada venta)
### Cuándo empezar a pagar y cuánto
|
 Cuándo 
|
 Servicio 
|
 Costo 
|
|
---
|
---
|
---
|
|
 +50k usuarios activos/mes o +500MB DB 
|
**
Supabase Pro
**
|
 USD 25/mes 
|
|
 +100GB tráfico/mes 
|
**
Vercel Pro
**
|
 USD 20/mes 
|
|
 IA activa (Tier 2 y 3) 
|
**
OpenAI API
**
|
 Pay-per-use (bajo volumen ~USD 10-50/mes) 
|
|
 WhatsApp Bot 
|
**
Meta Cloud API
**
|
 Primeras 1.000 conversaciones/mes gratis 
|
**Conclusión**: Se puede arrancar en $0 real. El primer gasto significativo aparece cuando tenés escala, y para ese momento ya tenés ingresos por comisiones.
---
## Arquitectura del Sistema
### Estructura de Monolito Modular
```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, registro, OAuth callback
│   ├── (user)/                   # Cara del usuario
│   │   ├── page.tsx              # Home: exploración de negocios
│   │   ├── [slug]/               # Vista de negocio + carta
│   │   ├── cart/                 # Carrito y checkout
│   │   ├── orders/               # Historial y tracking de pedidos
│   │   └── profile/              # Perfil, direcciones, cupones
│   ├── (business)/               # Panel del negocio
│   │   ├── dashboard/
│   │   ├── catalog/
│   │   ├── orders/
│   │   ├── delivery/
│   │   ├── coupons/
│   │   └── settings/
│   ├── (delivery)/               # App del repartidor
│   │   ├── dashboard/
│   │   ├── active-order/
│   │   ├── history/
│   │   └── profile/
│   └── api/                      # API Routes
│       ├── orders/
│       ├── payments/
│       ├── notifications/
│       └── webhooks/
│           ├── mercadopago/
│           └── meta/
├── modules/                      # Lógica de negocio por módulo
│   ├── auth/
│   ├── catalog/
│   ├── orders/
│   ├── payments/
│   ├── delivery/
│   ├── notifications/
│   └── analytics/
├── lib/                          # Clientes y utilidades compartidas
│   ├── supabase/
│   ├── mercadopago/
│   ├── openai/
│   └── maps/
└── supabase/
    ├── migrations/               # SQL migrations versionadas
    ├── functions/                # Edge Functions
    └── seed.sql
```
### Patrón de Comunicación
```
Browser/PWA
    │
    ▼
Next.js (Vercel)
    │
    ├── API Routes ──────────────► Supabase (DB + Auth + Storage)
    │                                    │
    ├── Supabase Realtime ◄──────────────┘ (WebSockets)
    │
    ├── MercadoPago API ──────────► Webhook ──► /api/webhooks/mercadopago
    │
    └── Supabase Edge Functions
            ├── Envío de Push Notifications
            ├── WhatsApp Bot handler
            └── Cron jobs (liquidaciones, expiración cupones)
```
---
## Tres Caras del Producto
---
## Cara 1: Usuario
### Autenticación
```
Pantalla de inicio
  → "Entrar con Google" (OAuth via Supabase Auth)
  → "Entrar con Apple" (OAuth via Supabase Auth)
  → (Opcional) Email + Magic Link
  → Primera vez: completar nombre y dirección principal
  → Puede elegir también abrir negocio o registrarse como delivery
```
### Exploración de Negocios (Home)
#### Barra de Búsqueda
- Buscar por nombre del negocio o nombre del producto
- Búsqueda en tiempo real (debounced, Supabase full-text search)
- Sin filtro de distancia
- Sin mapa interactivo
#### Filtros disponibles
- Categoría: Gastronomía, Farmacia, Almacén, Indumentaria, etc.
- Precio: Rango de precio del plato/producto más barato
- Envío gratis
- Con descuento activo
- Abierto ahora
- Mejor puntuados
#### Grid de Negocios — Qué muestra cada card
```
┌──────────────────────────────┐
│  [IMAGEN DEL LOCAL / BANNER] │
│                              │
│  ⭐ 4.7  🕐 ~18 min          │
├──────────────────────────────┤
│  Nombre del Local            │
│  Categoría                   │
│  Desde $2.500                │
│                              │
│  [🚚 Envío gratis] [🔥 -20%] │
└──────────────────────────────┘
```
**Métricas a mostrar en la card:**
|
 Campo 
|
 De dónde sale 
|
|
---
|
---
|
|
**
Imagen del local
**
|
 Banner o logo del negocio (Supabase Storage) 
|
|
**
⭐ Puntuación
**
|
 Promedio de reviews de usuarios (tabla 
`reviews`
) 
|
|
**
🕐 Tiempo promedio
**
|
 Calculado: media del tiempo entre 
`status = accepted`
 y 
`status = delivery_called`
 en los últimos 30 pedidos del local. Se guarda como campo desnormalizado 
`avg_prep_time_mins`
 en 
`businesses`
 y se recalcula con cron job cada hora 
|
|
**
Precio desde
**
|
 El precio mínimo entre todos los productos activos del negocio (
`MIN(price) WHERE is_available = true`
) 
|
|
**
[🚚 Envío gratis]
**
|
 Label si 
`delivery_fee = 0`
 o si hay promoción activa de envío gratis 
|
|
**
[🔥 -20%]
**
|
 Label si hay productos con descuento activo o cupón aplicable 
|
|
**
[⚡ Rápido]
**
|
 Label si 
`avg_prep_time_mins < 15`
|
|
**
[🟢 Abierto]
**
 / 
**
[🔴 Cerrado]
**
|
 Calculado contra 
`business_hours`
 y hora actual de Argentina (UTC-3) 
|
### Vista de Negocio (al hacer click en una card)
**Sección 1 — Header del negocio**
```
[BANNER del negocio — imagen ancha]
[Logo superpuesto]
Nombre del negocio
Categoría · ⭐ 4.7 (128 reviews) · 🕐 ~18 min · Desde $2.500
[🚚 Envío gratis] [🔥 -20%] [🟢 Abierto hasta las 23:00]
```
*(Los mismos datos que en la card del grid, ampliados)*
**Sección 2 — Carta completa (scroll)**
- Tabs por categoría de productos (pegados al header en scroll)
- Cada ítem: foto, nombre, descripción corta, precio, botón "Agregar"
- Si tiene variantes: abre un modal (tamaño, extras, etc.)
- Items sin stock: visibles pero deshabilitados con etiqueta "Agotado"
- Items en oferta: precio tachado + precio nuevo
**Sección 3 — Info del local (al final del scroll)**
```
📍 Ubicación en Google Maps (iframe o enlace a Maps)
   Dirección completa
🕐 Horarios
   Lunes a Viernes: 10:00 – 23:00
   Sábado: 11:00 – 24:00
   Domingo: Cerrado
📱 Contacto (si el negocio lo publicó)
```
**Carrito flotante**
- Botón fijo en la parte inferior: "Ver carrito (3 ítems) — $8.750"
- Al tocar: drawer/modal del carrito con resumen
### Carrito y Checkout
```
Carrito
├── Lista de ítems con cantidades editables
├── Notas por ítem (opcional)
├── Código de cupón
├── Resumen: subtotal + costo de envío + descuentos + total
└── Botón "Confirmar pedido"
Checkout
├── Dirección de entrega (seleccionar o agregar nueva)
├── Método de pago:
│   ├── MercadoPago (tarjetas, débito, Mercado Crédito)
│   └── Efectivo al delivery (si el negocio lo permite)
├── Tiempo estimado (preparación + delivery)
└── Confirmar y pagar → redirige a MercadoPago → vuelve con resultado
```
### Pedidos y Tracking
**Estados visibles para el usuario:**
```
⏳ Esperando que el local acepte...
   (si pasan 3 min sin respuesta → "El local no respondió, reembolso en proceso")
✅ Pedido aceptado — Preparando tu pedido
   [Barra de progreso animada] ~18 min estimados
📦 Listo para retirar
   (solo si el usuario eligió retiro en local)
🛵 En camino con delivery de [Nombre del Repartidor]
   [Mapa con posición del repartidor en tiempo real]
   "Javier está a 8 minutos de tu casa"
🏠 Tu pedido está afuera
   (notificación push + pantalla de confirmación)
✅ Entregado
   [Botón: "Dejar una reseña"]
```
**Post-entrega:**
- Rating al negocio: 1-5 ⭐ + comentario opcional
- Rating al delivery: 1-5 ⭐
- Reporte de problema (con foto adjunta): "Me faltó algo", "Producto en mal estado", etc.
- "Repetir este pedido" con un tap
### Perfil del Usuario
- Foto y nombre (desde OAuth)
- Mis pedidos (historial completo)
- Mis cupones guardados
- Mis direcciones
- Métodos de pago guardados (gestionado por MercadoPago, no almacenamos datos de tarjeta)
- Configuración de notificaciones
- Opción: "Abrir mi negocio" / "Ser repartidor"
---
## Cara 2: Negocio
### Onboarding
```
Desde el perfil de usuario → "Abrir mi negocio"
  → Datos del negocio:
      Nombre, categoría, descripción, dirección, CUIT, teléfono
  → Subir logo + banner
  → Horarios de atención
  → Elegir plan (Gratuito / Tier 2 / Tier 3)
  → Activación (automática en plan gratuito, manual para verificar en pagos)
```
---
### 🆓 TIER 0 — Gratuito — "Escaparate Digital"
**Catálogo**
- Categorías ilimitadas
- Productos con: foto, nombre, descripción, precio, variantes (tamaño, extras, sin)
- Toggle disponible/agotado por producto en tiempo real
- Logo, banner y descripción del negocio
**Carta QR (modo offline)**
- URL pública: `tuapp.com.ar/carta/nombre-negocio`
- El cliente ve el menú completo pero **no puede comprar desde ahí**
- QR descargable en PDF para imprimir (mesas, mostrador)
- La carta se actualiza en tiempo real al modificar el catálogo
- Personalización: color de acento, foto de portada
**Cupones y Ofertas**
- Crear cupones: código + monto fijo o % de descuento
- Fecha de expiración + límite de usos
- Marcar productos en oferta con precio tachado
- Envío gratis por monto mínimo
**Gestión de Pedidos**
- Cola de pedidos en tiempo real (Supabase Realtime)
- Aceptar / Rechazar pedido (con motivo opcional)
- Marcar pedido como: En preparación → Listo → Despachado
- Elegir tipo de despacho: delivery de la app / delivery particular
- Configurar delivery de la app: agente libre o registrado en el negocio
- Historial de pedidos
**Dashboard Básico**
- Pedidos del día / semana / mes
- Monto facturado total
- Plato más vendido
- Últimos pedidos recibidos
- Estado de la cuenta (comisiones pendientes)
**Delivery registrado**
- El negocio puede buscar repartidores en la base de datos y enviarles invitación
- Define el pago por pedido para cada repartidor
- El repartidor puede aceptar o rechazar la invitación
**Comisión por transacción: 12%** (se descuenta automáticamente en la liquidación)
---
### 💙 TIER 2 — Negocio Conectado (Pago mensual — ~$X ARS/mes)
> Todo lo del Tier Gratuito, más:
**WhatsApp Business + IA**
- El negocio conecta su número de WhatsApp Business (vía Meta Cloud API)
- Bot de IA (GPT-4o) configurado con el menú del negocio:
  - Responde consultas sobre productos, precios y horarios
  - FAQs configurables desde el panel
  - Toma pedidos por WhatsApp y genera un link de pago
  - Manda actualizaciones de estado al cliente por WhatsApp
- Historial de conversaciones visible en el panel
**Dashboard Avanzado**
- Gráficos de ventas por período (día / semana / mes / año)
- Ticket promedio y su evolución
- Tasa de cancelación con desglose de motivos
- Productos más y menos vendidos
- Horas pico de pedidos (heatmap por hora del día)
- Comparativa entre períodos
- Exportación a CSV
**Operaciones**
- Tiempo de preparación configurable por categoría o producto
- Zona de cobertura de delivery configurable en mapa (radio)
- Gestión de hasta 3 sucursales
**Comisión por transacción: 8%**
---
### 🟣 TIER 3 — Negocio Elite (Pago mensual premium — ~$XX ARS/mes)
> Todo lo del Tier 2, más:
**Visibilidad Premium**
- Aparece primero en la búsqueda y en el home feed
- Badge "Destacado" en la card
- Slot en banners rotativos del home
- Notificaciones push a usuarios de la zona ("novedad de tu negocio favorito")
**IA de Gestión de Carta**
- Chat IA en el panel con contexto de tu negocio:
  - "¿Cuál fue mi mejor semana del mes?"
  - "¿Qué productos tienen peor rotación?"
  - "Sugerime precios basados en mis ventas"
- Upload de foto de un plato → IA genera nombre y descripción automáticamente
- Análisis de feedback de clientes con resumen semanal automático
- Alertas automáticas por anomalías (caída de ventas, pico inusual)
**Dashboard Ultra-Detallado**
- Análisis de clientes nuevos vs recurrentes
- Análisis de rentabilidad por producto (si cargás costos)
- Heatmap de pedidos por zona
- Integración con facturación AFIP (ARCA) — generación de facturas electrónicas
- Múltiples roles de usuario en el panel (admin, operador, caja)
- Hasta 10 sucursales
**Comisión por transacción: 5%**
---
### Panel del Negocio — Estructura de Navegación
```
Sidebar
│
├── 📊 Dashboard
│   ├── Resumen del día (pedidos, facturado, pedido en curso)
│   ├── Pedidos en vivo (kanban en tiempo real)
│   └── Métricas según tier
│
├── 📦 Pedidos
│   ├── Cola activa
│   ├── Historial
│   └── Disputas y reclamos
│
├── 🍽️ Mi Carta
│   ├── Categorías
│   ├── Productos (CRUD con drag & drop para ordenar)
│   ├── Variantes y extras
│   └── Gestión de disponibilidad masiva
│
├── 🏷️ Ofertas y Cupones
│   ├── Cupones activos
│   ├── Crear cupón
│   └── Historial
│
├── 🛵 Delivery
│   ├── Mis repartidores (invitar, ver estado)
│   ├── Configurar pago por pedido
│   └── Historial de entregas
│
├── 📱 Carta QR
│   ├── Preview y personalización
│   └── Descargar QR
│
├── 🏪 Mi Negocio
│   ├── Datos, logo, banner
│   ├── Horarios
│   └── Zona de cobertura
│
├── 💰 Finanzas
│   ├── Facturación y liquidaciones
│   └── Comisiones (Tier 2+: exportación / Tier 3+: AFIP)
│
├── 💬 WhatsApp Bot (Tier 2+)
│   ├── Conversaciones
│   └── Configuración del bot y FAQs
│
└── 🤖 Asistente IA (Tier 3)
    └── Chat con contexto del negocio
```
---
## Cara 3: Delivery (Repartidor)
### Registro como Repartidor
```
Desde el perfil de usuario → "Quiero ser repartidor"
  → Datos personales: DNI, foto de perfil
  → Datos del vehículo:
      Tipo: bicicleta / moto / auto / a pie
      Foto del vehículo
      Patente (si aplica)
  → Aceptar términos y condiciones
  → CBU/CVU para cobros (MercadoPago)
  → Activación (automática)
  → Modo "En línea / Fuera de línea" disponible
```
### Perfil del Repartidor (CV Dinámico)
```
[Foto de perfil]          [Foto del vehículo]
Nombre
🟢 En línea / 🔴 Fuera de línea
Tipo de vehículo: 🛵 Moto
Patente: ABC 123
⭐ Rating: 4.8 / 5.0
📦 Pedidos completados: 243
🗓️ Pedidos hoy: 7
💰 Ganancias hoy: $12.400
📅 Ganancias esta semana: $68.200
🏆 Badge: Repartidor confiable (>95% tasa de aceptación)
Negocios vinculados:
  ├── 🍕 Pizzería Don Roque (Registrado)
  └── 🛒 Almacén El Sol (Registrado)
```
### Modos de Trabajo
#### 🔴 Agente Libre
- El repartidor activa "modo disponible"
- Cualquier negocio de la plataforma puede asignarle pedidos
- Al generarse un pedido en su zona: push notification con detalles
- Ve: nombre del local, distancia al local, distancia al destino, monto a ganar, tiempo estimado
- Acepta o rechaza en 60 segundos (si no responde = rechazo automático)
- Demasiados rechazos → baja el score de confiabilidad
#### 🔵 Registrado en Negocio
- El negocio lo invita y él acepta
- Solo recibe pedidos de ese/esos negocios específicos
- El negocio define el monto por pedido
- Puede trabajar para múltiples negocios simultáneamente
- Si ningún registrado acepta → el negocio puede hacer fallback a agente libre
### App del Repartidor — Estructura
```
Home
├── Toggle En línea / Fuera de línea
├── Pedidos disponibles en zona (lista, sin mapa — solo distancias)
├── Pedido activo (si tiene uno asignado)
└── Resumen del día (pedidos + ganancias)
Pedido Activo
├── Detalles: negocio, items, dirección del cliente
├── Navegación GPS (abre Google Maps con la ruta)
├── Estado actual y próxima acción
│   ├── Etapa 1: "Ir a buscar el pedido a [Local]"
│   │   → Al acercarse (<100m): auto-confirmación "Llegué al local"
│   │   → Botón manual de respaldo: "Ya retiré el pedido"
│   └── Etapa 2: "Entregar a [Dirección del cliente]"
│       → Al acercarse (<150m): push al usuario "Tu pedido está afuera"
│       → Auto-confirmación "Entregado" al llegar
│       → Botón manual de respaldo: "Ya entregué el pedido"
└── Chat con el negocio / cliente
Historial
├── Pedidos completados con detalle
├── Ganancias acumuladas por período
└── Ratings recibidos
Solicitudes de Trabajo
└── Lista de negocios que buscan repartidores con el pago ofrecido
Perfil
├── Editar datos y vehículo
├── CV de delivery completo
├── Negocios vinculados
└── Método de cobro (CBU/CVU)
```
---
## Flujo de Pedido Completo
```
══════════════════════════════════════════════════════════════
                    FLUJO COMPLETO DE PEDIDO
══════════════════════════════════════════════════════════════
[1] USUARIO ARMA EL CARRITO
    ├── Selecciona productos + variantes + cantidades
    ├── Notas por ítem ("sin cebolla", "extra salsa")
    ├── Dirección de entrega
    ├── Cupón (opcional)
    └── Método de pago
[2] CHECKOUT Y PAGO
    ├── Resumen + total (subtotal + envío - descuento)
    ├── Usuario confirma → redirige a MercadoPago
    ├── 💰 Pago procesado → dinero RETENIDO en escrow
    │       (MercadoPago Marketplace: el dinero no va al negocio aún)
    ├── Webhook /api/webhooks/mercadopago confirma el pago
    └── Estado del pedido: PENDING_ACCEPTANCE
[3] NOTIFICACIÓN AL NEGOCIO
    ├── Push notification + sonido en el panel del negocio
    ├── Supabase Realtime actualiza la cola de pedidos en tiempo real
    ├── El negocio ve: items, dirección, método de pago, monto
    └── Timeout: 3 minutos para responder
    ┌── NEGOCIO NO RESPONDE en 3 min ──────────────────────────────┐
    │  ├── Pedido auto-cancelado                                    │
    │  ├── Reembolso automático vía MercadoPago API               │
    │  └── Push al usuario: "El local no respondió. Reembolso en proceso" │
    └───────────────────────────────────────────────────────────────┘
    ┌── NEGOCIO RECHAZA ────────────────────────────────────────────┐
    │  ├── Panel: el negocio toca "Rechazar" + motivo opcional      │
    │  ├── Reembolso automático vía MercadoPago API               │
    │  └── Push al usuario: "Tu pedido fue rechazado. [motivo]"   │
    └───────────────────────────────────────────────────────────────┘
    ┌── NEGOCIO ACEPTA ─────────────────────────────────────────────┐
    │  ├── Estado: IN_PREPARATION                                   │
    │  ├── 💰 Dinero sigue en escrow                              │
    │  ├── Push al usuario: "Tu pedido fue aceptado 🎉"           │
    │  └── Timer visible para el usuario (tiempo estimado de prep)  │
    └───────────────────────────────────────────────────────────────┘
[4] PREPARACIÓN
    ├── El negocio puede actualizar tiempo estimado si es necesario
    ├── El usuario ve el timer en tiempo real (Supabase Realtime)
    └── Negocio marca: "Pedido listo para despachar"
[5] DESPACHO — El negocio elige el modo de entrega:
┌── OPCIÓN A: DELIVERY PARTICULAR (propio del negocio, fuera de la app) ──┐
│   ├── Negocio marca "Enviado con delivery particular"                    │
│   ├── Estado: IN_TRANSIT_THIRD_PARTY                                    │
│   ├── 💰 Dinero liberado al negocio (MercadoPago) menos comisión        │
│   ├── Push al usuario: "Tu pedido está en camino 🛵"                    │
│   └── Usuario puede:                                                     │
│       ├── Marcar "Ya recibí mi pedido" (botón en la app)                │
│       └── Dejar review al negocio                                        │
└──────────────────────────────────────────────────────────────────────────┘
┌── OPCIÓN B: DELIVERY POR LA APP ────────────────────────────────────────┐
│                                                                          │
│  El negocio elige el modo del repartidor:                               │
│                                                                          │
│  [B1] AGENTE LIBRE                                                       │
│  ├── Se publica el pedido disponible (zona del negocio)                 │
│  ├── Push a todos los repartidores libres en la zona                    │
│  ├── Primer repartidor en aceptar → asignado                            │
│  ├── Si nadie acepta en 5 min → re-notificación o alerta al negocio    │
│  └── El negocio puede ver cuántos repartidores hay disponibles          │
│                                                                          │
│  [B2] REPARTIDOR REGISTRADO EN EL NEGOCIO                              │
│  ├── Push a TODOS los repartidores vinculados al negocio               │
│  ├── Primer repartidor en aceptar → asignado                            │
│  └── Si ninguno acepta → el negocio puede hacer fallback a agente libre │
│                                                                          │
│  ─────────────────────────────────────────────────────                  │
│  UNA VEZ ASIGNADO EL REPARTIDOR:                                        │
│                                                                          │
│  Estado: IN_TRANSIT_APP                                                  │
│  Push al usuario: "Javier está yendo a buscar tu pedido"               │
│                                                                          │
│  ── ETAPA 1: Repartidor → Local ──────────────────────────             │
│  ├── GPS del repartidor activo (Geolocation API del browser)            │
│  ├── Emite posición cada 4 segundos via Supabase Realtime              │
│  ├── Usuario y negocio ven al repartidor en el mapa (Google Maps)       │
│  ├── Al acercarse < 100m del local:                                     │
│  │   └── Push al negocio: "El repartidor está llegando"                │
│  └── Al llegar al local (< 50m):                                        │
│      ├── Auto-confirmación: "Pedido retirado"                           │
│      ├── Estado: ORDER_PICKED_UP                                        │
│      └── Botón manual de respaldo en la app del repartidor              │
│                                                                          │
│  ── ETAPA 2: Repartidor → Domicilio del usuario ──────────────────     │
│  ├── GPS sigue emitiendo posición                                       │
│  ├── Usuario ve al repartidor en tiempo real                            │
│  ├── Al acercarse < 150m del domicilio:                                 │
│  │   └── Push al usuario: "Tu pedido está a la vuelta 🏠"              │
│  └── Al llegar (< 80m):                                                 │
│      ├── Push al usuario: "Tu pedido está afuera 🎉"                   │
│      ├── Auto-confirmación: Estado DELIVERED                            │
│      ├── Botón manual de respaldo en app del repartidor                 │
│      └── 💰 Dinero liberado al negocio (menos comisión)                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
[6] POST-ENTREGA
    ├── Usuario: rating al negocio (1-5 ⭐ + comentario)
    ├── Usuario: rating al repartidor (1-5 ⭐)
    ├── Usuario: reporte de problema (opcional)
    ├── Sistema: actualiza avg_prep_time_mins del negocio (cron job)
    ├── Sistema: actualiza avg_rating del negocio y del repartidor
    ├── 💰 Liquidación al negocio según período configurado
    └── 💰 Pago al repartidor según acuerdo con el negocio
```
---
## Esquema de Base de Datos (Supabase / PostgreSQL)
### Extensiones requeridas
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";      -- Para coordenadas geográficas
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Para búsqueda de texto rápida
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- Para búsqueda sin acentos
```
---
### Tabla: `profiles` (extiende auth.users de Supabase)
```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  is_business_owner BOOLEAN DEFAULT FALSE,
  is_delivery     BOOLEAN DEFAULT FALSE,
  default_address_id UUID,  -- FK a user_addresses
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: el usuario solo puede leer/editar su propio perfil
```
### Tabla: `user_addresses`
```sql
CREATE TABLE user_addresses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT,              -- "Casa", "Trabajo", etc.
  street     TEXT NOT NULL,
  city       TEXT NOT NULL,
  province   TEXT DEFAULT 'Buenos Aires',
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  notes      TEXT,              -- "Timbre 3B, portero roto"
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `delivery_profiles`
```sql
CREATE TABLE delivery_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type     TEXT CHECK (vehicle_type IN ('bicycle','motorcycle','car','on_foot')),
  vehicle_photo_url TEXT,
  license_plate    TEXT,
  bio              TEXT,
  is_available     BOOLEAN DEFAULT FALSE,
  mode             TEXT DEFAULT 'free_agent' CHECK (mode IN ('free_agent','registered_only','both')),
  -- Métricas calculadas (actualizadas por cron job)
  rating_avg       NUMERIC(3,2) DEFAULT 0,
  total_orders     INT DEFAULT 0,
  acceptance_rate  NUMERIC(5,2) DEFAULT 100,  -- porcentaje
  -- Datos de cobro
  mercadopago_account TEXT,  -- CBU/CVU o alias
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `businesses`
```sql
CREATE TABLE businesses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,     -- para la URL del negocio
  category         TEXT NOT NULL,            -- 'gastronomia','farmacia','almacen','indumentaria','otro'
  subcategory      TEXT,
  description      TEXT,
  logo_url         TEXT,
  banner_url       TEXT,
  address          TEXT,
  city             TEXT,
  province         TEXT DEFAULT 'Buenos Aires',
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  phone            TEXT,
  cuit             TEXT,
  -- Plan / Tier
  plan_tier        SMALLINT DEFAULT 0 CHECK (plan_tier IN (0,1,2)),
  plan_expires_at  TIMESTAMPTZ,
  -- Métricas desnormalizadas (actualizadas por cron job cada hora)
  min_price        NUMERIC(12,2),            -- precio mínimo del catálogo activo
  rating_avg       NUMERIC(3,2) DEFAULT 0,
  rating_count     INT DEFAULT 0,
  avg_prep_time_mins INT DEFAULT 0,          -- tiempo medio aceptación→delivery_llamado
  -- Configuración de delivery
  delivery_fee     NUMERIC(12,2) DEFAULT 0,
  free_delivery_min NUMERIC(12,2),           -- monto mínimo para envío gratis (NULL = siempre pago)
  delivery_radius_km NUMERIC(5,2),
  accepts_cash     BOOLEAN DEFAULT FALSE,
  -- Estado
  is_active        BOOLEAN DEFAULT TRUE,
  is_verified      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
-- Índice para búsqueda de texto
CREATE INDEX businesses_name_trgm_idx ON businesses USING gin(name gin_trgm_ops);
CREATE INDEX businesses_location_idx ON businesses USING gist(
  ST_MakePoint(lng, lat)::geography
);
```
### Tabla: `business_hours`
```sql
CREATE TABLE business_hours (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week  SMALLINT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 1=lunes...
  opens_at     TIME NOT NULL,
  closes_at    TIME NOT NULL,
  is_closed    BOOLEAN DEFAULT FALSE
);
```
### Tabla: `business_delivery_agents` (relación negocio ↔ delivery)
```sql
CREATE TABLE business_delivery_agents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id       UUID REFERENCES businesses(id) ON DELETE CASCADE,
  delivery_user_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pay_per_order     NUMERIC(12,2),           -- lo que cobra el delivery por pedido
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','inactive')),
  invited_at        TIMESTAMPTZ DEFAULT NOW(),
  joined_at         TIMESTAMPTZ,
  UNIQUE(business_id, delivery_user_id)
);
```
### Tabla: `product_categories`
```sql
CREATE TABLE product_categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sort_order   SMALLINT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE
);
```
### Tabla: `products`
```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2) NOT NULL,
  sale_price    NUMERIC(12,2),              -- precio de oferta (NULL = sin oferta)
  image_url     TEXT,
  is_available  BOOLEAN DEFAULT TRUE,
  prep_time_mins SMALLINT,                  -- tiempo de preparación específico
  sort_order    SMALLINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `product_variant_groups` y `product_variant_options`
```sql
-- Grupo: "Tamaño", "Extras", "Sin ingrediente"
CREATE TABLE product_variant_groups (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID REFERENCES products(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,              -- "Tamaño", "Extras"
  is_required  BOOLEAN DEFAULT FALSE,
  min_select   SMALLINT DEFAULT 0,
  max_select   SMALLINT DEFAULT 1
);
-- Opción: "Grande +$500", "Extra queso +$200", "Sin cebolla"
CREATE TABLE product_variant_options (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID REFERENCES product_variant_groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price_delta NUMERIC(12,2) DEFAULT 0      -- puede ser negativo
);
```
### Tabla: `coupons`
```sql
CREATE TABLE coupons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID REFERENCES businesses(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  type             TEXT CHECK (type IN ('percent','fixed','free_delivery')),
  value            NUMERIC(12,2),           -- porcentaje o monto fijo
  min_order        NUMERIC(12,2) DEFAULT 0,
  max_uses         INT,                     -- NULL = ilimitado
  uses_count       INT DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, code)
);
```
### Tabla: `orders`
```sql
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id),
  business_id         UUID REFERENCES businesses(id),
  delivery_agent_id   UUID REFERENCES profiles(id),        -- asignado al aceptar
  coupon_id           UUID REFERENCES coupons(id),
  -- Dirección de entrega (snapshot al momento del pedido)
  delivery_address    TEXT,
  delivery_lat        DOUBLE PRECISION,
  delivery_lng        DOUBLE PRECISION,
  -- Estado
  status              TEXT NOT NULL DEFAULT 'pending_acceptance' CHECK (status IN (
                        'pending_acceptance',   -- esperando que el negocio acepte
                        'in_preparation',       -- aceptado, preparando
                        'ready',                -- listo para despachar
                        'in_transit_third_party', -- delivery particular
                        'looking_for_delivery', -- buscando repartidor en la app
                        'delivery_assigned',    -- repartidor asignado
                        'order_picked_up',      -- repartidor retiró del local
                        'delivered',            -- entregado al usuario
                        'cancelled',            -- cancelado
                        'refunded'              -- reembolsado
                      )),
  delivery_mode       TEXT CHECK (delivery_mode IN (
                        'pickup',               -- retiro en local
                        'third_party',          -- delivery particular
                        'app_free_agent',       -- agente libre
                        'app_registered'        -- delivery registrado en el negocio
                      )),
  -- Montos
  subtotal            NUMERIC(12,2) NOT NULL,
  delivery_fee        NUMERIC(12,2) DEFAULT 0,
  discount_amount     NUMERIC(12,2) DEFAULT 0,
  platform_fee        NUMERIC(12,2),          -- comisión de la plataforma
  total               NUMERIC(12,2) NOT NULL,
  -- Pago
  payment_method      TEXT CHECK (payment_method IN ('mercadopago','cash')),
  payment_status      TEXT DEFAULT 'pending' CHECK (payment_status IN (
                        'pending','held','released','refunded'
                      )),
  mp_payment_id       TEXT,                   -- ID del pago en MercadoPago
  mp_preference_id    TEXT,                   -- ID de la preferencia (checkout)
  -- Control de tiempo
  accepted_at         TIMESTAMPTZ,
  delivery_called_at  TIMESTAMPTZ,            -- para calcular avg_prep_time
  picked_up_at        TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  -- Otros
  notes               TEXT,                   -- nota general del pedido
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `order_items`
```sql
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  -- Snapshot del producto al momento del pedido
  product_name    TEXT NOT NULL,
  unit_price      NUMERIC(12,2) NOT NULL,
  quantity        SMALLINT NOT NULL DEFAULT 1,
  subtotal        NUMERIC(12,2) NOT NULL,
  variants        JSONB,                      -- snapshot de las variantes elegidas
  notes           TEXT                        -- "sin cebolla"
);
```
### Tabla: `order_status_log`
```sql
CREATE TABLE order_status_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
  status       TEXT NOT NULL,
  triggered_by UUID REFERENCES profiles(id),  -- quién cambió el estado
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `order_tracking` (posiciones GPS en tiempo real)
```sql
CREATE TABLE order_tracking (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID REFERENCES orders(id) ON DELETE CASCADE,
  delivery_agent_id UUID REFERENCES profiles(id),
  lat               DOUBLE PRECISION NOT NULL,
  lng               DOUBLE PRECISION NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
-- Retención: se eliminan registros con más de 24 horas (cron job)
-- Solo se guardan para historial básico; el tiempo real va por Supabase Realtime
```
### Tabla: `reviews`
```sql
CREATE TABLE reviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_user_id    UUID REFERENCES profiles(id),
  business_id         UUID REFERENCES businesses(id),
  delivery_agent_id   UUID REFERENCES profiles(id),
  business_rating     SMALLINT CHECK (business_rating BETWEEN 1 AND 5),
  business_comment    TEXT,
  delivery_rating     SMALLINT CHECK (delivery_rating BETWEEN 1 AND 5),
  delivery_comment    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID REFERENCES orders(id),
  provider     TEXT DEFAULT 'mercadopago',
  mp_id        TEXT UNIQUE,                  -- ID de la transacción en MP
  type         TEXT CHECK (type IN ('capture','release','refund')),
  amount       NUMERIC(12,2),
  status       TEXT,
  raw_payload  JSONB,                        -- respuesta cruda de MP
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `notifications`
```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,                  -- 'order_accepted', 'delivery_assigned', etc.
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB,                          -- payload extra (order_id, etc.)
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
### Tabla: `push_subscriptions` (Web Push API)
```sql
CREATE TABLE push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```
---
### Vistas y Funciones SQL Útiles
```sql
-- Vista: negocios activos con info calculada (para el home feed)
CREATE VIEW v_businesses_feed AS
SELECT
  b.*,
  bh.opens_at,
  bh.closes_at,
  bh.is_closed,
  -- "Abierto ahora" calculado en SQL
  CASE
    WHEN bh.is_closed = TRUE THEN FALSE
    WHEN NOW()::TIME BETWEEN bh.opens_at AND bh.closes_at THEN TRUE
    ELSE FALSE
  END AS is_open_now,
  -- Labels
  (b.delivery_fee = 0 OR b.free_delivery_min IS NOT NULL) AS has_free_delivery_option,
  EXISTS(
    SELECT 1 FROM products p
    WHERE p.business_id = b.id AND p.sale_price IS NOT NULL AND p.is_available = TRUE
  ) AS has_discounts
FROM businesses b
LEFT JOIN business_hours bh ON bh.business_id = b.id
  AND bh.day_of_week = EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')
WHERE b.is_active = TRUE;
-- Función: calcular avg_prep_time de un negocio (llamada por cron job)
CREATE OR REPLACE FUNCTION update_business_avg_prep_time(p_business_id UUID)
RETURNS VOID AS $$
UPDATE businesses
SET avg_prep_time_mins = (
  SELECT COALESCE(
    AVG(EXTRACT(EPOCH FROM (delivery_called_at - accepted_at)) / 60),
    0
  )::INT
  FROM orders
  WHERE business_id = p_business_id
    AND accepted_at IS NOT NULL
    AND delivery_called_at IS NOT NULL
    AND created_at > NOW() - INTERVAL '30 days'
)
WHERE id = p_business_id;
$$ LANGUAGE SQL;
-- Función: calcular min_price de un negocio (llamada por cron job)
CREATE OR REPLACE FUNCTION update_business_min_price(p_business_id UUID)
RETURNS VOID AS $$
UPDATE businesses
SET min_price = (
  SELECT MIN(COALESCE(sale_price, price))
  FROM products
  WHERE business_id = p_business_id AND is_available = TRUE
)
WHERE id = p_business_id;
$$ LANGUAGE SQL;
```
---
## Integraciones
### MercadoPago (QR dinámico presencial — sin Checkout Pro)

> **Spec canónico:** [`docs/specs/payments-qr-mp.md`](docs/specs/payments-qr-mp.md)  
> **Referencia de implementación:** proyecto Cocktrail (OAuth + Store + POS + Orders `type:qr` `mode:dynamic`).

**Decisión:** no usar Checkout Pro / Marketplace online por comisiones. Cobro online vía **Código QR presencial** (Orders API, QR dinámico). No requiere terminal física Point/Posnet.

**Por comercio adherido (OAuth):** 1 Store + 1 POS (`pdv`). Múltiples orders QR concurrentes sobre el mismo POS — la concurrencia se maneja en backend, no con cajas artificiales.

**Flujo resumido (pagar primero):**
```
1. Usuario logueado confirma pedido (un comercio; cupón opcional antes del pago)
2. Backend crea order MP QR dynamic (PT15M) con token OAuth del comercio
3. Cliente escanea QR con Mercado Pago u otra billetera
4. Webhook order → GET /v1/orders/{id} → payment_status = paid
5. Si el comercio rechaza después → refund vía API MP
Alternativa: efectivo al delivery (con aviso de que el comercio puede rechazar)
```

**Dinero:** va directo a la cuenta MP del comercio (sin escrow). Fee de plataforma: pendiente — el QR no tiene split nativo.

Rutas API (ver spec):
  POST /api/payments/mp/oauth/url
  POST /api/orders/checkout
  POST /api/webhooks/mercadopago
  POST /api/orders/{id}/payment/retry
---
### Supabase Auth (OAuth)
```
Proveedores configurados en Supabase Dashboard:
  ├── Google (OAuth 2.0) — setup en Google Cloud Console
  └── Apple (Sign in with Apple) — setup en Apple Developer
Flujo:
  Cliente → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Supabase maneja el redirect y token
  → Trigger en auth.users → crea registro en profiles automáticamente
  → Session guardada en cookies (SSR-compatible con Next.js)
```
**Supabase Auth Trigger** (se crea en la DB):
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```
---
### Supabase Realtime (Tracking y Notificaciones)
```javascript
// Cliente: suscribirse al estado de un pedido
supabase
  .channel(`order-${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    updateOrderStatus(payload.new.status);
  })
  .subscribe();
// Cliente: suscribirse al tracking GPS de un pedido
supabase
  .channel(`tracking-${orderId}`)
  .on('broadcast', { event: 'location' }, ({ payload }) => {
    updateDeliveryMarker(payload.lat, payload.lng);
  })
  .subscribe();
// Repartidor: emitir posición
supabase
  .channel(`tracking-${orderId}`)
  .send({
    type: 'broadcast',
    event: 'location',
    payload: { lat, lng, timestamp: Date.now() }
  });
```
**Row Level Security (RLS)**: Reglas en cada tabla para que los usuarios solo accedan a sus propios datos. El negocio solo ve sus pedidos, el repartidor solo los suyos, etc.
---
### Tracking GPS (Browser Geolocation API)
```javascript
// App del repartidor (PWA en el browser del repartidor)
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Solo emitir si hay movimiento significativo (> 10 metros)
    if (distanceFromLast(latitude, longitude) > 10) {
      emitLocation(latitude, longitude);
      checkProximityTriggers(latitude, longitude); // auto-confirmaciones
    }
  },
  (error) => console.error(error),
  {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 3000
  }
);
// Al terminar el pedido:
navigator.geolocation.clearWatch(watchId);
```
**Limitación de PWA en iOS**: La Geolocation API en iOS Safari solo funciona con la app en primer plano. Como los repartidores son la cara más activa usando la app, esto es aceptable para MVP. La app debe pedirles que mantengan la pantalla activa.
---
## Pipelines y CI/CD
### Pipeline de GitHub Actions
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup Node 20
      - npm ci
      - npx tsc --noEmit          # Type check
      - npm run lint               # ESLint
      - npm run test               # Vitest unit tests
  deploy-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - Deploy a Vercel Preview URL
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - Deploy a Vercel Production
      - Supabase DB migrations (supabase db push)
```
### Pipeline de Notificaciones (Supabase Edge Function)
```
Evento en DB (cambio de estado de orden)
  → Supabase Database Webhook (trigger automático)
  → Edge Function: send-notification
      ├── Consulta a quién notificar según el evento
      ├── Busca las push_subscriptions del usuario
      └── Envía Web Push via web-push library
```
### Pipeline de Métricas (Cron Jobs en Supabase)
```
pg_cron schedule:
Cada hora:
  → Recalcular avg_prep_time_mins de negocios con pedidos nuevos
  → Recalcular avg_rating de negocios y repartidores
  → Recalcular min_price de negocios con cambios de catálogo
Cada día a las 00:00 (Argentina):
  → Archivar order_tracking con más de 24 horas
  → Desactivar cupones expirados
  → Calcular estadísticas del dashboard (agregados diarios)
Cada semana:
  → Generar reportes de liquidaciones pendientes
  → Actualizar métricas del CV de repartidores
```
---
## Sistema de Notificaciones
### Eventos y Destinatarios
|
 Evento 
|
 Push 
|
 Email 
|
 Destinatario 
|
|
---
|
---
|
---
|
---
|
|
 Pedido recibido 
|
 ✅ 
|
 ❌ 
|
 Negocio 
|
|
 Pedido aceptado 
|
 ✅ 
|
 ❌ 
|
 Usuario 
|
|
 Pedido rechazado 
|
 ✅ 
|
 ✅ 
|
 Usuario 
|
|
 Negocio no respondió 
|
 ✅ 
|
 ✅ 
|
 Usuario 
|
|
 Pedido en preparación 
|
 ✅ 
|
 ❌ 
|
 Usuario 
|
|
 Pedido listo para despachar 
|
 ✅ 
|
 ❌ 
|
 Repartidor asignado 
|
|
 Nuevo pedido disponible (agente libre) 
|
 ✅ 
|
 ❌ 
|
 Todos los repartidores libres cercanos 
|
|
 Nuevo pedido (repartidor registrado) 
|
 ✅ 
|
 ❌ 
|
 Repartidores del negocio 
|
|
 Repartidor asignado 
|
 ✅ 
|
 ❌ 
|
 Usuario + Negocio 
|
|
 Repartidor cerca del local 
|
 ✅ 
|
 ❌ 
|
 Negocio 
|
|
 Pedido retirado 
|
 ✅ 
|
 ❌ 
|
 Usuario 
|
|
 Repartidor cerca del domicilio 
|
 ✅ 
|
 ❌ 
|
 Usuario 
|
|
 Pedido entregado 
|
 ✅ 
|
 ✅ 
|
 Usuario + Negocio 
|
|
 Reembolso procesado 
|
 ✅ 
|
 ✅ 
|
 Usuario 
|
|
 Cupón próximo a vencer 
|
 ✅ 
|
 ❌ 
|
 Usuarios con el cupón 
|
|
 Invitación como repartidor 
|
 ✅ 
|
 ✅ 
|
 Repartidor 
|
|
 Liquidación disponible 
|
 ✅ 
|
 ✅ 
|
 Negocio 
|
---
## Modelo de Monetización
### Comisiones por Transacción
|
 Tier 
|
 Comisión 
|
 Suscripción Mensual 
|
|
---
|
---
|
---
|
|
 Gratuito (Tier 0) 
|
 12% 
|
 $0 
|
|
 Conectado (Tier 2) 
|
 8% 
|
 A definir en pesos ARS 
|
|
 Elite (Tier 3) 
|
 5% 
|
 A definir en pesos ARS 
|
### Otras Fuentes de Ingreso (Futuro)
- **Boost de visibilidad**: Negocios Tier 0 pueden pagar para aparecer arriba temporalmente
- **Publicidad nativa**: Banners en el home feed
- **Fee de delivery**: Porcentaje del costo de delivery cuando se usa la app de repartidores
- **Integraciones premium**: AFIP, impresoras, POS
### Proyección de Revenue Modelo
```
Ejemplo con 100 pedidos/día de $5.000 ARS promedio:
Volumen diario: $500.000 ARS
Comisión promedio (12%): $60.000 ARS/día
Comisión mensual: ~$1.800.000 ARS/mes
Costos operativos en MVP: ~$0 (todo free tier)
Ganancia bruta: ~$1.800.000 ARS/mes
```
---
## Features Adicionales Recomendados
### Para el Usuario
- **Pedido programado**: "Quiero que llegue a las 13:00"
- **Repetir pedido**: Con un tap, volver a pedir lo mismo de antes
- **Historial de gastos**: Cuánto gasté este mes, en qué locales
- **Favoritos**: Negocios y productos guardados
- **Modo sin conexión (PWA)**: Caché de la carta para ver sin internet
### Para el Negocio
- **Modo vacaciones**: Pausar el negocio con fecha de regreso
- **Stock management**: Contador de unidades por producto (se desactiva solo)
- **Menú del día**: Platos especiales que desaparecen a cierta hora
- **Impresora de tickets**: Integración con impresoras térmicas Bluetooth (Web Bluetooth API)
- **Encuesta rápida**: El negocio puede agregar 1 pregunta post-pedido al usuario
### Para el Repartidor
- **Sistema de logros/badges**: 100 pedidos, 1000km, rating perfecto
- **Turno de trabajo**: Configurar horarios de disponibilidad con anticipación
- **Historial de ganancias**: Por día, semana, mes con gráficos
### Para la Plataforma
- **Panel de Admin**: Gestión de usuarios, negocios, disputas, comisiones
- **Sistema de disputas**: Flujo estructurado para reclamos con escalado
- **Detección de fraude**: Patrones anómalos (muchos pedidos cancelados, reviews falsas)
- **Landing page**: Para captar negocios con calculadora de ROI del plan pago
- **Referidos**: Sistema de referidos para negocios que traen otros negocios
---
## Roadmap
### MVP — Mes 1 a 3
- [ ] Setup inicial: Next.js + Supabase + Vercel
- [ ] Auth completo (Google OAuth + Apple)
- [ ] Onboarding de usuarios, negocios y repartidores
- [ ] Catálogo completo (CRUD de productos y categorías)
- [ ] Home feed con grid de negocios y búsqueda
- [ ] Vista de negocio (carta completa + info + ubicación)
- [ ] Carrito y checkout con MercadoPago
- [ ] Flujo de pedido completo (aceptar/rechazar/preparar/despachar)
- [ ] Dashboard básico del negocio (Tier 0)
- [ ] Carta QR (generación de link y QR descargable)
- [ ] Notificaciones push básicas
- [ ] Panel del negocio (gestión de pedidos en tiempo real)
- [ ] PWA: manifest + service worker
### V1 — Mes 4 a 6
- [ ] GPS tracking en tiempo real (Supabase Realtime + Geolocation API)
- [ ] Auto-confirmaciones por proximidad (< 100m / 150m)
- [ ] Sistema de reviews y ratings
- [ ] Cupones y ofertas
- [ ] Delivery registrado por negocio + agente libre
- [ ] Dashboard avanzado (Tier 2)
- [ ] Exportación CSV
- [ ] Cron jobs para métricas calculadas
- [ ] Email transaccional (Resend)
- [ ] TWA para publicar en Play Store
### V2 — Mes 7 a 12
- [ ] WhatsApp Bot con IA (Tier 2)
- [ ] IA de gestión de carta (Tier 3)
- [ ] Dashboard Ultra-Detallado (Tier 3)
- [ ] Programa de fidelidad (sellitos digitales)
- [ ] Pedido programado
- [ ] Integración con AFIP/ARCA (facturación electrónica)
- [ ] Panel de Admin completo
- [ ] Sistema de disputas estructurado
- [ ] Análisis predictivo básico (ML)
---
## Decisiones Técnicas a Confirmar
> **Pendientes antes de arrancar el desarrollo:**
1. **¿El precio de delivery lo fija el negocio o la plataforma calcula por distancia?**
   - Opción A: El negocio fija un precio único de envío
   - Opción B: La plataforma calcula por distancia (requiere más lógica)
   - Opción C: Dinámico (precio base del negocio + distancia)
2. **¿El usuario siempre paga el delivery o puede ser gratis?**
   - Definir si la plataforma puede absorber costos de envío en promociones
3. **¿Cómo se paga al repartidor?**
   - El negocio le paga directamente (fuera de la app)
   - La plataforma intermedia el pago (más complejo, requiere cuenta MP del repartidor)
4. **¿Los negocios Tier 0 pueden acceder a delivery por la app o solo desde Tier 2?**
5. **¿El número de WhatsApp del Tier 2 es propio del negocio o de la plataforma?**
   - Propio del negocio: el negocio conecta su WhatsApp Business (más fácil de implementar)
   - De la plataforma: la plataforma tiene un número por negocio (más costoso)
6. **¿Se requiere verificación de identidad para repartidores?** (afecta onboarding)