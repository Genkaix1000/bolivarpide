# Plan de Refactorización: Header Ovalado + Categorías

## Objetivo

Rediseñar el header principal de la home para que tenga forma de **óvalo apuntando hacia abajo** (arco elíptico), con los controles (search, tema, notificaciones) en la parte superior, la ubicación en el centro, y las categorías siguiendo la geometría del borde curvo.

---

## Problemas actuales

| # | Problema | Archivo | Ubicación |
|---|---|---|---|
| 1 | El header es un **rectángulo rojo** con un arco SVG decorativo abajo. Debe ser un óvalo real (arco elíptico). | `CurvedHomeHeader.tsx` | L579 |
| 2 | Las categorías **suben en el centro** (van hacia arriba) porque el arco actual es cóncavo desde el header. Con un óvalo apuntando hacia abajo, las categorías del centro deben estar **más abajo** y las de los extremos **más arriba**. | `CurvedHomeHeader.tsx` | Función `arcY()` L86-92 |
| 3 | **Dropdown de ubicación no funciona:** al clickear no se abre el menú de direcciones. Además cuando funcionaba, el backdrop blurreaba todo incluyendo la ubicación. | `page.tsx` + `CurvedHomeHeader.tsx` | L468-475, L510-531 |
| 4 | **Padding insuficiente** entre la search bar y los elementos del header. | `CurvedHomeHeader.tsx` | L599, L664 |
| 5 | Las categorías **no están sobre el borde** del arco. El centro del círculo de cada categoría debe pasar por el límite del óvalo (actualmente hay `ICON_OVERLAP = 14` que las desplaza). | `CurvedHomeHeader.tsx` | L57 |
| 6 | **Demasiado espacio** entre categorías en el centro, y poco en los extremos. Deben estar más juntas en el centro y más espaciadas hacia los lados. | `CurvedHomeHeader.tsx` | `FitArcCarousel` L258-301 |
| 7 | **Orden de categorías incorrecto**. Debe ser: Kioscos → Cafeterías → Restaurantes → Farmacias (de izq. a der.). | `mockData.ts` | L58-95 |
| 8 | **Animación de subcategorías distorsiona la curva.** Al hacer scroll en las subcategorías de restaurante, la animación de entrada `y: 10` hace que los elementos "salten desde abajo" deformando la geometría del arco. | `CurvedHomeHeader.tsx` | L782-787 |
| 9 | **Reemplazo vs. expansión:** Actualmente al clickear Restaurantes las categorías principales son **reemplazadas** por subcategorías. Deberían **aparecer debajo** de las categorías principales sin reemplazarlas. | `CurvedHomeHeader.tsx` | `selectCategory()` L550-562 |

---

## Fases de implementación

### Fase 1: Cambiar la geometría del header a óvalo (arco elíptico) ✅ COMPLETA

**Archivo:** `src/components/CurvedHomeHeader.tsx`

**Estado:** Implementada (SVG elíptico, layout interno, overscan para ocultar esquinas, curva tendida).

#### 1.1 Reemplazar el rectángulo rojo por un SVG con arco elíptico

- El div rojo actual (`absolute inset-0 bg-gradient-to-b...`) y el SVG del arco se reemplazan por **un solo SVG** que dibuja el header ovalado completo.
- El header tiene el borde plano arriba (pegado al top de la pantalla) y un arco elíptico hacia abajo.
- El path: línea horizontal en el top, luego un arco elíptico con radios RX y RY independientes.

**Geometría nueva:**

```
  0,0 ───────────────────── W,0    ← borde superior recto
     ╲                               ← extremos suben suavemente
      ╲     (óvalo rojo)            ← el centro baja más
       ╲                             ← arco elíptico RX >> RY
        ╲___╱                        ← punto más bajo en el centro
```

- **RX (radio horizontal):** `width / 2` — controla el ancho del arco.
- **RY (radio vertical):** `sagitta` — controla la profundidad.
- **Ventaja sobre el arco circular:** RX y RY son independientes, lo que permite un arco más tendido sin distorsión. Al ser una elipse, la función `arcY` es más simple y precisa.

**Pseudocódigo del nuevo path SVG:**
```tsx
function ovalPath(width: number, rx: number, ry: number): string {
  // Arco elíptico de (0,0) a (width,0), bulging downward.
  // sweep-flag=0 → antihorario en SVG y-down → baja en el centro.
  return `M 0 0 A ${rx} ${ry} 0 0 0 ${width} 0 Z`;
}
```

#### 1.2 Ajustar el layout interno del header

Con el óvalo ocupando todo el header, los controles internos (search, tema, notificaciones, ubicación) deben distribuirse verticalmente dentro de la forma curva:

- **Top (~15% de la altura total):** Search bar + theme toggle + notifications (misma fila horizontal).
- **Centro (~50-55% de la altura):** Ubicación ("Ubicación actual" + dirección).
- **Bottom:** El borde curvo del óvalo donde se montan las categorías.

El padding interno debe calcularse para que los elementos no se salgan del óvalo en los extremos (donde hay menos altura).

---

### Fase 2: Invertir la geometría del arco para categorías (elíptica) ✅ COMPLETA

**Archivo:** `src/components/CurvedHomeHeader.tsx`

**Estado:** Implementada (`arcY` elíptica invertida, `ICON_OVERLAP` eliminado, geometría unificada con el óvalo del header).

#### 2.1 Nueva geometría: `ArcGeometry` con radios elípticos

```tsx
interface ArcGeometry {
  width: number;
  sagitta: number;
  rx: number;  // radio horizontal de la elipse = width / 2
  ry: number;  // radio vertical de la elipse = sagitta
  cx: number;  // centro horizontal = width / 2
}

function computeArc(width: number): ArcGeometry {
  const W = Math.max(width, 1);
  // sagitta se calcula responsive: más profundo en móvil, clamp en desktop
  const s = Math.min(180, Math.max(100, W * 0.38));
  return {
    width: W,
    sagitta: s,
    rx: W / 2,
    ry: s,
    cx: W / 2,
  };
}
```

#### 2.2 Nueva función `arcY` para arco elíptico

La ecuación de la elipse: `(x - cx)² / rx² + y² / ry² = 1`
Despejando y (solo la mitad inferior, y >= 0):

```tsx
function arcY(x: number, geo: ArcGeometry): number {
  const clamped = Math.min(Math.max(x, 0), geo.width);
  const dx = (clamped - geo.cx) / geo.rx;        // normalizado a [-1, 1]
  if (Math.abs(dx) >= 1) return 0;                // fuera de la elipse → borde
  return geo.ry * Math.sqrt(1 - dx * dx);         // y en la mitad inferior de la elipse
}
```

**Efecto:**
- Centro (`x = cx`): `y = ry = sagitta` → más abajo
- Bordes (`x = 0` o `x = W`): `y = 0` → más arriba
- La curva es suave y elíptica — las categorías siguen exactamente el borde del óvalo

#### 2.3 Eliminar `ICON_OVERLAP` / alinear centro del ícono

El centro del círculo de cada categoría debe pasar **exactamente por el borde del óvalo**:
- `ICON_OVERLAP` eliminado (ya no se usa el solape fijo de 14px).
- `translateY = arcY(x, geo) - ICON_CENTER`, donde `ICON_CENTER = 29` (radio del círculo de 58px), para que el centro del ícono quede sobre la curva y no el top del botón.

#### 2.4 Actualizar altura del stage del carousel

```tsx
height: geo.sagitta + ITEM_BOX - ICON_CENTER
```

---

### Fase 3: Reordenar categorías ✅ COMPLETA

**Archivo:** `src/lib/mockData.ts`

**Estado:** Implementada — orden izq.→der.: Kioscos → Cafeterías → Restaurantes → Farmacias.

Cambiar el orden del array `CATEGORIES`:

```
Antes:  [restaurants, kiosks, pharmacies, cafes]
          0             1        2           3

Después: [kiosks, cafes, restaurants, pharmacies]
          0        1       2             3
```

**Nuevo orden (izquierda → derecha):**

| Posición | ID | Nombre | Icono | Lado |
|---|---|---|---|---|
| 0 | `kiosks` | Kioscos | `storefront` | ← Izquierda |
| 1 | `cafes` | Cafeterías | `local_cafe` | ← Izquierda |
| 2 | `restaurants` | Restaurantes | `restaurant_menu` | → Derecha |
| 3 | `pharmacies` | Farmacias | `medication` | → Derecha |

---

### Fase 4: Agrupar categorías hacia el centro con mismo gap ✅ COMPLETA

**Archivo:** `src/components/CurvedHomeHeader.tsx` → `FitArcCarousel`

**Estado:** Implementada — `edgePad = max(ITEM_BOX/2+2, width*0.18)` en Fit y en la detección de fit de `ArcCarousel`.

#### 4.1 Misma distancia entre items, pero agrupados al centro

Las categorías deben mantener **la misma distancia entre sí** (gap uniforme), pero en lugar de distribuirse ocupando todo el ancho disponible, el grupo completo debe desplazarse hacia el centro dejando **más espacio en los bordes izquierdo y derecho**.

Solución: aumentar significativamente `edgePad` (padding lateral) para reducir el ancho útil donde se distribuyen los items. Como el espacio entre items sigue siendo uniforme, todos quedan igual de espaciados entre sí pero más cerca del centro.

```tsx
const edgePad = Math.max(ITEM_BOX / 2 + 2, geo.width * 0.18); // 18% del ancho a cada lado
const usable = Math.max(geo.width - edgePad * 2, 1);
```

Esto produce que para 4 categorías:
- El grupo entero ocupa ~64% del ancho total (en vez de ~95%)
- El gap entre items es el mismo para todos los pares
- Hay ~18% de espacio vacío a cada lado

Ajustar el porcentaje (0.15-0.22) según necesidad visual durante implementación.

---

### Fase 5: Arreglar dropdown de ubicación ✅ COMPLETA

**Archivo:** `src/app/page.tsx` y `src/components/CurvedHomeHeader.tsx`

**Estado:** Implementada — dropdown con fallback de posición; backdrop anclado debajo del botón de ubicación vía `onLocationAnchorChange`.

#### 5.1 Dropdown no se abre al clickear ubicación

**Problema actual:** Al clickear el botón de ubicación, el menú desplegable con las direcciones guardadas no aparece. No hay retroalimentación visual del click.

**Causa probable:** El dropdown se renderiza con `position: fixed` y su visibilidad depende de `dropdownPos` que se calcula en un `useLayoutEffect` (L510-531). Si el `headerWidth` es 0 o el ref `locationBtnRef` no está correctamente vinculado, `dropdownPos` queda como `null` y el `AnimatePresence` nunca muestra el dropdown. También podría ser un conflicto de z-index con el nuevo SVG del óvalo.

**Solución propuesta:**
1. Debuggear que `headerWidth > 0` y que `locationBtnRef.current` no sea null al hacer click.
2. Verificar que `onLocationClick` efectivamente togglea `showLocationDropdown` en `page.tsx`.
3. Si el problema es z-index, asegurar que el dropdown tenga `z-50` (ya lo tiene) y que el SVG del óvalo no tenga un z-index superior.
4. Como fallback, si `dropdownPos` es null pero `showLocationDropdown` es true, renderizar el dropdown centrado horizontalmente debajo del header con una posición Y fija calculada desde el header.

#### 5.2 Backdrop que blurrea la ubicación

**Problema actual (L468-475):**
```tsx
{showLocationDropdown && (
  <div className="fixed inset-0 z-45 bg-black/15 backdrop-blur-[2.5px]"
    onClick={() => setShowLocationDropdown(false)}
  />
)}
```

El `fixed inset-0` cubre toda la pantalla, blurrando también el header y la ubicación.

**Solución:** Hacer que el backdrop empiece justo debajo del área de la ubicación.

**Opción A (recomendada):** Pasar un callback desde `CurvedHomeHeader` que exponga la coordenada Y del bottom del botón de ubicación, y usar ese valor como `top` del backdrop.

**Opción B (simple):** Pasar la altura final del óvalo como prop, y calcular `top = alturaDelOvalo + offset`.

---

### Fase 6: Responsive — ocultar theme/notif en desktop y animar search bar ✅ COMPLETA

**Archivos:** `src/components/CurvedHomeHeader.tsx`, `src/components/Navbar.tsx`

**Estado:** Implementada — controles del header contraídos en desktop, search con expansión animada, animación de notificaciones compartida y avatar desktop eliminado.

#### 6.1 Ocultar botones de theme y notificaciones en desktop

En la versión desktop (`md:` breakpoint en adelante), los botones de día/noche y notificaciones que están a la derecha de la search bar en el header deben **ocultarse**, ya que existen duplicados en el navbar de desktop (L228-409 de `Navbar.tsx`: Location | Theme | Bell | Avatar).

**Implementación:**
```tsx
// En CurvedHomeHeader.tsx, en el contenedor de la fila del search:
<div className="flex items-center gap-2">
  <button className="flex h-[42px] flex-1 ..."> {/* search bar */} </button>

  {/* Ocultar en desktop — ya existen en el navbar */}
  <div className="md:hidden">
    <ThemeToggleHeaderBtn />
  </div>
  <div className="md:hidden">
    <HeaderCircleBtn /* notifications */ />
  </div>
</div>
```

Clases a usar: `hidden md:flex` / `md:hidden` según corresponda.

#### 6.2 Search bar se expande hacia la izquierda en desktop

Al ocultar los botones de theme y notificaciones en desktop, la search bar queda con espacio vacío a la derecha. Debe **extenderse para ocupar ese espacio** con una animación suave de ancho.

**Implementación:**
- Envolver la search bar en un `motion.div` con `layout` para que framer-motion anime el cambio de ancho.
- Al pasar a desktop, el `flex-1` ya haría que ocupe el espacio disponible, pero conviene forzar la animación con un `AnimatePresence` sobre los botones ocultos:

```tsx
<div className="flex items-center gap-2">
  <motion.div layout className="flex-1 min-w-0">
    <button className="flex h-[42px] w-full ..."> {/* search bar */} </button>
  </motion.div>

  <AnimatePresence>
    {/* Solo visible en mobile */}
    <motion.div
      key="theme-btn"
      initial={{ opacity: 0, scale: 0.8, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: "auto" }}
      exit={{ opacity: 0, scale: 0.8, width: 0 }}
      className="md:hidden overflow-hidden"
    >
      <ThemeToggleHeaderBtn />
    </motion.div>
    <motion.div
      key="notif-btn"
      initial={{ opacity: 0, scale: 0.8, width: 0 }}
      animate={{ opacity: 1, scale: 1, width: "auto" }}
      exit={{ opacity: 0, scale: 0.8, width: 0 }}
      className="md:hidden overflow-hidden"
    >
      <HeaderCircleBtn /* notifications */ />
    </motion.div>
  </AnimatePresence>
</div>
```

**Efecto:** Al redimensionar de mobile a desktop, los botones se desvanecen/contraen y la search bar se expande suavemente para ocupar el espacio.

#### 6.3 Animación de notificaciones en mobile

Cuando se clickea el botón de notificaciones en mobile, el dropdown debe tener una animación similar a la del navbar en desktop (fade + slide-in desde arriba con escala). Ya existe un `AnimatePresence` con `motion.div` que hace esto parcialmente (L630-658). Mejorar la transición para que coincida con la del navbar:

```tsx
// Navbar desktop (L299-339) usa:
initial={{ opacity: 0, y: -4, scale: 0.96 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -4, scale: 0.96 }}

// Header mobile — alinear con la misma animación:
initial={{ opacity: 0, y: -6, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -4, scale: 0.98 }}
```

Unificar ambas animaciones en una constante compartida.

#### 6.4 Eliminar avatar/profile del navbar desktop

En `Navbar.tsx`, en la sección de acciones del desktop (L228-409), hay un avatar/profile a la derecha del botón de campana. El usuario indicó que no le interesa mantenerlo por ahora. Eliminar ese elemento.

**Ubicación:** Buscar en `Navbar.tsx` el componente de avatar/profile después del botón de notificaciones (probablemente un círculo con iniciales o imagen) y eliminarlo o comentarlo.

---

### Fase 7: Ajustar padding entre search bar y otros elementos

**Archivo:** `src/components/CurvedHomeHeader.tsx`

#### 7.1 Aumentar el padding superior general

- Actual: `pt-2.5` en mobile, `pt-4` en desktop.
- Cambiar a `pt-4` mobile, `pt-5` desktop para dar más aire.

#### 7.2 Aumentar espacio entre search bar y ubicación

- Actual (L664): `mt-0.5` → es muy poco.
- Cambiar a `mt-3` o `mt-4` para separación visual clara.

#### 7.3 Ajustar height de la search bar y botones

- Actual: `h-[42px]` para todos.
- Podría aumentarse a `h-[44px]` o `h-[46px]` si se necesita más presencia.

---

### Fase 8: Nueva animación de subcategorías (fix salto + deformación)

**Archivo:** `src/components/CurvedHomeHeader.tsx`

#### 7.1 Problema actual

En la transición entre categorías principales y subcategorías (L782-787):

```tsx
<motion.div
  key={showSpecialties ? "specialties" : "categories"}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 8 }}
  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
>
```

El `initial={{ y: 10 }}` hace que los elementos aparezcan 10px más abajo y "salten hacia arriba". Como cada ítem está posicionado con `translateY` según el arco elíptico, este offset uniforme rompe la alineación curva y produce una deformación visual durante la transición.

#### 7.2 Solución

- **Eliminar el desplazamiento vertical (`y`) de la animación** y usar solo `opacity`:

```tsx
<motion.div
  key={showSpecialties ? "specialties" : "categories"}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
```

- **Alternativa:** Si se desea mantener un efecto de dirección, usar `x` en lugar de `y` (`initial={{ opacity: 0, x: -6 }}`) para un deslizamiento horizontal que no interfiera con la curvatura vertical.

---

### Fase 9: Subcategorías como expansión con animación sobre la curva

**Archivo:** `src/components/CurvedHomeHeader.tsx`

#### 9.1 Comportamiento

| Acción | Comportamiento |
|---|---|
| Click en Restaurantes | Categorías principales se **reordenan sobre la curva**: Restaurantes se desliza al centro, las demás se desplazan a la izquierda. Luego aparecen las subcategorías debajo. |
| Click en otra categoría | Las subcategorías **desaparecen** y las categorías principales vuelven a su posición centrada original. |
| Click en Restaurantes nuevamente | Las subcategorías **desaparecen** (toggle) y las categorías vuelven a la posición original. |

#### 9.2 Animación paso a paso

**Al hacer click en Restaurantes:**

```
Paso 1 — reposicionamiento sobre la curva (transición suave ~400ms):

Normal (centrado):         Expandido (Restaurantes al centro):
                           
     [K] [C] [R] [F]           [K] [C] [F]  [R]          
        ╲  ╱ ╲  ╱                ╲  ╱ ╱     ╲
         ╲╱   ╲╱                   ╲╱ ╱       ╲
                                   ▲▲ ▲       ▲
                                   ││ │       └── Restaurantes se desliza
                                   ││ │           hacia el centro siguiendo
                                   ││ │           la curvatura del óvalo
                                   ││ └── Farmacia se desplaza a la izq.
                                   │└── Cafeterías se desplaza a la izq.
                                   └── Kioscos se desplaza a la izq.

Paso 2 — aparición de subcategorías (~300ms después):

     [K] [C] [F]  [R]                    
        ╲  ╱ ╱     ╲
         ╲╱ ╱       ╲
          ╲╱─────────╲             ← Restaurantes en el centro
           ╲         ╱
            ╲       ╱
          [Pizza][Sushi][Helados]  ← Subcategorías aparecen debajo
           siguiendo la misma curvatura del óvalo
```

#### 9.3 Implementación técnica

**1. Estado de layout: dos modos**

```tsx
type LayoutMode = "centered" | "expanded";
const [layoutMode, setLayoutMode] = useState<LayoutMode>("centered");
```

**2. Cálculo de posiciones para cada modo**

```tsx
function getCategoryPositions(
  mode: LayoutMode,
  geo: ArcGeometry,
  itemCount: number,
): Array<{ x: number; y: number }> {
  const edgePad = Math.max(ITEM_BOX / 2 + 2, geo.width * 0.18);

  if (mode === "centered") {
    // 4 items evenly spaced within the reduced width (centered group)
    const usable = Math.max(geo.width - edgePad * 2, 1);
    return Array.from({ length: itemCount }, (_, i) => {
      const x = edgePad + (i / (itemCount - 1)) * usable;
      return { x, y: arcY(x, geo) };
    });
  }

  // mode === "expanded"
  // Restaurantes → center. Kioscos, Cafeterías, Farmacias → compact left group.
  const gap = 4;
  const leftGroupWidth = geo.width * 0.30;
  const leftEdge = gap;
  const rightEdge = leftEdge + leftGroupWidth;

  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < itemCount; i++) {
    if (i === 2) {
      // Restaurantes → center of the oval
      const x = geo.cx;
      positions.push({ x, y: arcY(x, geo) });
    } else {
      // K (0), C (1), F (3) → compact on the left, order preserved
      const idx = i < 2 ? i : 2;           // remap F from index 3 → index 2 within left group
      const t = idx / (3 - 1);             // 0, 0.5, 1.0
      const x = leftEdge + t * (rightEdge - leftEdge);
      positions.push({ x, y: arcY(x, geo) });
    }
  }
  return positions;
}
```

**Efecto visual en el expanded (width=375px):**

```
Normal (centrado):
  [K]──────[C]──────[R]──────[F]    ← 18% padding c/lado, evenly spaced
   ╲                               ← arcY suave sobre la elipse

Expanded:
  [K]─[C]─[F]           [R]        ← K,C,F comprimidos a la izq., R al centro
   ╲                     ╲
    ╲───╲───╲            ╲
         ╲               ╲         ← todas las y siguen arcY según su x
          ╲              ╲
           ╲             ╲
        [subcategorías aparecen debajo de R]
```

**3. Animación con `motion.div` y `layout`**

Cada `CategoryButton` se envuelve en un `motion.div` con `layout` para que framer-motion interpole automáticamente las posiciones `left` y `translateY`:

```tsx
<motion.div
  layout
  layoutId={item.id}
  className="absolute"
  style={{
    width: ITEM_BOX,
    left: pos.x - ITEM_BOX / 2,
    top: 0,
    transform: `translateY(${pos.y}px)`,
  }}
  transition={{ type: "spring", stiffness: 200, damping: 24 }}
>
  <CategoryButton item={item} isActive={selectedId === item.id} onSelect={onSelect} />
</motion.div>
```

Al cambiar `layoutMode` de `"centered"` a `"expanded"`, las posiciones `left` y `translateY` cambian y framer-motion anima la transición suavemente. El `layoutId` permite que React reconozca el mismo elemento y lo anime en lugar de recrearlo.

**4. Aparición de subcategorías**

Las subcategorías se renderizan en un contenedor separado debajo de las categorías principales. Se distribuyen sobre la misma curvatura elíptica, centradas bajo la posición de Restaurantes (que en modo expanded está en `geo.cx`):

```tsx
const SUBCAT_ROW_GAP = ITEM_BOX + 8; // espacio vertical entre fila de categorías y subcategorías
const SUBCAT_SPAN = geo.width * 0.45;  // ancho que ocupa el grupo de subcategorías
```

Posiciones X para subcategorías (centradas en `geo.cx`, con mismo gap entre sí):

```tsx
function getSubcategoryX(i: number, total: number, cx: number, span: number): number {
  if (total <= 1) return cx;
  const halfSpan = span / 2;
  const left = cx - halfSpan;
  const right = cx + halfSpan;
  return left + (i / (total - 1)) * (right - left);
}
```

Cada subcategoría usa:

```tsx
<AnimatePresence>
  {showSpecialties && specialtyItems.map((item, i) => {
    const x = getSubcategoryX(i, specialtyItems.length, geo.cx, SUBCAT_SPAN);
    const baseY = arcY(x, geo);                              // y sobre la elipse
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.8, y: baseY + SUBCAT_ROW_GAP + 8 }}
        animate={{ opacity: 1, scale: 1, y: baseY + SUBCAT_ROW_GAP }}
        exit={{ opacity: 0, scale: 0.8, y: baseY + SUBCAT_ROW_GAP + 8 }}
        transition={{ duration: 0.25, delay: i * 0.025 }}
        className="absolute"
        style={{ left: x - ITEM_BOX / 2, width: ITEM_BOX }}
      >
        <CategoryButton item={item} isActive={activeSpecialty === item.id} onSelect={onSpecialtyChange} />
      </motion.div>
    );
  })}
</AnimatePresence>
```

Las subcategorías también siguen `arcY(x, geo)` para respetar la curvatura: las del centro bajan más, las de los extremos suben ligeramente.

**5. Timing de la animación**

```tsx
const selectCategory = (id: string) => {
  if (id === "restaurants") {
    if (activeCategory === "restaurants" && showSpecialties) {
      // Cerrar: primero ocultar subcats, luego re-centrar
      setShowSpecialties(false);
      setTimeout(() => setLayoutMode("centered"), 200);
      onSpecialtyChange(null);
    } else {
      // Abrir: primero reordenar, luego mostrar subcats
      onCategoryChange(id);
      setLayoutMode("expanded");
      setTimeout(() => setShowSpecialties(true), 350);
    }
  } else {
    if (showSpecialties) {
      setShowSpecialties(false);
      setTimeout(() => setLayoutMode("centered"), 200);
    }
    onCategoryChange(id);
    onSpecialtyChange(null);
  }
};
```

**6. Altura dinámica del contenedor**

```tsx
const containerHeight = layoutMode === "expanded"
  ? geo.sagitta + ITEM_BOX * 2 + 8  // subcats visibles
  : geo.sagitta + ITEM_BOX;          // solo categorías
```

**7. Eliminar el botón "Categorías"** de vuelta (L766-777) — ya no es necesario porque las categorías principales nunca desaparecen.

---

### Fase 10: Skeleton del header ovalado

**Archivo:** `src/app/page.tsx` → `HomeSkeleton` (L636-705)

Actualizar el skeleton para que coincida con la nueva geometría ovalada.

Cambios:
- Reemplazar el div rectangular rojo del skeleton por un SVG placeholder con arco elíptico.
- Ajustar posiciones de los placeholders de categorías para que sigan la nueva curva elíptica.
- Agregar placeholder para la fila de subcategorías (opcional, según estado de carga).

---

## Resumen de archivos a modificar

| Archivo | Cambios |
|---|---|---|
| `src/components/CurvedHomeHeader.tsx` | Fases 1, 2, 4, 6, 7, 8, 9 — SVG con arco elíptico, arcY elíptica, spacing centrado, ocultar theme/notif en desktop + animar search, padding, fix animación, subcategorías como expansión |
| `src/components/Navbar.tsx` | Fase 6 — Eliminar avatar/profile del desktop navbar |
| `src/lib/mockData.ts` | Fase 3 — Reordenar array CATEGORIES |
| `src/app/page.tsx` | Fases 5, 10 — Backdrop condicional, skeleton |

---

## Riesgos y consideraciones

1. **Responsive:** La altura del óvalo varía con el ancho de pantalla. En desktop (1040px) con `ratio=0.38`, `sagitta ≈ 395px` — demasiado alto. Se necesita un **clamp** para desktop:
   - Mobile (375px): `sagitta ≈ 120-150px`
   - Desktop (1040px): `sagitta ≈ 200-250px` máximo.

2. **Espacio para categorías en los bordes:** A diferencia del semicírculo perfecto, un arco elíptico con `rx = W/2` y `ry = sagitta` tiene altura suficiente en los bordes para alojar los círculos de categorías. La elipse tiende a 0 suavemente, permitiendo que el `arcY` dé valores cercanos a 0 pero no exactamente 0 hasta el borde mismo.

3. **Dos filas de ítems siguiendo el arco:** La fila de subcategorías debe usar la misma función `arcY` pero con un offset vertical adicional (ej. `arcY(x, geo) + ITEM_BOX + gap`). Verificar que no se superpongan con contenido de abajo.

4. **Dropdown de notificaciones y ubicación:** Verificar que los z-index y posiciones sigan funcionando con el nuevo SVG header.

5. **DragArcCarousel para subcategorías:** Mantener el scroll horizontal para subcategorías (restaurant specialties = ~25 items). La fila de categorías principales (4 items) usará `FitArcCarousel`.

6. **La fórmula elíptica simplifica la matemática:** Al usar `rx = W/2` y `ry = sagitta`, la función `arcY` es más simple y precisa que la versión circular, y las categorías caen exactamente sobre el borde del óvalo sin necesidad de ajustes.

---

## Orden de implementación

1. **Fase 3** (reordenar categorías) — cambio más simple, sin riesgo.
2. **Fase 4** (spacing centrado) — ajuste en FitArcCarousel.
3. **Fase 2** (invertir arcY con elipse + quitar ICON_OVERLAP) — el cambio clave de geometría.
4. **Fase 9** (subcategorías como expansión) — cambio de comportamiento mayor.
5. **Fase 8** (fix animación) — arreglar la animación que deforma.
6. **Fase 1** (SVG con arco elíptico) — el cambio visual más grande.
7. **Fase 6** (responsive ocultar botones) — limpieza desktop.
8. **Fase 7** (padding) — ajustes finos después de ver el resultado.
9. **Fase 5** (fix dropdown ubicación) — corrección de comportamiento.
10. **Fase 10** (skeleton) — alinear loading state.

---

## Notas para revisión

- ¿El ratio `sagitta / width = 0.38` se siente bien visualmente, o hay que ajustarlo?
- ¿Qué altura máxima de header es aceptable en desktop?
- ¿El backdrop del dropdown de ubicación debe eliminarse por completo o solo limitarse?
- ¿Las subcategorías deben tener scroll horizontal infinito o solo el ancho disponible?
- ¿Confirmamos que las subcategorías solo aparecen con Restaurantes, o también otras categorías tendrán subcategorías en el futuro?
