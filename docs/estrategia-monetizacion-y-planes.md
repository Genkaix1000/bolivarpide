# 📊 Estrategia de Monetización, Tiers de Planes y Arquitectura de IA
**BolivarPide / PLAZA — Plataforma de Comercio y Logística Local**

---

## 1. Filosofía del Modelo de Negocio

El modelo de monetización de **BolivarPide** está diseñado para resolver la fricción fundamental de las plataformas tradicionales (como PedidosYa, que cobran un 25%–30% de comisión y expulsan a los comercios locales).

### Principios Rectores:
1. **El comercio financia la plataforma:** Ni el cliente final ni los cadetes pagan comisiones extras ni tarifas ocultas.
2. **Cero barrera de entrada (Freemium Híbrido):** Ningún local puede decir que no. El plan gratuito no tiene costo fijo y solo abona una comisión baja por venta concretada.
3. **Upgrade orgánico:** A medida que el comercio crece y vende más, le resulta matemáticamente más conveniente contratar una suscripción mensual fija con **0% de comisión** y herramientas exclusivas.
4. **Sostenibilidad para el equipo fundador (3 socios):** El plan gratuito opera con costo marginal cero para nosotros (auto-onboarding y web direct), garantizando que la plataforma sea rentable desde el primer día.

---

## 2. Definición de Tiers de Planes

```
  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
  │      PLAN INICIAL       │      │      PLAN IMPULSO       │      │       PLAN LÍDER        │
  │        $0 / mes         │ ───► │      $45.000 / mes      │ ───► │      $95.000 / mes      │
  │     (7% comisión)       │      │    (3.5% comisión)      │      │      (0% comisión)      │
  └─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### 🟢 Nivel 1: Plan INICIAL (Adopción Masiva & Validación)
* **Público objetivo:** Locales pequeños, rotiserías de barrio, emprendimientos nuevos o negocios que desconfían y quieren probar sin riesgo.
* **Costo fijo:** **$0 ARS / mes**.
* **Comisión por venta:** **7% sobre ventas originadas en el marketplace**. ($0 si el cliente pide directo al local).
* **Mecanismo de costo $0 para la plataforma:**
  - Auto-gestión del local (carga sus productos y fotos).
  - Notificaciones en tiempo real vía Web/PWA en pantalla + botón de derivación directa a WhatsApp (sin costo de API de Meta).
  - Límite de catálogo: hasta 15 productos activos.
* **Características incluidas:**
  - Presencia en el directorio/marketplace local.
  - Menú digital QR estándar para mesa y mostrador.
  - Recepción de pedidos en panel web básico.
  - Opciones de retiro en local (Take Away) o delivery con cadete propio.

---

### 🔵 Nivel 2: Plan IMPULSO (Automatización & Escala)
* **Público objetivo:** Comercios gastronómicos consolidados (pizzerías, hamburgueserías, cafeterías) que despachan volumen diario y quieren automatizar la toma de pedidos.
* **Costo fijo:** **$45.000 ARS / mes** *(equivalente a vender 2 a 3 pizzas al mes)*.
* **Comisión por venta:** **3.5% sobre ventas en marketplace** (50% de descuento vs. plan inicial).
* **Características incluidas:**
  - **Catálogo ilimitado** de productos, combos y categorías.
  - **Bot de WhatsApp con IA (Gemini):** Hasta 200 pedidos mensuales procesados automáticamente mediante notas de voz y texto.
  - **Generador de Magic Links con JWT:** Ticket interactivo con cobro por Mercado Pago / Efectivo.
  - **Panel operativo avanzado:** Control de tiempos de cocina (15/25/35/45 min en 1 toque).
  - **Módulo de Logística:** Asignación de pedidos a repartidores vinculados.
  - **Kit de Marketing QR:** Plantillas gráficas listas con el logo del negocio para imprimir en mesas y local.
  - **Métricas comerciales:** Facturación semanal, platos más vendidos y horarios pico.
  - **Soporte prioritario:** Canal directo vía grupo de WhatsApp con los fundadores.

---

### 🟣 Nivel 3: Plan LÍDER (Posicionamiento VIP & Automatización Ilimitada)
* **Público objetivo:** Las 5–10 marcas más reconocidas de la ciudad (las cadenas y locales icónicos que generan el 50% de la demanda).
* **Costo fijo:** **$95.000 ARS / mes**.
* **Comisión por venta:** **0% de comisión** *(el comercio conserva el 100% del valor de su venta)*.
* **Características exclusivas:**
  - **Posicionamiento VIP en Portada:** Banners destacados rotativos en la Home ("Cadenas Destacadas" y "Ofertas de la Semana").
  - **Primeros puestos en su categoría** *(cupos limitados a 2-3 locales por rubro para mantener la exclusividad)*.
  - **Bot de WhatsApp con IA Ilimitado:** Procesamiento ilimitado de notas de voz, texto y consultas frecuentes (horarios, zonas de envío, opciones celíacos/veganos).
  - **Módulo de Promociones:** Creación de cupones, 2x1 y envíos bonificados visibles en la portada.
  - **Multi-usuario y Roles de Equipo:** Cuentas diferenciadas para Cajero, Cocinero y Administrador.
  - **Reportes Avanzados:** Tasa de recompra de clientes, ticket promedio y comparativa con el rubro.

---

## 3. Matriz Comparativa de Planes

| Funcionalidad / Beneficio | Plan Inicial (Gratis) | Plan Impulso ($45k/mes) | Plan Líder ($95k/mes) |
|---|:---:|:---:|:---:|
| **Abono fijo mensual** | **$0** | **$45.000** | **$95.000** |
| **Comisión por venta concretada** | **7%** | **3.5%** | **0%** |
| **Límite de productos en carta** | Hasta 15 | Ilimitados | Ilimitados |
| **Panel de control de pedidos en vivo** | ✅ Básico | ✅ Avanzado | ✅ Avanzado |
| **Menú QR para mostrador y mesas** | Estándar | Personalizado | Kit Oficial con Logo |
| **Bot de WhatsApp con IA (Audios + Texto)** | ❌ (Link directo) | ✅ Hasta 200 ped/mes | ✅ **Ilimitado** |
| **Generación de Magic Link con JWT** | ❌ | ✅ | ✅ |
| **Checkout Mercado Pago integrado** | ✅ | ✅ | ✅ |
| **Gestión de tiempos de cocina (1 toque)** | Básico | ✅ 15/25/35/45m | ✅ 15/25/35/45m |
| **Módulo de asignación a repartidores** | Básico | ✅ Completo | ✅ Completo |
| **Posicionamiento en Marketplace** | Estándar | Relevante | ⭐ **VIP en Portada** |
| **Promociones destacadas en Home** | ❌ | ❌ | ✅ Banners rotativos |
| **Reportes y Analytics** | Básico | Intermedio | ✅ Avanzado |
| **Roles de equipo (Cajero/Cocina/Admin)** | 1 cuenta | 2 cuentas | Ilimitadas |
| **Soporte técnico** | Estándar | Prioritario | Dedicado 1 a 1 |

---

## 4. Arquitectura del Bot de IA en WhatsApp & Magic Links (JWT)

### 4.1. El Problema que Resuelve
En ciudades del interior, **más del 70% de los pedidos se realizan por notas de voz en WhatsApp**. Durante las horas pico (21:00 a 23:00 hs), los dueños y cajeros colapsan escuchando decenas de audios simultáneos.

### 4.2. Flujo de Integración Paso a Paso

```
[Cliente envía Audio/Texto por WhatsApp]
                 │
                 ▼
[Webhook en Next.js (/api/bot/webhook)]
                 │
                 ▼
[Gemini 2.5 Flash transcribe y parsea contra el Catálogo del Local]
                 │
                 ▼
[Backend genera Pedido Temporal + Firma JWT con expiración (30 min)]
                 │
                 ▼
[Bot responde: "Tu pedido está listo 👉 bolivarpide.com/t/eyJhbGci..."]
                 │
                 ▼
[Cliente abre URL ➔ Paga con Mercado Pago / Elige Efectivo]
                 │
                 ▼
[Pedido aparece en tiempo real en el Dashboard del Comercio (/negocio/pedidos)]
```

### 4.3. Especificación del Payload JWT para el Magic Link

El token JWT permite que el cliente abra su ticket interactivo con un solo toque desde WhatsApp sin requerir inicio de sesión previo:

```json
{
  "order_id": "ord-temp-84920",
  "business_id": "biz-don-luis",
  "customer_phone": "+5492314558291",
  "customer_name": "Valentina Paz",
  "delivery_address": "Av. San Martín 452, Piso 2A",
  "items": [
    { "id": "prod-1", "name": "Pizza Muzzarella Gigante", "qty": 1, "price": 6800 },
    { "id": "prod-4", "name": "Empanada Carne Cuchillo", "qty": 2, "price": 1500 }
  ],
  "subtotal": 9800,
  "delivery_fee": 1200,
  "total": 11000,
  "iat": 1756224000,
  "exp": 1756225800
}
```

---

## 5. Análisis de Costos y Rentabilidad

### 5.1. Costo de Infraestructura Base (Mensual)
* **Frontend & Edge Hosting (Vercel Pro):** ~$20 USD (~$26.000 ARS).
* **Base de Datos & Auth (Supabase Pro):** ~$25 USD (~$32.500 ARS).
* **Dominio, DNS & Emails (Cloudflare + Resend):** ~$10 USD (~$13.000 ARS).
* **Gastos Administrativos / Contador:** ~$60.000 ARS.
* **Marketing local continuo:** ~$80.000 ARS.
* **Subtotal Costo Fijo:** **~$211.500 ARS / mes**.

### 5.2. Costo Unitario de Procesamiento de IA (Gemini 2.5 Flash + WhatsApp API)
* **Gemini 2.5 Flash:** Audio de 20s + Prompt + Salida JSON ≈ $0,0004 USD (~$0,52 ARS) por pedido.
* **WhatsApp Cloud API (Meta):**
  - Primeras **1.000 conversaciones de servicio al mes son GRATIS**.
  - A partir de la conversación 1.001: ~$0,035 USD (~$45 ARS) por ventana de 24 hs.
* **Costo promedio por pedido con IA:** **~$45 a $50 ARS**.

> [!TIP]
> **Margen del Bot:** En el Plan Impulso ($45.000 ARS), si un comercio procesa 150 pedidos por IA, el costo de API para la plataforma es de apenas ~$6.750 ARS. El margen operativo del plan supera el **85%**.

---

## 6. Proyección Financiera (Equipo de 3 Socios en Bolívar)

Meta del equipo: **$6.000.000 ARS netos mensuales distribuibles ($2.000.000 ARS por socio)**.

```
Evolución de Ingresos y Reparto
┌─────────────────┬──────────────────┬──────────────────┬─────────────────┬──────────────────┐
│ Etapa           │ Comercios Activos│ Ingresos Brutos  │ Costos Totales  │ Ganancia x Socio │
├─────────────────┼──────────────────┼──────────────────┼─────────────────┼──────────────────┤
│ Mes 3 (Piloto)  │ 25 comercios     │ $1.050.000 ARS   │ $240.000 ARS    │ ~$270.000 ARS    │
│ Mes 6 (Tracción)│ 50 comercios     │ $2.450.000 ARS   │ $310.000 ARS    │ ~$713.000 ARS    │
│ Mes 12 (Escala) │ 85 comercios     │ $4.650.000 ARS   │ $420.000 ARS    │ ~$1.410.000 ARS  │
│ Mes 18 (Pleno)  │ 120 comercios    │ $6.800.000 ARS   │ $560.000 ARS    │ ~$2.080.000 ARS  │
└─────────────────┴──────────────────┴──────────────────┴─────────────────┴──────────────────┘
```

### Composición de Ingresos en Régimen (120 Comercios):
* **60 comercios en Plan Inicial (Gratis):** ~$900.000 ARS en comisiones (7% sobre pedidos chicos).
* **45 comercios en Plan Impulso ($45.000):** $2.025.000 ARS en abonos + ~$800.000 ARS en comisiones reducidas = **$2.825.000 ARS**.
* **15 comercios en Plan Líder ($95.000):** **$1.425.000 ARS** en abonos fijos.
* **Publicidad extra / Banners de marca:** ~$450.000 ARS.
* **Ingresos Brutos:** **$5.600.000 - $6.800.000 ARS / mes**.
* **Excedente Neto Distribuible:** **~$5.040.000 a $6.240.000 ARS / mes**.

---

## 7. Estrategia de Cierre Comercial en Bolívar

1. **El argumento de venta inicial (Cero Fricción):**
   > *"Entrar a BolivarPide no te cuesta un solo peso. Te armamos la carta digital, te damos el QR y te ponemos en la app gratis. Solo pagás un 7% si te traemos una venta. Si después querés que nuestro bot de WhatsApp atienda tus audios automáticamente y te baje la comisión al 3.5%, te pasás al plan de $45.000 cuando quieras."*
2. **Efecto FOMO y Cupos de Exclusividad en Plan Líder:**
   - Comunicar que solo hay **2 cupos por rubro** (ej: 2 pizzerías, 2 hamburgueserías) para aparecer en el carrusel principal de la portada. Esto acelera el cierre de las marcas líderes.
3. **Cobro Automatizado:**
   - Débito automático mensual o link recurrente vía Mercado Pago integrado en el panel del comercio (`/negocio/configuracion`).
