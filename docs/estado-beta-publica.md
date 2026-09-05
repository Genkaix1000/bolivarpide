# Estado hacia la Beta Pública — BolivarPide

> **Fecha del análisis:** 2026-09-05 · **Fecha objetivo:** 2026-09-29 (24 días)
> **Equipo:** 2 personas, fines de semana incluidos
> **Decisiones tomadas el 2026-09-05:** alcance completo con fecha corrida (escenario C) ·
> WhatsApp arranca con el bot n8n · el recargo del pago rápido lo absorbe el comercio, sin toggle
> **Fuentes:** auditoría de código en `src/` (297 archivos, ~36k líneas TS), 42 migraciones,
> 42 checks, `docs/features/`, `docs/hitos/`, `docs/specs/`, `docs/debt.md`
> **Recalcular los números:** `node scripts/beta-score.mjs`

---

## 1. Respuesta corta

**Estamos en el 70% del 100% que sería una beta pública.**

| Cara | % avance | Horas restantes | Diagnóstico en una línea |
|---|---:|---:|---|
| **Cliente** | **70%** | 59h | El flujo de pedido funciona punta a punta; miente en envío, horarios, legal y mapa |
| **Comercio** | **84%** | 116h | Opera pedidos reales hoy, pero promete features que no existen |
| **Delivery** | **73%** | 38h | Núcleo operativo real; el pipeline muere porque nadie puede aprobar un repartidor |
| **Admin** | **81%** | 16h | La cara más completa; le falta la pantalla que desbloquea delivery |
| **Infra y lanzamiento** | **13%** | 58h | No existe deploy, ni dominio, ni backups, ni un solo comercio piloto |
| **GLOBAL** | **70%** | **286h** | |

> **Nota sobre el árbol de trabajo:** al momento de escribir esto hay cambios sin commitear
> que no forman parte de este análisis: se borró código muerto (`ARQUITECTURA.legacy.md`,
> `components.json`, `AccountSheet.tsx`, `OAuthLogin.tsx`, los SVG de avatares y otros) y se
> silenciaron los 4 errores de typecheck. Los números de arriba reflejan **ese** estado, no el
> último commit. Conviene commitear eso antes de arrancar el plan.

El número engañoso es el 70%: **está inflado por el peso del código ya escrito**. El 30% que
falta no es "más de lo mismo", es casi todo trabajo que nunca se empezó (infra al 13%) y
decisiones de producto sin resolver.

### Por qué la fecha se movió del 17/09 al 29/09

El análisis arrancó apuntando al 17/09, 12 días. La aritmética no daba:

| Escenario | Horas necesarias | Capacidad en 12 días | Resultado |
|---|---:|---:|---|
| **Declarado** (todo adentro) | 286h | 144h | 199% — no entra |
| **Recortado** (sin planes, rangos, promos, menú QR, reseñas) | 196h | 144h | 136% — no entra |
| **Mínimo viable** (solo bloqueantes) | 138h | 144h | 96% — entra sin margen |

El alcance completo incluye features con **cero líneas de código escritas**: planes pagos con
cobro de comisión (~30h), rangos y logros del comercio (~25h), CRUD de promociones (~12h),
generador de menú QR (~6h). Son 73 horas de desarrollo nuevo antes de tocar un solo bloqueante.

**Decisión tomada: se mantiene el alcance completo y se corre la fecha.** 286 horas contra 12
horas-persona por día son 24 días de trabajo. La fecha resultante es el **29/09/2026**.

### Advertencia sobre esa fecha

24 días dan 288 horas-persona. El alcance pide 286. **La holgura es de 2 horas, el 1%.**

Eso no es un plan con margen, es un plan al límite. Significa que el 29/09 se sostiene solo si
todo sale como está estimado, y el tramo 3 son 67 horas de código que todavía no existe, o sea
justo donde las estimaciones fallan. Sumale que el QA end-to-end cae en el último tramo, que es
donde aparecen los problemas que no se pueden postergar.

Dicho sin vueltas: **el 29/09 es la fecha más temprana posible, no una fecha probable.** Si
querés una fecha que puedas prometerle a un comercio, poné el 03/10 y quedate con una semana de
colchón. Y si en algún momento hay que elegir, la salida sana es diferir rangos y logros
(BP-44, 25h), no comprimir el QA.

---

## 2. Cómo se calculó el porcentaje

Cada capacidad de cada cara tiene dos valores:

- **Peso** (criticidad para poder lanzar): `3` = bloqueante · `2` = importante · `1` = deseable
- **Score** (cuánto está hecho hoy): `1.00` funcional · `0.60` parcial · `0.30` hardcodeado · `0.15` stub · `0` ausente

El % de una cara es la suma ponderada sobre el máximo posible. El global es la suma ponderada
de las cinco caras, no el promedio simple: **una cara con más capacidades bloqueantes pesa más**.

El modelo vive en `scripts/beta-score.mjs` y es la fuente de verdad del número. Si cambia el
estado de una capacidad, se edita ahí y el porcentaje se recalcula solo. El script trae sus
propios asserts, así que si el modelo se rompe (porcentaje fuera de rango, ítems perdidos)
falla en vez de mentir.

**Por qué "Infra y lanzamiento" es una quinta cara:** pediste cuatro, pero deploy, dominio,
backups y comercios piloto no pertenecen a ninguna de las cuatro y son lo más atrasado del
proyecto. Meterlos dentro de otra cara habría escondido justo el problema más grande.

---

## 3. Cara Cliente — 72%

**Lo que funciona de verdad, contra base de datos:** home feed con ISR de 60s, búsqueda de
comercios y productos, carta pública `/c/[slug]`, feed reels del menú, carrito, checkout con
precios verificados server-side, resultado de pago, tracking con realtime, direcciones con
geofence de Bolívar, favoritos, perfil, notificaciones, login con email y Google, recuperación
de contraseña, instalación PWA.

Es mucho, y está bien hecho. Lo que sigue es lo que rompe la confianza de un usuario real.

### Bloqueantes

| # | Qué | Evidencia | Por qué bloquea |
|---|---|---|---|
| 1 | **No existen términos, privacidad ni contacto** | Ninguna ruta bajo `src/app` | Una app con pagos y datos personales no puede abrir al público sin esto. También lo pide el review de Meta. |
| 2 | **Envío y pedido mínimo hardcodeados en $0** | `business/home.ts:30-31`, `publicStore.ts:89-90` | Los banners prometen "envíos gratis desde $4.000" y no hay ninguna lógica detrás. `canCheckout` existe en `cart.ts:112` y nunca se llama. |
| 3 | **Banners con comercios ficticios** | `staticContent.ts:39-40`, seed en `20260902000000_promo_banners.sql:47-112` | Los CTA apuntan a `/c/burgerboz`, `/c/pizzastore`. Un usuario que clickea la promo principal come un 404. |
| 4 | **El checkout no valida si el local está abierto** | `mercadopago/checkout.ts:97` solo chequea `published` | Se pueden pagar pedidos a locales cerrados. El badge "Cerrado" es decorativo (`MobileStoreCoverHeader.tsx:72`). |
| 5 | **El mapa muestra un repartidor simulado** | `OrderTrackingMap.tsx:220-231` → `demoRouteProgress` en `routeGeometry.ts:89-95` | Si el repartidor no compartió GPS, el cliente ve una moto animada que no existe. Es el fallback por defecto, no un caso raro. |
| 6 | **Abierto/cerrado no usa los horarios cargados** | `isOpenByHours` existe en `business/hours.ts:51` y **tiene cero llamadores**; todo el proyecto lee el flag manual `businesses.is_open` | El comercio carga sus horarios, se muestran en la carta, y no se aplican. Si el dueño se olvida de apretar "cerrar", el local aparece abierto a las 4 de la mañana y entran pedidos que nadie va a cocinar. |

### Importantes, no bloqueantes

- **El carrito se pierde al refrescar** — estado solo en memoria (`CartProvider.tsx:106`), sin `localStorage`.
- **Los filtros de categoría del header no filtran** — `activeCategory` cambia la UI del arco y nada más (`HomeContent.tsx:41-42,578-581`). Parece un filtro, no lo es.
- **Home vacío sin comercios publicados** — las secciones se ocultan en silencio (`HomeContent.tsx:296,359`) y quedan solo los banners falsos.
- **Cero error boundaries en rutas de cliente** — el único `error.tsx` del proyecto está en `/negocio/[businessId]/carta`. Un fallo de Supabase degrada en silencio.
- **Push PWA depende de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`** — la infra está (`usePwaPush.ts:51-97`), falta desplegar las claves.

### Diferido por decisión

- **Insignias de cliente** — lo pasaste a después. **Actualización 2026-09-05:** el motor está completo y cableado (`definitions.ts`, `engine.ts`, `engine.check.ts`, `queries.ts`, `notify.ts` y `actions.ts` en `src/lib/badges/`, con hooks en entregas y onboarding); lo único abierto es el QA manual E2E. Los checklists de `docs/features/10-insignias-cliente/` ya fueron corregidos.
- **Reseñas y ratings** — `businesses.rating` y `reviews_count` existen con default 0 (`core_business_schema.sql:15-16`), **no hay tabla `reviews` ni flujo para dejar una**. El badge muestra "Nuevo" para todos, que es correcto pero vacío. Hay un `4.8` hardcodeado en `business/queries.ts:95` y un `rating: 5.0` inventado en `CartFlow.tsx:216`.
- **Botón "Seguir comercio"** — `useState(false)` local sin persistencia (`StoreHubView.tsx:171`).

### Dato bueno: la deuda vieja ya se pagó

`src/lib/mockData.ts`, que `docs/debt.md:236` marca como importado por 15 archivos, **ya no
existe**. Cero importadores. Los arrays `FEATURED_CHAINS` y `TRENDING_ITEMS` quedaron vacíos
(`staticContent.ts:126-127`), así que los "mocks" que menciona `search/actions.ts:134,160` son
código muerto inofensivo. La búsqueda devuelve solo datos reales.

---

## 4. Cara Comercio — 82%

Es la cara con más código y la que mejor opera: un comercio puede recibir un pedido real,
cocinarlo, despacharlo y cobrarlo hoy. También es la que tiene el problema más urgente.

### Bloqueante #1: el build y dos refactors abandonados

**`pnpm typecheck` pasa** (se arregló en los cambios sin commitear) pero **`pnpm lint` sigue
con 11 errores, así que el CI está rojo.** Los 11 son casi todos la misma regla nueva de
React 19 — `react-hooks/set-state-in-effect` y `react-hooks/refs` — en
`CartProvider.tsx:181,219`, `FavoritosView.tsx:40`, `StoreHubView.tsx:183`,
`UserProfileProvider.tsx:87`, `BusinessSearchOverlay.tsx:62,75`, `SettingsSubnav.tsx:77`,
`TabEquipo.tsx:610` y dos más.

Lo importante es **cómo** se puso verde el typecheck, porque no fue arreglando nada:

| Error original | Cómo se resolvió | Qué quedó |
|---|---|---|
| `driversMetrics` no existe en el retorno | Se quitó la prop en `dashboard/page.tsx:33` | La sección de Reparto del dashboard renderiza **siempre el empty state** |
| `DriverMetricsView` no exportado | Se definió el tipo localmente en `DashboardView.tsx` y la prop pasó a `driversMetrics?` con default `[]` | Idem: compila, no muestra datos |
| `role` no existe en `BusinessSidebarProps` | Se quitó `role={shell.role}` de `BusinessLayout.tsx:46` | **El RBAC del panel quedó descartado**, no implementado |
| `onToggleCollapse` no existe en `BusinessTopbarProps` | Se quitó del topbar | Sin colapso desde el topbar (menor) |

O sea: **la feature de métricas por repartidor está desactivada, no terminada.** La lógica pura
está escrita y testeada (`dashboard.ts:186-214`, `dashboard.check.ts:64`), la UI está escrita
(`DashboardView.tsx:444-524`), y falta el pedazo del medio: la query de `orders` con
`delivery_driver_id`, el join a perfiles y el mapeo. `docs/hitos/README.md:13` marca el Hito 04
como ✅ Hecho. No lo está.

Lo que sí se arregló de verdad: la prop `shell` faltante en `BusinessTopbar`, que era un crash
de runtime al abrir el menú de usuario en desktop y que tsc no veía.

### Bloqueante #2: deprecar QR y quedarse con pago rápido

Decidiste dejar el QR y usar pago rápido (MP Checkout Pro) como instancia general. Hoy el
panel está construido al revés: **el QR es el default y el pago rápido es el opcional**.

Lo que hay que cambiar:

| Ubicación | Qué dice hoy |
|---|---|
| `payments/businessSettings.ts:4` | `offerQrPay: true` por defecto |
| `PagosSection.tsx:282-291` | Toggle "Pago con QR" visible |
| `PagosSection.tsx:70` | Toast "Cobros con QR configurados" |
| `MpHealthPanel.tsx:17-18,107` | El check de salud se llama "Cobros QR" |
| `MpPaymentsNotice.tsx:42-45` | Banner "activar cobros con QR" |
| `MpDevToolsPanel.tsx:152-156,244` | Herramientas de sesiones y provisioning QR |
| `mercadopago/checkout.ts:491` | Rechaza el pedido si `!offerQrPay` |

Y no hay ningún toggle de "ofrecer pago rápido": funciona por default implícito.

**Decisión sobre el recargo (2026-09-05):** hoy `payments/pricing.ts` cobra un recargo de 4,5%
al pago rápido (`FAST_PAY_SURCHARGE_BPS = 450`) contra 3,5% de descuento al QR, con un toggle
por comercio (`absorbFastPayFee`) para decidir quién lo paga. Se resolvió **eliminar el toggle
y el recargo al cliente**: la comisión la absorbe el comercio y el cliente ve el precio de
lista, sin líneas raras en el checkout.

Esto es una simplificación que borra código en vez de agregarlo: se va `absorbFastPayFee` de
`businessSettings.ts`, su UI en `PagosSection.tsx:294-309`, la rama de recargo en
`checkoutAmountCents`, y el campo del endpoint de opciones de checkout. `checkoutAmountCents`
queda devolviendo el monto base siempre.

Lo bueno: MercadoPago ya está en producción con la homologación aprobada, así que el camino
está despejado.

### Bloqueante #3: RBAC de rutas por rol

Un miembro con rol `driver` entra a `/negocio/[businessId]/configuracion/pagos` igual que el
owner. Las server actions sí validan rol en la cocina (`orders/actions.ts:37`), pero **la
navegación del panel no filtra nada**. La prop `role` que causa el error de typecheck es
justamente el intento abandonado de arreglarlo.

Relacionado: **el panel de Reparto no tiene link en el sidebar** (`BusinessSidebar.tsx:72-83`
lista Dashboard, Pedidos, WhatsApp, Carta). Un repartidor tiene que conocer la URL de memoria.

### Features anunciadas que no existen

Esto es lo que el panel le promete hoy a un comerciante y no puede cumplir:

| Feature | Dónde se promete | Estado real |
|---|---|---|
| **Planes Impulso y Líder** | `BusinessSidebar.tsx:276-302`, `BusinessOnboardingWizard.tsx:366`, `RegistroLanding.tsx:36` | Botones deshabilitados. `plans.ts:27-39` tiene `available: false`. |
| **Comisión del 7%** | Label en `BusinessSidebar.tsx:290`, metadata `plans.ts:6` | **Cero código de cobro.** No hay subscription, ni deducción en checkout, ni billing. |
| **Rangos y logros** | Spec completa en `docs/features/rangos-y-logros/` | **0% implementado.** No existe `src/lib/ranks.ts` ni nada equivalente. Los badges de `src/lib/badges/` son de cliente, no de comercio. |
| **Promociones** | Tarea del tutorial en `DashboardView.tsx:83-87` | Sin CRUD. La tarea está hardcodeada en `completed: false` (`queries.ts:180-182`). |
| **Menú QR imprimible** | Paso del tour en `DashboardView.tsx:76-80` | No existe generador. La tarea usa `productsCount >= 1` como proxy falso (`queries.ts:175-177`). |
| **Nueva sucursal** | `CreateBusinessCard.tsx:27-28` | `onboardingActions.ts:44-47` bloquea el segundo local por cuenta. |

El límite del plan Free sí se aplica de verdad, en el servidor: 25 productos y 5 categorías
(`menuActions.ts:53-76`).

### WhatsApp: dos sistemas, ninguno cerrado

- **OAuth de Meta self-service:** el código está **completo** (`api/meta/oauth/start`, callback en `route.ts:18-60`, UI en `WhatsAppConnectionCard.tsx:227-288`). Falta el **review de la app de Meta**, que es una dependencia externa con tiempo de espera que no controlás. Este es el riesgo de cronograma más peligroso del proyecto.
- **Bot n8n de pedidos:** el webhook funciona (`api/webhooks/whatsapp/route.ts:23-27`) pero **no tiene ninguna superficie en el panel**. Un comerciante no tiene forma de saber que existe ni de configurarlo.
- **Chat en el panel:** funcional con realtime, pero inútil sin una conexión de Meta activa.

### Deuda que ya se pagó

`SettingsLayout.tsx` y sus gemelos muertos `TabGeneral` / `TabOperacion` / `TabPagos` /
`TabCanales`, que `docs/debt.md:247-251` marca como código muerto, **ya fueron eliminados** y
reemplazados por `SettingsSubnav.tsx` con rutas separadas.

---

## 5. Cara Delivery — 73%

El núcleo está construido y es sólido: cola de despacho, asignación, claim race-safe con
`UPDATE ... WHERE delivery_driver_id IS NULL` (`delivery/actions.ts:314-344`), PIN de entrega
validado en el RPC con lock de 5 intentos por 15 minutos
(`20260905231000_order_rpc_transition.sql:86-107`), y realtime de la cola.

### El GPS es real. Con una trampa.

El camino completo funciona: geolocalización del navegador (`useDriverLocation.ts:54-77`) →
tabla `delivery_locations` (`locationActions.ts:57-62`) → realtime al cliente
(`OrderTrackingMap.tsx:190-216`), con lectura de la posición inicial para quien entra tarde
(`trackingMap.ts:90-113`).

La trampa es el fallback: si el repartidor no apretó "Iniciar reparto" o el GPS quedó viejo,
el cliente ve `demoRouteProgress`, una animación de ~3 minutos sobre la polyline
(`OrderTrackingMap.tsx:225-231`). **Hay que decidir**: o el mapa muestra "esperando ubicación
del repartidor", o se arranca el GPS automáticamente al pasar a `delivering`. Mostrar una moto
inventada como default no es una opción para una beta pública.

Nota: `docs/hitos/README.md:11` marca el Hito 02 (GPS) como "En curso". El código está; lo que
falta es el QA en dos dispositivos y esta decisión sobre el fallback.

### El bloqueante que mata todo el pipeline

**Nadie puede aprobar una postulación de repartidor.** El camino de una persona que quiere
repartir es:

```
Perfil cliente → DriverApplicationModal → delivery_profiles.status = 'pending_review'
   → [ ❌ NO HAY UI ADMIN ] → status = 'approved'
   → owner contrata (HireDriverModal) → business_members(role='driver')
   → driver acepta en /negocio → opera en /negocio/[id]/reparto
```

Las server actions `approveDriverProfileAction` y `rejectDriverProfileAction` existen y están
completas, con audit log y notificación al usuario (`delivery/profileActions.ts:226-332`), y
**tienen cero importadores en `src/app/admin/`**. Están huérfanas. Sin esa pantalla, las
postulaciones se acumulan, la lista de contratables está siempre vacía y no hay un solo
repartidor operando.

Detalle de seguridad a corregir de paso: esas actions usan el gate viejo
`app_metadata.role === "admin"` (`profileActions.ts:220-221`) en vez de
`requirePlatformSuperadmin`, que es el mecanismo del resto del admin.

### El repartidor no tiene una app

No hay ruta dedicada. Un repartidor entra a `/negocio/[businessId]/reparto`, **dentro del
panel completo del comercio**, con el sidebar del owner y sin ítem de Reparto en él. Es usable
en teléfono (`DriverBoard.tsx:57-78` es responsive) pero es la experiencia equivocada para
alguien que está arriba de una moto.

### Otros pendientes

- **Push al asignar:** funciona indirectamente vía `insertNotification` → trigger → edge function (`delivery/actions.ts:167-175`). `claimDeliveryOrder` no notifica a nadie. La suscripción push se pide en el perfil (`ProfileView.tsx:60`), no en la consola de reparto, así que la mayoría de los drivers no la va a tener.
- **PIN en texto plano** en la base (`20260905231000_order_rpc_transition.sql:104-107`). Para el volumen de una beta es aceptable, pero conviene anotarlo.
- **Sin navegación turn-by-turn**: deep link a Google Maps (`DeliveryOrderCard.tsx:48-50`). Correcto para v1.
- **Ruteo con OSRM público** y fallback a línea recta (`routeGeometry.ts:70-84`), ya marcado como `ponytail:` en el código.

---

## 6. Cara Admin — 81%

La cara más completa del proyecto, y la que menos horas necesita (16h). Casi todo el spec de
`docs/specs/superadmin-dashboard-y-jerarquia.md` está implementado: roles de plataforma con
JWT + tabla `platform_users`, KPIs de red, top 5 comercios, listado con búsqueda, publicar y
despublicar, aprobar y rechazar leads con claim token, Modo Escudo con cookie HMAC y TTL de
1 hora + auditoría, equipo de plataforma y hub de soporte.

### Lo que falta

| # | Qué | Evidencia |
|---|---|---|
| 1 | **UI de revisión de KYC de repartidores** | Es el mismo bloqueante de la sección 5, visto desde acá. Las actions existen, la pantalla no. **Es la tarea de mayor palanca de todo el proyecto**: 8 horas que desbloquean una cara entera. |
| 2 | El KPI de "usuarios registrados" cuenta `user_profiles`, no `auth.users` | `admin/queries.ts:63` — subcuenta |
| 3 | Listado de comercios sin filtros (Publicado / Oculto / Abierto / Plan) | `comercios/page.tsx` vs spec §5.1; tope de 100 filas |
| 4 | El cambio de plan es un botón que cicla free→impulso→líder | `comercios/page.tsx:77-87` — sin selector explícito |
| 5 | Falta el botón de acceso admin en el sidebar de negocio | Spec §3; hoy solo está en `Navbar.tsx:441-448` |
| 6 | `IMPERSONATE_COOKIE_SECRET` cae a `"dev-insecure-impersonate"` | `admin/impersonate.ts:15-18` — **hay que setear el secret en producción** |
| 7 | GMV con scan completo de filas | `admin/queries.ts:82`, ya marcado `ponytail:`. Sirve para Bolívar; no es bloqueante. |

---

## 7. Infra y lanzamiento — 13%

Esta es la cara que decide si hay beta o no, y está prácticamente en cero.

| # | Qué | Estado | Horas |
|---|---|---|---:|
| 1 | **Deploy productivo** | No existe ninguna config: sin `vercel.json`, sin `render.yaml`, sin `Dockerfile`. Decidiste VPS propio con posible Render para testear. | 10h |
| 2 | **Dominio, DNS y TLS** | Nada. `next.config.ts:10-19` todavía tiene orígenes de LAN y una URL random de `trycloudflare`. | 3h |
| 3 | **Variables de entorno de producción** | `.env.example` está desincronizado: le faltan `NEXT_PUBLIC_SITE_URL`, `MP_APP_ID`, `MP_CLIENT_SECRET`, `MP_WEBHOOK_SECRET`, `MP_TOKEN_SECRET`, `IMPERSONATE_COOKIE_SECRET`, entre otras. | 2h |
| 4 | **Migraciones sincronizadas** | Mejoró mucho: ya existe `supabase/config.toml` y hay 42 migraciones con timestamps únicos. Falta verificar que el historial de la DB viva coincida 1:1. | 4h |
| 5 | **Backups verificados** | Sin verificar. Free de Supabase no da point-in-time recovery. | 3h |
| 6 | **Cron de respaldo** | El auto-rechazo a 3 min y la expiración de sesiones son *lazy*: corren solo cuando alguien consulta el pedido. Un pedido que nadie mira queda colgado. Requiere `pg_cron` (Supabase Pro) o un cron en el VPS. | 4h |
| 7 | **Monitoreo de errores** | Nada. Sin logs centralizados no vas a saber qué se rompió en la beta. | 4h |
| 8 | **CI en verde** | El workflow existe y corre test + typecheck + lint en cada push. **Está rojo.** Se arregla con el bloqueante #1 de comercio. | 0h |
| 9 | **Review de la app de Meta** | Pendiente. **Dependencia externa sin fecha controlable.** | 4h |
| 10 | **Comercios piloto** | **Cero confirmados.** Hay que reclutarlos, hacerles el alta, cargarles la carta y conectarles MercadoPago. | 12h |
| 11 | **QA end-to-end y pasada de fixes** | Sin hacer. Es el ítem que más se subestima siempre. | 12h |

**Lo bueno:** los 42 checks pasan (`42/42`), MercadoPago está en producción homologado, y el
grueso de la deuda P0 de seguridad y dinero ya se cerró (precios server-side, refunds
idempotentes, RPC de transiciones con `REVOKE UPDATE`, dedupe de webhooks).

---

## 8. Decisiones tomadas (2026-09-05)

| Decisión | Resolución | Consecuencia |
|---|---|---|
| **Alcance vs fecha** | Escenario C: se mantiene el alcance completo y la fecha pasa al **29/09**. | Nada se recorta: lo que era post-beta entra en los tramos 3 y 4. La holgura queda en el 1%. |
| **WhatsApp** | Arranca con el **bot n8n** del piloto. El OAuth de Meta self-service queda para después del lanzamiento. | El review de Meta deja de ser un bloqueante de fecha. Hay que darle una superficie mínima al bot en el panel (BP-36), porque hoy no tiene ninguna. |
| **Recargo del pago rápido** | Se **elimina el toggle** `absorbFastPayFee`. La comisión la absorbe el comercio y el cliente paga precio de lista. | Menos código, no más: se borra el setting, su UI y la rama de recargo en el checkout. |
| **Pagos QR** | Se deprecan. El pago rápido (MP Checkout Pro) pasa a ser el canal único. | Hay que limpiar el lenguaje y el provisioning QR de todo el panel. |
| **Insignias de cliente** | Diferidas. El motor ya está completo y cableado, solo falta QA. | Baja de 8h a 3h de QA (BP-48). |

---

## 9. Plan de 24 días (al 29/09)

Dos personas en paralelo. **P1** hace producto y UI; **P2** hace infra, plataforma y datos. Se
cruzan en el QA del último tramo. Cuatro tramos de ~6 días que mapean bien a sprints de Jira.

### Tramo 1 · 05-10/09 — Desbloquear y fundar (~70h)

Lo primero es sacar los tapones: el CI rojo, la feature de reparto desactivada y la pantalla
que le falta al admin. En paralelo, que exista un lugar donde deployar.

| P1 — Producto y UI | P2 — Infra y plataforma |
|---|---|
| Commitear lo pendiente. Arreglar los 11 errores de lint (BP-3). Cablear `driversMetrics` de verdad (BP-4). | Deploy en Render para staging (BP-19 parcial). Sincronizar `.env.example` y cargar secrets (BP-21). Verificar el historial de migraciones (BP-22). |
| Pago rápido como canal único + retexteo sin lenguaje QR + eliminar `absorbFastPayFee` (BP-7, BP-8, BP-9). | **UI admin de KYC de repartidores** (BP-5) y migrar sus actions a `requirePlatformSuperadmin` (BP-6). |
| Páginas legales: términos, privacidad, contacto (BP-10). | Limpiar los banners ficticios del fallback y del seed de DB (BP-12). Bloquear checkout con comercio cerrado (BP-13). |
| — | **Arrancar el reclutamiento de comercios piloto** (BP-23, se estira por todo el proyecto). |

### Tramo 2 · 11-16/09 — Cliente honesto y delivery operable (~70h)

Acá se saca todo lo que hoy le miente al usuario, y el repartidor pasa a tener una experiencia
propia.

| P1 — Producto y UI | P2 — Infra y plataforma |
|---|---|
| Envío y pedido mínimo reales: schema, config, checkout, `canCheckout` (BP-11). Aplicar los horarios cargados al abierto/cerrado (BP-13b). | GPS: sacar el fallback simulado y auto-start al pasar a `delivering` (BP-14). Push al driver al asignar y al tomar (BP-34). |
| RBAC del panel por rol + link de Reparto en el sidebar (BP-15, BP-16). Vista mobile-first del repartidor (BP-17). | Backups con ensayo de restore (BP-25). Cron de respaldo para timeouts (BP-26). Monitoreo de errores (BP-27). |
| Carrito persistente, empty state del home, error boundaries, VAPID (BP-29 a BP-32). Ocultar lo que promete features que aún no están (BP-35). | KPI de usuarios contra `auth.users` (BP-37). Filtros del listado de comercios (BP-38). |

### Tramo 3 · 17-22/09 — Las features que pediste adentro (~67h)

Este tramo es casi todo desarrollo nuevo desde cero. Es el que más riesgo de estimación tiene,
porque no hay código previo del cual medir.

| P1 | P2 |
|---|---|
| Rangos y logros del comercio: rangos, XP, misiones, vitrina (BP-44, ~25h). | Planes pagos y cobro de comisión (BP-43, ~30h). Es el ítem más grande del proyecto y toca dinero: conviene arrancarlo acá, no después. |
| CRUD de promociones (BP-45, ~12h). | — |

### Tramo 4 · 23-29/09 — Cerrar, pulir y lanzar (~74h)

| P1 | P2 |
|---|---|
| Reseñas y ratings (BP-46). Generador de menú QR (BP-47). Botón seguir comercio (BP-49). Filtros de categoría que filtren (BP-33). | Superficie del bot n8n en el panel (BP-36). Selector de plan, botón admin en sidebar, hash del PIN, pulido responsive (BP-39 a BP-42). |
| **23-26/09: QA E2E general y pasada de fixes (BP-24), ambos.** Pedido real punta a punta en dos dispositivos: cliente → comandera → despacho → repartidor con GPS → PIN → entregado. QA de reparto (BP-18) y de insignias (BP-48). | Onboarding de los comercios piloto: carta cargada y MercadoPago conectado. Review de Meta en paralelo (BP-28), sin bloquear. |
| **27-28/09: congelamiento.** Nada nuevo entra. Solo fixes de lo que salga del QA. | Verificar backups, revisar logs, ensayo de rollback. |
| **29/09** | 🚀 Beta pública |

### Los dos riesgos de este plan

1. **Los comercios piloto están en la ruta crítica y no dependen de vos.** Aparecen en el
   tramo 4 pero la conversación tiene que arrancar el **día 1**. Si el 26/09 no hay locales con
   la carta cargada y MP conectado, no hay beta por más verde que esté el código.
2. **El tramo 3 son 67 horas de código que no existe.** Planes pagos con cobro de comisión es
   el ítem más caro y el que más se subestima, porque toca dinero de verdad. Si ese tramo se
   desborda, se come el QA del tramo 4, que es lo último que conviene sacrificar. Si a mitad
   del tramo 3 vas atrasado, la salida sana es diferir rangos y logros, no recortar el QA.

---

## 10. Backlog para Jira

Épicas: `INFRA` · `CALIDAD` · `PAGOS` · `CLIENTE` · `COMERCIO` · `DELIVERY` · `ADMIN` · `LANZAMIENTO`

Prioridad: `P0` = bloqueante, tramos 1-2 · `P1` = en alcance, tramos 2-3 · `P2` = en alcance, tramo 4

Con el escenario C **no hay épica `DIFERIDO`**: todo lo que antes era post-beta entró al plan,
en los tramos 3 y 4. Lo único fuera es el review de Meta (BP-28), que no depende de nosotros.

| ID | Épica | Tarea | Cara | Prio | Est. | Evidencia |
|---|---|---|---|---|---:|---|
| BP-1 | CALIDAD | ~~Arreglar 4 errores de typecheck~~ **Hecho** (sin commitear) — commitear | Comercio | P0 | 0h | `pnpm typecheck` pasa |
| BP-2 | CALIDAD | ~~Prop `shell` faltante en `BusinessTopbar`~~ **Hecho** (sin commitear) | Comercio | P0 | 0h | `BusinessLayout.tsx:59` |
| BP-3 | CALIDAD | Arreglar 11 errores de lint de `react-hooks` (CI rojo) | Transversal | P0 | 4h | `CartProvider.tsx:181,219`, `FavoritosView.tsx:40`, +8 |
| BP-4 | COMERCIO | Cablear `driversMetrics` de verdad (hoy la prop es opcional y siempre vacía) | Comercio | P0 | 4h | `queries.ts:261-269`, lógica lista en `dashboard.ts:186-214` |
| BP-5 | ADMIN | **UI de revisión de KYC de repartidores** (aprobar / rechazar / ver docs) | Admin | P0 | 8h | actions huérfanas en `profileActions.ts:226-332` |
| BP-6 | ADMIN | Migrar las actions de KYC a `requirePlatformSuperadmin` | Admin | P0 | 1h | `profileActions.ts:220-221` |
| BP-7 | PAGOS | Pago rápido como canal único: default, toggles, checkout | Comercio | P0 | 6h | `businessSettings.ts:4`, `PagosSection.tsx:282-291`, `checkout.ts:491` |
| BP-8 | PAGOS | Retextear health panel, notices y dev tools sin lenguaje QR | Comercio | P0 | 4h | `MpHealthPanel.tsx:17-18,107`, `MpPaymentsNotice.tsx:42-45` |
| BP-9 | PAGOS | Eliminar `absorbFastPayFee` y el recargo al cliente (lo absorbe el comercio) | Cliente | P0 | 1h | `pricing.ts:2`, `businessSettings.ts:5`, `PagosSection.tsx:294-309` |
| BP-10 | CLIENTE | Páginas de términos, privacidad y contacto | Cliente | P0 | 6h | no existen bajo `src/app` |
| BP-11 | CLIENTE | Envío y pedido mínimo reales: schema, config, checkout, `canCheckout` | Cliente | P0 | 10h | `home.ts:30-31`, `publicStore.ts:89-90`, `cart.ts:112` |
| BP-12 | CLIENTE | Limpiar banners ficticios (fallback + seed de DB) | Cliente | P0 | 2h | `staticContent.ts:39-40`, `20260902000000_promo_banners.sql:47-112` |
| BP-13 | CLIENTE | Bloquear checkout si el comercio está cerrado | Cliente | P0 | 2h | `checkout.ts:97` |
| BP-13b | CLIENTE | Aplicar los horarios cargados al abierto/cerrado (hoy `isOpenByHours` no se llama) | Cliente | P0 | 4h | `business/hours.ts:51` sin llamadores; todo lee `businesses.is_open` |
| BP-14 | DELIVERY | Sacar el fallback de repartidor simulado del mapa del cliente | Cliente | P0 | 4h | `OrderTrackingMap.tsx:220-231`, `routeGeometry.ts:89-95` |
| BP-15 | COMERCIO | RBAC de rutas del panel por rol (el intento se descartó al arreglar tsc) | Comercio | P0 | 6h | `role` quitado de `BusinessLayout.tsx:46` |
| BP-16 | COMERCIO | Link de Reparto en el sidebar, filtrado por rol | Comercio | P0 | 1h | idem |
| BP-17 | DELIVERY | Vista mobile-first del repartidor | Delivery | P0 | 10h | hoy usa el panel completo del comercio |
| BP-18 | DELIVERY | QA E2E de reparto en dos dispositivos | Delivery | P0 | 4h | pendiente en hitos 01, 02 y feature 07 |
| BP-19 | INFRA | Deploy productivo en VPS (Docker + reverse proxy + TLS) | Infra | P0 | 10h | sin config de deploy en el repo |
| BP-20 | INFRA | Dominio, DNS y TLS; limpiar `allowedDevOrigins` | Infra | P0 | 3h | `next.config.ts:10-19` |
| BP-21 | INFRA | Sincronizar `.env.example` y cargar secrets de producción | Infra | P0 | 2h | faltan 6+ vars, incl. `IMPERSONATE_COOKIE_SECRET` |
| BP-22 | INFRA | Verificar historial de migraciones contra la DB viva | Infra | P0 | 4h | `supabase/config.toml` ya existe |
| BP-23 | LANZAMIENTO | Reclutar 3-5 comercios piloto, cargar carta y conectar MP | Infra | P0 | 12h | cero confirmados |
| BP-24 | LANZAMIENTO | QA E2E general y pasada de fixes | Transversal | P0 | 12h | — |
| BP-25 | INFRA | Backups de DB verificados con ensayo de restore | Infra | P1 | 3h | sin verificar |
| BP-26 | INFRA | Cron de respaldo para timeouts y expiración de sesiones | Infra | P1 | 4h | hoy *lazy*, ver `docs/debt.md` §9 |
| BP-27 | INFRA | Monitoreo de errores y logs centralizados | Infra | P1 | 4h | nada |
| BP-28 | INFRA | Review de la app de Meta para WhatsApp — **post-lanzamiento**, no bloquea | Comercio | P2 | 4h | dependencia externa; el día 1 va con el bot n8n |
| BP-29 | CLIENTE | Persistir el carrito entre sesiones | Cliente | P1 | 3h | `CartProvider.tsx:106` |
| BP-30 | CLIENTE | Empty state del home sin comercios publicados | Cliente | P1 | 2h | `HomeContent.tsx:296,359` |
| BP-31 | CLIENTE | Error boundaries en rutas de cliente | Cliente | P1 | 3h | solo existe uno, en `/negocio/.../carta` |
| BP-32 | CLIENTE | Desplegar claves VAPID y verificar push end-to-end | Cliente | P1 | 3h | `usePwaPush.ts:51-97` |
| BP-33 | CLIENTE | Hacer que los filtros de categoría del header filtren de verdad | Cliente | P1 | 5h | `HomeContent.tsx:41-42,578-581` |
| BP-34 | DELIVERY | Push al driver al asignar y al tomar; suscripción en la consola | Delivery | P1 | 4h | `actions.ts:167-175`, `claimDeliveryOrder` no notifica |
| BP-35 | COMERCIO | Ocultar UI que promete features inexistentes (promos, menú QR, planes, sucursal) | Comercio | P1 | 3h | `DashboardView.tsx:76-87`, `CreateBusinessCard.tsx:27-28` |
| BP-36 | COMERCIO | Superficie en el panel para el bot n8n (es el canal de WhatsApp del día 1) | Comercio | P1 | 4h | `api/webhooks/whatsapp/route.ts:23-27` sin UI |
| BP-37 | ADMIN | KPI de usuarios contra `auth.users` | Admin | P1 | 2h | `admin/queries.ts:63` |
| BP-38 | ADMIN | Filtros del listado de comercios (publicado, abierto, plan) | Admin | P1 | 4h | spec §5.1 |
| BP-39 | ADMIN | Selector explícito de plan en vez del botón que cicla | Admin | P2 | 2h | `comercios/page.tsx:77-87` |
| BP-40 | ADMIN | Botón de acceso admin en el sidebar de negocio | Admin | P2 | 2h | spec §3 |
| BP-41 | DELIVERY | Hashear el PIN de entrega en la base | Delivery | P2 | 2h | `20260905231000_order_rpc_transition.sql:104-107` |
| BP-42 | COMERCIO | Pulido responsive del panel (búsqueda y menú de usuario en mobile) | Comercio | P2 | 4h | `BusinessTopbar.tsx:173-189,227` |
| BP-43 | COMERCIO | Planes pagos y cobro de comisión (billing) — **tramo 3** | Comercio | P1 | 30h | `plans.ts:27-39`, cero código de cobro. El ítem más caro y el que toca dinero. |
| BP-44 | COMERCIO | Rangos y logros del comercio — **tramo 3** | Comercio | P1 | 25h | spec en `docs/features/rangos-y-logros/`, 0% implementado |
| BP-45 | COMERCIO | CRUD de promociones — **tramo 3** | Comercio | P1 | 12h | `queries.ts:180-182` |
| BP-46 | CLIENTE | Reseñas y ratings de comercio — **tramo 4** | Cliente | P2 | 10h | sin tabla `reviews` |
| BP-47 | COMERCIO | Generador de menú QR imprimible — **tramo 4** | Comercio | P2 | 6h | tarea falsa en `queries.ts:175-177` |
| BP-48 | CLIENTE | QA E2E de insignias de cliente (el motor ya está completo y cableado) | Cliente | P2 | 3h | 6 archivos en `src/lib/badges/`, con hooks en entregas y onboarding |
| BP-49 | CLIENTE | Botón "Seguir comercio" con persistencia — **tramo 4** | Cliente | P2 | 4h | `StoreHubView.tsx:171` |

**Total:** 50 tarjetas, 286h en 4 tramos. Los bloqueantes `P0` son 25 tarjetas / 138h y viven
en los tramos 1 y 2.

Las horas por escenario salen de `scripts/beta-score.mjs`, no de la suma de esta tabla: el
script es la fuente de verdad y la tabla es su vista para Jira.

---

## 11. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Cero comercios piloto confirmados** | Sin comercios no hay beta, esté el código como esté | Arrancar el reclutamiento el día 1, en paralelo al código. Es el ítem con más lead time y menos control. |
| **El tramo 3 son 67h de código que no existe** | Si se desborda se come el QA del tramo 4 | Arrancar billing (BP-43) al principio del tramo. Si a mitad de camino vas atrasado, diferir rangos y logros (BP-44) antes que recortar QA. |
| **El plan usa 286 de 288 horas (1% de holgura)** | El 29/09 es la fecha más temprana posible, no la probable | Comunicar el 03/10 hacia afuera. Revisar el avance al cierre de cada tramo; dos tramos con atraso = mover la fecha, no comprimir el QA. |
| ~~Review de Meta sin fecha~~ | **Resuelto:** el día 1 va con el bot n8n; el OAuth de Meta queda post-lanzamiento | BP-28 pasó a P2. A cambio hay que darle superficie al bot en el panel (BP-36). |
| **Un solo entorno** | Sin staging, cada deploy es a producción | Render para staging (ya está en el plan de D1-D2). |
| **Sin monitoreo** | Los errores de la beta llegan por WhatsApp de un comerciante enojado | BP-27 antes del lanzamiento. |
| **`refund_pending` sin job de retry** | Un refund fallido queda colgado en silencio | Conocido en `docs/debt.md` §12. Para el volumen de la beta, revisión manual alcanza. |
| **`reconcilePayment` heurístico** | Puede mal-atribuir un pago entre comercios | `docs/debt.md` §18. Con 3-5 comercios el riesgo es bajo pero real. |
| **Backups sin ensayar** | Pérdida de datos sin recuperación probada | BP-25. Un restore que nunca se probó no es un backup. |

---

## 12. Qué se actualizó en la documentación

Este análisis encontró documentación que contradecía el código. Se corrigió:

- **`docs/features/00-04` y `06`** — 20 ítems de checklist sin tildar de features que están shippeadas hace meses. Marcados como hechos.
- **`docs/features/10-insignias-cliente/README.md`** — listaba como pendientes archivos que ya existen (`definitions.ts`, `engine.ts`, `engine.check.ts`).
- **`docs/hitos/README.md`** — el Hito 04 figuraba ✅ Hecho con el data layer sin cablear y el build roto. Corregido a "en curso". El Hito 02 pasó a "código completo, falta QA".
- **`docs/debt.md`** — se marcó la deuda ya cerrada: `mockData.ts` eliminado, `SettingsLayout` y gemelos eliminados, `supabase/config.toml` creado, `.env.example` trackeado, CI existente, 42 checks corriendo, package renombrado.
- **`ARQUITECTURA.md`** — no mencionaba reparto, GPS, insignias, roles de plataforma ni las tablas nuevas (`delivery_profiles`, `delivery_locations`, `platform_users`, `product_likes`, `customer_badges`).
- **Links `file:///home/cipher/...`** — rotos en cualquier máquina que no sea esta. Convertidos a rutas relativas.

---

*Para recalcular los porcentajes después de cerrar tareas: editá el estado de la capacidad en
`scripts/beta-score.mjs` y corré `node scripts/beta-score.mjs`.*
