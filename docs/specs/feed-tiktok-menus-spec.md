# Feed de Menús Estilo Reels

> **Documento:** `docs/specs/feed-tiktok-menus-spec.md`  
> **Estado:** 🟢 Spec de implementación (MVP)  
> **Alcance:** Visor a pantalla completa del menú de un local (Modo A). Likes simples. Sin motor de recomendación.

---

## 1. Problema y solución

Las cartas en grilla/lista exigen leer antes de decidir. La comida entra por los ojos.

**MVP:** un feed vertical full-screen (`100dvh`) del catálogo de **un** comercio: swipe plato a plato, foto (o fallback de ícono), like y add-to-cart sin salir del modo.

Fuera de alcance en esta versión: feed global “Para Ti”, scoring, telemetría de dwell/skip, perfiles de gusto. Ver §8.

---

## 2. Punto de entrada (solo Modo A)

| Modalidad | Origen | Alcance | Salir |
| :--- | :--- | :--- | :--- |
| **A. Menú local** | CTA “Ver en Reels” en `/c/[slug]`, o tap en la foto de un producto | Solo productos del comercio activo | Vuelve a `/c/[slug]` (misma posición de scroll si es viable) |

Ruta sugerida: overlay o `/c/[slug]/reels?dish=[productId]` para deep link / share.

**Modo B (Discovery global)** queda diferido hasta validar uso del Modo A y cobertura de fotos reales.

---

## 3. Anatomía de pantalla

```
┌──────────────────────────────────────────────────────────┐
│ [← Salir]                        [Local • Abierto]       │
│                                                          │
│                 CANVAS (foto o ícono)                    │
│                                          [Avatar local]  │
│                                          [ ❤️  n ]       │
│                                          [ 🛒+ ]         │
│                                          [ ↗️ ]          │
│                                                          │
│ Categoría                                                │
│ Título del producto                                      │
│ Descripción (2 líneas + “más”)                           │
│ $4.800                                                   │
└──────────────────────────────────────────────────────────┘
```

### 3.1. Medios (`products.image_path` / `products.icon_path`)

**Con foto real (`image_path`):**
1. Fondo: misma imagen en `object-cover` + blur fuerte + overlay oscuro.
2. Hero: imagen nítida centrada, aspect-ratio original, `rounded-2xl`, sin forzar crop 9:16.
3. Pinch/zoom: opcional post-MVP.

**Sin foto (solo `icon_path`):**
1. Fondo: gradiente suave (paleta del negocio o categoría).
2. Ícono centrado en marco ~1:1 o 3:2 (`max-w-[280px]`).
3. Más peso tipográfico en título / descripción / ingredientes.

**Prerrequisito de producto:** medir qué % de productos publicados tienen `image_path`. Si la cobertura es baja, el feed no cumple la promesa visual — priorizar captura de fotos en comercios antes de invertir en Modo B.

### 3.2. Overlays

**Top**
- Salir: hit target ≥ 44×44, cápsula `bg-black/35 backdrop-blur`.
- Chip del local (nombre + “Abierto” / ETA si ya existe en el hub). Tap → info del comercio (sheet o navegación existente).

**Bottom-left**
- Categoría, título, descripción truncada (2 líneas) + “más” → sheet ligero con ingredientes (`products.ingredients`).
- Precio formateado.

**Right rail**
1. Avatar del local (`logo_path`).
2. Like (corazón + contador). Doble tap en el canvas = like (animación simple; sin partículas elaboradas en MVP).
3. Añadir al carro — ver §5.
4. Compartir: Web Share API o copiar `/c/[slug]?dish=[productId]` (o la ruta reels).

---

## 4. Likes (tontos)

Contador + persistencia. No alimentan ranking ni perfil de gusto en esta versión.

```sql
CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text, -- invitados
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_likes_product ON public.product_likes(product_id);
```

- Autenticados: fila con `user_id`.
- Invitados: `session_id` en `localStorage`; opcional merge al login (puede ser “ponytail: merge lazy al primer like post-auth”).
- Contador: `count(*)` por `product_id` (o columna denormalizada si el volumen lo pide después).
- Unlike = borrar la fila.

Sin tabla `feed_interactions`. Sin `user_taste_profiles`.

---

## 5. Carrito

Reusar lo existente; no inventar otro flujo.

- `useCart()` → `quickAdd` / `openProduct` / `confirmAdd`.
- Sin opciones requeridas → `quickAdd(item)`.
- Con opciones requeridas (`requiredOptionsMissing`) → abrir `ProductSheet` (drawer) sobre el feed sin perder el slide actual.
- Multicomercio: el `SwitchDialog` existente si el carrito es de otro local.
- Badge en el botón carro = cantidad ya en carrito de ese producto (si el estado del cart lo expone fácil; si no, omitir en v1).

---

## 6. Rendimiento

1. **Scroll snap nativo:** `scroll-snap-type: y mandatory` + `scroll-snap-align: start`. Sin librería de gesture.
2. **Virtualización mínima:** en DOM solo ~3 slides (prev / current / next). Precargar imagen del next.
3. **Assets:** `next/image` + WebP vía Storage; tamaños acordes al viewport.

---

## 7. Fases

```
Fase 1 (MVP — ahora)
├── Visor snap 100dvh, Modo A
├── Foto real vs ícono
├── Overlays mínimos + salir
├── Integración useCart / ProductSheet
└── Share deep link

Fase 2 (si Fase 1 se usa)
├── product_likes + contador + doble tap
└── Persistencia auth + guest básico

Fase 3 (solo con evidencia)
├── Cobertura de fotos OK
├── Uso medible del Modo A (scroll + add-to-cart)
└── Entonces: RFC de Discovery / recomendación (§8)
```

Criterio de éxito Fase 1–2: gente scrollea y agrega al carrito desde el feed. Si no, no escalar.

---

## 8. Diferido — Discovery y recomendación

No implementar hasta validar MVP. Ideas aparcadas (no son requisitos):

- Modo B “Para Ti” multi-local en radio Bolívar.
- Señales: dwell, skip, share, checkout → pesos.
- `feed_interactions`, `user_taste_profiles`, vector de ingredientes, fórmula de scoring, cold-start trending, factor exploración 20%.

Cuando corresponda: documento aparte `feed-recomendacion-rfc.md`, no inflar esta spec.

---

## 9. Dependencias del código actual

| Pieza | Dónde |
| :--- | :--- |
| `image_path`, `icon_path`, `ingredients`, `options` | `products` + `menuTypes` / `menuQueries` |
| `quickAdd`, `requiredOptionsMissing`, `ProductSheet` | `CartProvider`, `cart.ts`, `cart/ProductSheet` |
| Switch de local | flujo carrito existente |
| Hub / carta del local | `/c/[slug]`, `StoreHubView` / home data |

---

## 10. Resumen

Ship el visor inmersivo in-store + carrito. Likes como contador opcional. Recortar ML, telemetría fina y feed global hasta tener fotos y uso real.
