# Sistema de Rangos y Logros — SDD

> **Nota:** Este sistema de rangos y logros está estrechamente ligado al motor de **insignias de cliente** (ver [10‑insignias‑cliente/README.md](../10-insignias-cliente/README.md)). Las insignias representan los logros obtenidos al completar misiones y subir de rango.

> **Estado:** spec / por implementar (TDD + SDD — no tocar código hasta cerrar esta spec).
> **Ubicación:** Panel de negocio → `/negocio/configuracion`.
> **Inspiración:** League of Legends (rangos y divisiones) + Steam (niveles y logros/badges).

---

## 1. Visión general

Cada negocio sube de **rango** (categoría) a medida que completa **misiones**. Completar una misión otorga **XP** (progreso de rango) y un **badge** (logro exhibible). El rango es una señal de reputación/trayectoria visible para el dueño y, en el futuro, para los clientes.

**Primer nivel de implementación (este doc):**
1. Un **Resumen** de rango en donde hoy está el placeholder de Configuración.
2. Un **tab de Misiones** separado de la **configuración del local**.

---

## 2. Decisiones cerradas

| Decisión | Veredicto |
|---|---|
| Fuente de progreso | **Solo misiones** (sin XP por pedido directo; la venta cuenta vía misiones) |
| Estructura de rango | 10 categorías; las 7 primeras con **4 divisiones** (IV→I), las 3 últimas **apex** (sin divisiones) |
| Múltiples badges por misión | **No** — 1 misión = 1 badge, con rareza fija |
| Exhibición de badges | **Vitrina** de hasta **3 badges** pinchados, mostrados en el Resumen |
| Reclamo de recompensa | **Automático** al cumplirse (sin botón "reclamar" en v1) |
| Lugar del Resumen | Tab por defecto de `/negocio/configuracion` |
| Nombre del sistema | Rangos gastronómicos (no "niveles numéricos") |

---

## 3. Categorías de rango (escala recomendada)

Escala temática gastronómica, de ingrediente humilde a lujo. Es configurable (ver §6).

| # | Rango | Divisiones | XP acumulado para entrar |
|---|---|---|---|
| 1 | **Sal** | IV · III · II · I | 0 |
| 2 | **Pimienta** | IV · III · II · I | 100 |
| 3 | **Hierro** | IV · III · II · I | 250 |
| 4 | **Cobre** | IV · III · II · I | 500 |
| 5 | **Plata** | IV · III · II · I | 1.000 |
| 6 | **Oro** | IV · III · II · I | 2.000 |
| 7 | **Azafrán** | IV · III · II · I | 4.000 |
| 8 | **Caviar** | apex | 8.000 |
| 9 | **Trufa** | apex | 15.000 |
| 10 | **Diamante** | apex | 25.000 |

- Las **divisiones** parten el rango de XP de la categoría en 4 tramos iguales (ej. Sal IV = 0–25, Sal I = 75–99).
- El rango mostrado es `Categoría + división` (ej. "Plata II"). Los apex muestran solo la categoría.
- Subir de categoría baja de división (de "Sal I" se pasa a "Pimienta IV") — mismo patrón que LoL.

### Por qué esta escala

- Cubre los ejemplos pedidos (**sal, hierro, caviar**) y agrega una progresión "de lo básico a lo exclusivo".
- Términos cortos, reconocibles y con iconografía Material Symbols disponible (`grain`, `filter_vintage`, `hardware`/`cast_iron`, `diamond`, etc. — verificar nombres en fonts.google.com/icons).
- 28 divisiones + 3 apex = curva larga que no se agota rápido.

---

## 4. Modelo de datos (mock, extiende `src/lib/mockData.ts`)

```ts
export interface RankTier {
  id: string;              // "sal" | "pimienta" | ...
  name: string;            // "Sal"
  icon: string;            // Material Symbol (verificar)
  minXp: number;           // XP acumulado para entrar
  apex: boolean;           // true => sin divisiones
}

export interface Mission {
  id: string;              // "first_order"
  name: string;            // "Primer plato servido"
  description: string;
  category: MissionCategory; // "onboarding" | "ventas" | "social" | "clientes" | "operativo"
  metric: MetricId;        // qué se mide (ver §5)
  target: number;          // cantidad/monto objetivo
  xp: number;              // recompensa
  badgeId: string;         // badge que otorga
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: "bronce" | "plata" | "oro" | "rubi";
}

export interface BusinessProgress {
  xp: number;                       // XP total ganado
  completedMissionIds: string[];
  ownedBadgeIds: string[];
  showcasedBadgeIds: string[];      // máx. 3
}

export const RANK_TIERS: RankTier[];
export const MISSIONS: Mission[];
export const BADGES: Badge[];
export const MOCK_BUSINESS_PROGRESS: BusinessProgress;
```

**Funciones puras (donde vive la lógica a testear):**

```ts
export function rankForXp(xp: number): { tier: RankTier; division: "I" | "II" | "III" | "IV" | "apex" };
export function xpProgress(xp: number): { current: number; toNext: number; percent: number };
export function missionStatus(mission: Mission, stats: BusinessStats, progress: BusinessProgress): "completed" | "claimed" | "in_progress";
```

---

## 5. Catálogo de misiones (propuesta inicial)

`MetricId` = métrica que alimenta el progreso. Todas son acumulables (no requieren reset).

### 5.1 Onboarding

| id | Misión | Métrica | Objetivo | XP | Badge |
|---|---|---|---|---|---|
| `first_order` | Primer plato servido | `orders_completed` | 1 | 20 | `estreno` (bronce) |
| `identity` | Identidad completa | `profile_complete` | 1 | 15 | `identidad` (bronce) |
| `showcase` | Vitrina impecable | `products_with_photo` | 5 | 20 | `vitrina` (bronce) |
| `menu_qr` | QR generado | `qr_generated` | 1 | 15 | `qr_listo` (bronce) |

### 5.2 Ventas

| id | Misión | Métrica | Objetivo | XP | Badge |
|---|---|---|---|---|---|
| `orders_50` | Comensal regular | `orders_completed` | 50 | 60 | `regular` (plata) |
| `orders_250` | Local concurrido | `orders_completed` | 250 | 150 | `concurrido` (oro) |
| `revenue_500k` | Facturador | `revenue_total` | $500.000 | 80 | `facturador` (plata) |
| `revenue_1m` | Estrella en ascenso | `revenue_total` | $1.000.000 | 200 | `ascenso` (oro) |

### 5.3 Social / QR

| id | Misión | Métrica | Objetivo | XP | Badge |
|---|---|---|---|---|---|
| `share_10` | Difusor | `qr_shares` | 10 | 30 | `difusor` (plata) |
| `share_50` | Viral | `qr_shares` | 50 | 100 | `viral` (oro) |
| `scan_50` | Imán de clientes | `qr_unique_scans` | 50 | 90 | `iman` (oro) |
| `first_review` | Primera reseña | `reviews_count` | 1 | 20 | `reseñado` (bronce) |
| `reviews_5_20` | Cinco estrellas | `reviews_5star` | 20 | 150 | `cinco_estrellas` (rubi) |

### 5.4 Clientes / comunidad

| id | Misión | Métrica | Objetivo | XP | Badge |
|---|---|---|---|---|---|
| `clients_50` | Comunidad propia | `unique_customers` | 50 | 80 | `comunidad` (plata) |
| `recurrent_10` | Fieles de siempre | `recurrent_customers` | 10 | 100 | `fieles` (oro) |

### 5.5 Operativo

| id | Misión | Métrica | Objetivo | XP | Badge |
|---|---|---|---|---|---|
| `fast_response` | A tiempo | `avg_response_min` | ≤ 5 min | 70 | `rapido` (plata) |
| `zero_cancel` | Impecable | `cancellations_30d` | 0 | 120 | `impecable` (oro) |

> El catálogo es extensible: agregar misiones = agregar una fila + un `MetricId`. Las métricas operativas (`avg_response_min`, `cancellations_30d`) dependen de stats ya existentes en el dashboard.

---

## 6. Configuración

La escala, XP y misiones son **datos**, no lógica: viven en `mockData.ts` (o tabla de Supabase en fase 2). Ajustar umbrales no implica cambios de UI.

---

## 7. UI & Arquitectura de Diseño — `/negocio/configuracion`

La página pasa de placeholder a **3 tabs**:

```
/negocio/configuracion
├── Resumen        (tab por defecto)  ← Gamificación & Dashboard de Rango
├── Misiones       (tab)              ← Catálogo de misiones & Colección de Badges
└── Configuración  (tab)              ← Ajustes del local (horarios, pagos, etc.)
```

### 7.1 Tab Resumen (Dashboard de Gamificación — Inspirado en Referencia Visual 1)

El tab Resumen adopta un layout de dashboard limpio, ágil y visualmente estimulante (`bg-[#faf6f1]`, tarjetas con esquinas suavizadas `rounded-[24px]` y sombras sutiles `penpot-shadow`):

1. **Hero Card de Rango Actual (Top Left)**:
   - Card prominente con fondo en gradiente según la categoría del rango (ej. Violeta/Azul místico para Sal/Pimienta, Dorado para Plata/Oro, etc.).
   - Avatar/Emblema del ingrediente de rango.
   - Nombre de categoría y división (ej. `Nivel 1 - Sal IV`).
   - Medidor numérico de XP acumulado total.

2. **Goal Progress Card / Meta Actual (Top Center)**:
   - Card destacada (tono amarillo/naranja cálido) con contenedor interno blanco.
   - **Anillo de Progreso Circular (`SVG Progress Ring`)**: Muestra el `%` de avance hacia la siguiente división o meta diaria (ej: `64%` / `64 de 100 XP`).

3. **Daily Performance / Actividad Semanal (Top Right)**:
   - Widget de 7 días (Dom a Sáb) con indicadores visuales de volumen de pedidos o misiones activas por día.

4. **Grid de Estadísticas & Ritmo Operativo (Bottom Left — Inspirado en Referencia Visual 2)**:
   - Métricas de efectividad histórica (`All time: 84%`), racha sin cancelaciones (`Best streak: 5d`), y victorias (`Wins: 95%`).
   - **Barras de Progreso Avanzadas con Ritmo (Pacing Progress Bar)**:
     - Estructura de barra de dos tramos con patrón rayado animado/estático (`striped pattern`) en el segmento activo de avance y perilla flotante de estado (*knob*).
     - **Indicador dinámico de ritmo (Pacing Indicator)**:
       - Estado positivo: Badge verde `"A buen ritmo"` + leyenda `"¡Vas a un 30% por delante del objetivo!"`.
       - Estado retrasado: Badge rojo/naranja `"Atrasado"` + leyenda `"Estás a un 20% de alcanzar la meta propuesta"`.

5. **Vitrina de Badges & Logros (Bottom Center)**:
   - Vista rápida de badges pinchados (máx. 3) y recuento total (`"2 de 20"`).
   - Formato circular pastel suave con ícono centrado + título y XP otorgado (ej. `Primer plato +20 XP`).

6. **Roadmap de Progresión de Rango (Bottom Right)**:
   - Timeline vertical ("Roadmap") que muestra hitos desbloqueados, misión en curso y rangos superiores bloqueados.

---

### 7.2 Tab Misiones (Inspirado en Referencia Visual 3)

- Lista de misiones agrupadas por categoría (§5) con filtro por estado (`Todas · En curso · Completadas`).
- **Tarjetas de Badge / Misión Ilustradas (Formato Banner/Gradient — Referencia 3)**:
  - Tarjetas con bordes redondeados pronunciados (`rounded-3xl`), fondos con degradados vivos (ej. Coral a Rosa, Turquesa a Azul Profundo).
  - Iconografía flotante con estilo glassmorphism (`backdrop-blur`).
  - Título bold blanco + descripción secundaria en `text-white/80`.
  - **Indicador de Rareza por Puntos (Rarity / Level Dots)**: Fila de 5 puntos en la esquina inferior de la tarjeta que indican el nivel de rareza (1 punto = Bronce, 2 = Plata, 3 = Oro, 4 = Rubí, 5 = Diamante).
- **Acciones**:
  - Al cumplirse la métrica: Estado "Completada" automático + el badge ingresa a la colección.
  - **Pinchar en Vitrina**: Acción en la card del badge para "Pinchar/Despinchar" (máx. 3 en Resumen).

---

### 7.3 Tab Configuración

Contenido ya planeado (horarios, medios de pago, datos del negocio). Sin cambios por este feature.

---

### 7.4 Navegación / Sidebar

Sin cambios en `BusinessSidebar.tsx`: `Configuración` apunta a `/negocio/configuracion`, que abre por defecto en el tab Resumen.

---

## 8. Badges — exhibición

- **Colección**: Todos los badges ganados, accesibles desde Misiones → "Mis badges".
- **Vitrina (v1)**: Máx. 3 badges en el Resumen.
- **Exhibición pública (futuro, fuera de alcance)**: Vitrina en el menú QR / storefront del local.

---

## 9. Criterios de aceptación

- [ ] `/negocio/configuracion` abre en tab **Resumen** con rango, XP, gráfico circular de meta y vitrina.
- [ ] `rankForXp` mapea correctamente umbrales y divisiones (Sal IV en 0 XP, Diamante apex en 25.000+).
- [ ] La barra de XP avanzada muestra el patrón rayado, el indicador de ritmo ("A buen ritmo" / "Atrasado") y el progreso correcto.
- [ ] Tab Misiones lista tarjetas ilustradas con degradados, puntos de rareza, progreso y estado.
- [ ] Completar una misión otorga XP y badge **automáticamente** y se refleja en el Resumen.
- [ ] La vitrina acepta máx. 3 badges; pinchar un 4º reemplaza o se bloquea con feedback.
- [ ] Tab Configuración sin regresiones.

---

## 10. Plan de tests (TDD)

Tests unitarios sobre las funciones puras de §4 (antes de implementar UI):

| # | Dado | Cuando | Entonces |
|---|---|---|---|
| 1 | `xp = 0` | `rankForXp` | tier Sal, división IV |
| 2 | `xp = 99` | `rankForXp` | tier Sal, división I |
| 3 | `xp = 100` | `rankForXp` | tier Pimienta, división IV (sube de categoría, baja de división) |
| 4 | `xp = 8.000` | `rankForXp` | tier Caviar, apex |
| 5 | `xp = 26.000` | `rankForXp` | tier Diamante, apex |
| 6 | `xp = 120` | `xpProgress` | `current=20`, `toNext=30`, `percent=40` (dentro de Pimienta) |
| 7 | stats con `orders_completed=1`, misión `first_order` | `missionStatus` | `completed` |
| 8 | stats con `orders_completed=50` | `missionStatus(orders_50)` | `completed` |
| 9 | misión ya en `completedMissionIds` | `missionStatus` | `claimed` (no vuelve a dar XP) |
| 10 | vitrina con 3 badges y se agrega un 4º | `showcaseBadge` | rechazado / no supera 3 |

---

## 11. Archivos nuevos

| Archivo | Contenido |
|---|---|
| `src/lib/ranks.ts` | `RANK_TIERS`, `MISSIONS`, `BADGES`, `rankForXp`, `xpProgress`, `missionStatus` |
| `src/components/business/RankHeroCard.tsx` | Hero card prominente del rango actual (estética Img 1) |
| `src/components/business/GoalProgressRing.tsx` | Card con gráfico circular de progreso diario/división (estética Img 1) |
| `src/components/business/PacingProgressBar.tsx` | Barra de progreso avanzada con entramado rayado, knob e indicador de ritmo "A buen ritmo/Atrasado" (estética Img 2) |
| `src/components/business/BadgeCard.tsx` | Tarjeta ilustrada de logro con degradados y puntos de rareza (estética Img 3) |
| `src/components/business/RankRoadmap.tsx` | Timeline vertical de progresión de rango (estética Img 1) |
| `src/components/business/RankCard.tsx` | Integrador del tab Resumen (combina hero, ring, stats, vitrina y roadmap) |
| `src/components/business/MissionList.tsx` | Lista de misiones con filtros y tarjetas `BadgeCard` (tab Misiones) |
| `src/components/business/BadgeShowcase.tsx` | Vitrina de badges (máx 3) + selector de pinchado |
| `src/app/negocio/(business)/configuracion/page.tsx` | De placeholder a tabs (Resumen/Misiones/Configuración) |
| `src/lib/ranks.test.ts` | Tests unitarios del §10 |

---

## 12. Convenciones

- Tailwind v4, `cn()`, `MaterialSymbol`, `dark:` prefix — mismas que el resto del panel.
- Iconos: verificar nombres en fonts.google.com/icons antes de implementar (ej. `grain` para Sal, `diamond` para Diamante).
- XP, misiones y badges son **datos** en `src/lib/ranks.ts` (o Supabase en fase 2), no lógica dispersa en componentes.
- Colores de rareza / puntos: bronce `#b08d57` (1 dot), plata `#9ca3af` (2 dots), oro `#d4af37` (3 dots), rubí `#9a0002` (4 dots), diamante `#38bdf8` (5 dots).

---

## 13. Fuera de alcance (v1)

- Exhibición pública de badges en menú QR / storefront.
- XP por pedido directo (solo vía misiones).
- Recompensas monetarias / descuentos por rango.
- Rankings comparativos entre negocios (leaderboard).
- Persistencia real: todo mock hasta integrar Supabase.
