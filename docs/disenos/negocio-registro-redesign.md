# Negocio/Registro — Redesign Plan

> ⚠️ **Este es un documento de planificación.** Ninguno de los cambios descritos aquí está implementado aún. Sirve como guía para diagramar el flujo antes de codificar.

---

## 0. Fuente oficial de iconos — Material Symbols

**Todos los iconos del proyecto deben venir de [Material Symbols](https://fonts.google.com/icons) (Google Fonts).** Queda prohibido usar:
- `lucide-react` ❌
- Emojis nativos en UI (`🍔`, `💊`, etc.) ❌
- SVGs custom animados ❌

### Recursos

| Recurso | URL |
|---|---|
| **Librería de iconos** (buscar nombres) | https://fonts.google.com/icons |
| **Documentación técnica** (FILL axis, variable font, CSS API) | https://developers.google.com/fonts/docs/material_symbols |
| **Repositorio GitHub** (glyphs, codepoints) | https://github.com/google/material-design-icons |

### Reglas de implementación

1. Buscar el icono en https://fonts.google.com/icons — el **nombre snake_case** que aparece en el panel es el que se usa como ligadura
2. Usar siempre la **variable font** con los ejes `FILL`, `wght`, `GRAD`, `opsz`
3. El eje `FILL` se anima vía CSS registrando `@property --ms-fill`
4. La URL de carga debe incluir `&display=block` para evitar FOUC
5. Para optimizar payload, usar el parámetro `&icon_names=...` con la lista de iconos usados

---

## 1. Objetivo

Rediseñar la sección de registro de negocio (`/negocio/registro`) con:

- **Carrusel de categorías** tipo Dribbble (horizontal scrollable, iconos circulares/pills)
- **Animación FILL** en todos los iconos interactivos (business type, specialty, nav tabs, categorías home)
- **Scrollbar smooth** con la estética Cherry Cola
- Rendimiento optimizado en mobile

---

## 2. Problemas detectados (feedback actual)

- **Carrusel no centrado**: los items del grid actual están alineados a la izquierda dentro de la card
- **FILL animation incompleta**: categorías del home (page.tsx) y campanita de notificaciones no tienen FILL
- **Mobile lento**: al seleccionar categoría, la transición se siente pesada (posible culpa de framer-motion `whileHover`/`whileTap` en grids grandes)
- **Scrollbar**: la scrollbar vertical debe ser más smooth y respetar la paleta Cherry Cola (`#9a0002`)

---

## 3. Diseño del Carrusel Curvo (solo en home page / index)

Referencia visual compartida: círculo grande de publicidad arriba + carrusel curvo debajo.

### Estructura general

```
         ╭──────────────────────╮
        ╱     🎯 CATEGORÍA      ╲      ← Círculo grande. Por defecto muestra
       │      ACTIVA / PROMO     │         promo rotativa (PROMO_BANNERS
        ╲                      ╱          existentes). Al seleccionar del
         ╰──────────┬──────────╯           carrusel, la promo se reemplaza
                    │                      por el icono + nombre de la
                    │                      categoría activa con fondo gradiente.
                    │                      El radio del círculo define el arco.
                    │
     ───●────●────●────●────●───   ← Items sobre el MISMO arco que el círculo
        🏪    💊    🍬    ☕    🛒      (circunferencia compartida). El centro
        R     F     K     C     A       del círculo y el centro del arco tienen
                                        el mismo origen geométrico. Los items
                                        se posicionan con translateY calculado
                                        por JS (función seno o coseno).
                    │
          ════════════════        ← Scrollbar horizontal funcional.
          (curva Cherry Cola)        Sigue la misma curvatura del arco.
                                    Solo visible si hay overflow (más items
                                    de los que entran en pantalla).
                                    Color: #9a0002.
                    │
       ┌──────────────────────────────┐
       │  Subcategorías (Restaurante) │  ← SOLO si seleccionó Restaurante.
       │  [Empanadas] [Pizza] [Sushi] │     "Nace" un segundo carrusel curvo
       │  [Helados] [Asado] ...       │     idéntico al primero: mismo arco,
       │  Las 25 especialidades        │     fade mask, scrollbar curva,
       │  del registro de negocio     │     items circulares con icono + label.
       └──────────────────────────────┘
```

### Comportamiento detallado

#### 1. Círculo de publicidad / categoría activa

- Por defecto muestra una promo rotativa del array `PROMO_BANNERS`
- Cada promo se adapta a formato circular:
  - Fondo: gradiente (`from-[x] to-[y]`)
  - Icono Material Symbol grande (reemplaza el emoji actual)
  - Título corto
- Al seleccionar una categoría del carrusel:
  - El círculo hace transición suave (crossover) mostrando el icono de la categoría seleccionada + su label
  - Fondo: mantiene el gradiente de la promo activa pero con el icono de la categoría
- Si se deselecciona, vuelve a la promo rotativa

#### 2. Carrusel curvo (categorías principales)

- Items: círculos chicos con icono Material Symbol + nombre de categoría debajo
- Posicionados sobre un **arco invisible** que es la prolongación de la circunferencia del círculo grande de publicidad
- **Mismo origen geométrico**: el radio del círculo de promo define la curvatura del arco donde montan los items
- JS calcula `translateY` para cada item usando función trigonométrica basada en su posición horizontal relativa al centro del viewport (ej: `sin(ángulo) * radio`)
- Los items del centro quedan más abajo (punto más bajo del arco); los de los bordes suben hacia los extremos
- **Scroll horizontal**: `overflow-x-auto` nativo, scrollbar oculta por defecto
- **Fade mask**: `mask-image: linear-gradient(to right, transparent 0%, white 8%, white 92%, transparent 100%)` para desvanecer items al salir de pantalla

#### 3. Selección de categoría (animación)

- Al hacer click en un item:
  1. **Reordenamiento**: los items se desplazan horizontalmente para que el seleccionado quede en la posición más cercana al centro. Animación fluida con framer-motion `layout` o `AnimatePresence`
  2. **Zoom al círculo**: el item seleccionado anima hacia arriba (hacia el círculo de promo). El círculo transiciona mostrando la categoría activa
  3. Si es **Restaurante**: "nace" un segundo carrusel curvo debajo con las 25 especialidades
  4. Si es **otra categoría**: no aparecen subcategorías
- Al seleccionar otra categoría: el carrusel de subcategorías (si existe) se reemplaza por el nuevo

#### 4. Subcategorías (solo Restaurante)

- Segundo carrusel curvo idéntico al primero:
  - Mismo arco (misma curvatura)
  - Mismo fade mask
  - Misma scrollbar curva funcional
  - Items: círculos chicos con icono Material Symbol + nombre de especialidad
  - Usa los mismos datos que `RESTAURANT_CATEGORIES` de negocio/registro (25 especialidades)
- Aparece con animación fluida (opacity + translateY desde abajo)
- Scroll independiente del carrusel principal

#### 5. Scrollbar curva funcional

- Controla el scroll horizontal del carrusel (nativa o custom con JS)
- Sigue visualmente la misma curvatura del arco
- Color: `#9a0002` (Cherry Cola) con hover `#c62828`
- Solo visible si hay overflow (más items que los que entran en pantalla)
- Si todos los items entran, no se muestra
- Diseño:
  - Track: transparente
  - Thumb: `#9a0002`, `border-radius: 8px`
  - Posicionada justo debajo del carrusel, siguiendo el arco

### Datos que alimentan el carrusel

| Carrusel | Fuente de datos |
|---|---|
| Categorías principales | `CATEGORIES` (src/lib/mockData.ts): Restaurantes, Kioscos, Farmacias, Cafeterías |
| Subcategorías (Restaurante) | `RESTAURANT_CATEGORIES` (src/app/negocio/registro/page.tsx): 25 especialidades |
| Promos | `PROMO_BANNERS` (src/lib/mockData.ts): 3 promos actuales, adaptadas a formato circular |

### Consideraciones técnicas

- **Curvatura**: JS calcula `translateY` en tiempo real según scroll y resize. Usar `requestAnimationFrame` o `useSpring` de framer-motion para suavizar.
- **Reordenamiento**: los items deben tener `layout` prop de framer-motion para animación fluida de reordenamiento.
- **Overflow**: en carrusel de subcategorías (25 items), es probable que siempre haya overflow → scrollbar visible.
- **Responsive**: en mobile los items son más chicos, en desktop pueden entrar más items sin scroll.
- **Promos circulares**: reemplazar emojis por Material Symbols, conservar gradientes. El círculo debe ser `aspect-ratio: 1/1` y responsivo.

---

## 4. Mapeo de iconos (Material Symbols)

> ⚠️ **Verificar cada nombre en https://fonts.google.com/icons antes de implementar.** No todos los nombres propuestos abajo existen. Si un icono no está disponible, buscar el alternativo más cercano en la librería.

### BUSINESS_TYPES

| id | Emoji actual | Material Symbol propuesto |
|---|---|---|
| restaurante | 🍔 | `restaurant_menu` |
| farmacia | 💊 | `medication` |
| kiosko | 🍬 | `storefront` |
| cafe | ☕ | `local_cafe` |
| almacen | 🛒 | `shopping_cart` |
| otro | 📦 | `inventory_2` |

### RESTAURANT_CATEGORIES

| id | Emoji actual | Material Symbol propuesto |
|---|---|---|
| empanadas | 🥟 | `dumpling` |
| hamburguesas | 🍔 | `restaurant_menu` |
| pizza | 🍕 | `local_pizza` |
| sushi | 🍣 | `set_menu` |
| helados | 🍦 | `icecream` |
| asado | 🍖 | `barbecue` |
| italiana | 🍝 | `ravioli` |
| cafe | ☕ | `local_cafe` |
| panaderia | 🥐 | `bakery_dining` |
| saludable | 🥑 | `nutrition` |
| sandwiches | 🥪 | `lunch` |
| vegetariana | 🥗 | `eco` |
| desayunos_meriendas | 🥞 | `breakfast` |
| jugos | 🥤 | `local_drink` |
| mexicana | 🌮 | `taqueria` |
| milanesas | 🥩 | `dinner` |
| asiatica | 🍛 | `ramen` |
| pollo | 🍗 | `poultry` |
| postres | 🍰 | `cake` |
| internacional | 🗺️ | `globe` |
| peruana | 🇵🇪 | `flag` |
| pescados | 🐟 | `fishing` |
| arabe | 🕌 | `mosque` |
| hot_dogs | 🌭 | `lunch` |
| argentina | 🇦🇷 | `flag` |

---

## 5. Estrategia FILL Axis

Basado en la documentación oficial: https://developers.google.com/fonts/docs/material_symbols#fill_axis

> *"Fill gives you the ability to modify the default icon style. A single icon can render both unfilled and filled states. To convey a state transition, use the fill axis for animation or interaction. The values are 0 for default or 1 for completely filled."*

### Implementación CSS

Usar `@property --ms-fill` para registrar la propiedad como `<number>` y poder animarla vía CSS transitions:

```css
@property --ms-fill {
  syntax: '<number>';
  initial-value: 0;
  inherits: true;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' var(--ms-fill, 0), 'wght' 400, 'GRAD' 0, 'opsz' 24;
  transition: --ms-fill 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

- FILL `0` → estado unfilled (default)
- FILL `1` → estado filled (seleccionado)

### Dónde aplicar FILL

| Elemento | Estado | Prop fill |
|---|---|---|
| Carrusel categorías (negocio/registro) | isSelected | `fill={selected === item.id}` |
| Especialidades restaurante | isSelected | `fill={selected === cat.id}` |
| Grid categorías home (page.tsx) | isActive | `fill={activeCategory === cat.id}` |
| Nav tabs | isActive | `fill={currentTab === id}` |
| Campanita notificaciones | showDropdown | `fill={showNotificationDropdown}` |
| Location button | showDropdown | `fill={showLocationDropdown}` |

---

## 6. Scrollbar Design

> La scrollbar debe moverse suave (`scroll-behavior: smooth`) y respetar la paleta Cherry Cola. Aplica tanto a la scrollbar vertical derecha del documento como a contenedores con scroll interno.

### Scrollbar global (documento)

- **Ancho**: 6px (vertical) / 6px (horizontal)
- **Color thumb**: `#9a0002` (Cherry Cola)
- **Hover thumb**: `#c62828` (Cherry Mid)
- **Track**: transparente
- **Border radius**: 8px
- **Comportamiento**: `scroll-behavior: smooth` en `<html>`

### Scrollbar derecha principal

La scrollbar vertical de la derecha debe ser la misma que la global — no oculta, siempre visible, con el thumb de Cherry Cola. No aplicar `no-scrollbar` al `<body>`.

### Clase utilitaria `.custom-scrollbar`

Para contenedores internos con scroll (especialidades, notificaciones, etc.), usar la misma estética:

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #9a0002;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #c62828;
}
```

### Soporte Firefox

```css
* {
  scrollbar-width: thin;
  scrollbar-color: #9a0002 transparent;
}
```

---

## 7. Mobile Performance

- Evitar `whileHover`/`whileTap` de framer-motion en grids grandes (causa lag)
- Preferir `active:scale-95` de Tailwind + CSS transitions
- `AnimatePresence` solo para cambios de paso, no para micro-interacciones
- Usar `will-change: transform` solo en elementos animados críticos

---

## 8. Data Flow

```
BUSINESS_TYPES ──→ Carrusel ──→ selected ──→ ¿restaurante?
                      │                         │
                      │                    ┌─────┴─────┐
                      │                    Sí          No
                      │                    │           │
                      │              Especialidades  "No aplica"
                      │                    │
                      └────────────────────┘
                           validateStep1()
```

### Estados

- **Idle**: Ninguna categoría seleccionada. Carrusel centrado, iconos unfilled, specialty grid oculto.
- **Selected**: Categoría con icono filled + anillo. Specialty visible si aplica.
- **Error**: Validation error message debajo del carrusel (ya existe).

---

## 9. Font loading (layout.tsx)

En `src/app/layout.tsx`, dentro del `<head>`, cargar la variable font con los ejes necesarios:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=restaurant_menu,storefront,medication,local_cafe,shopping_cart,inventory_2,dumpling,local_pizza,set_menu,icecream,barbecue,ravioli,bakery_dining,nutrition,lunch,eco,breakfast,local_drink,taqueria,dinner,ramen,poultry,cake,globe,flag,fishing,mosque,home,explore,shopping_cart,badge,search,expand_more,star,schedule,arrow_forward,close,arrow_back,edit,add,location_on,location_home,notifications,arrow_back,store,smartphone,mail,check,chevron_right,auto_awesome,error,bolt,trending_up,verified,group,chat,person,sync,remove&display=block"
  rel="stylesheet"
/>
```

> La lista `icon_names` debe estar en **orden alfabético** y contener **todos** los iconos usados en el proyecto. Esto optimiza el payload de ~295 KB (full set) a ~2-5 KB.

---

## 10. Próximos pasos

1. ⬜ Definir diseño exacto del carrusel (ver imagen de referencia)
2. ⬜ Verificar cada nombre de icono en https://fonts.google.com/icons
3. ⬜ Decidir si SpecialtyGrid reemplaza el scroll actual o es igual
4. ⬜ Implementar cambios en orden: CSS → componente → integración
