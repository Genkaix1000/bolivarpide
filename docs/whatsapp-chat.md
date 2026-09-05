# Chat integrado WhatsApp Business — Runbook

El panel del negocio (`/negocio/[businessId]/whatsapp`) ahora es un chat **real**
conectado a Meta Cloud API: recibe los mensajes de los clientes, permite
responder desde la app y armar/vincular comandas sin salir del panel.

```
Cliente WhatsApp
      ▼
Meta Cloud API  ──webhook──►  Next /api/webhooks/meta  (GET verify + POST firmado HMAC)
      ▲                              │  (X-Hub-Signature-256, META_APP_SECRET)
      │                              ▼
      │                 resolve phone_number_id → business_whatsapp
      │                              │
      │                              ├─► whatsapp_messages (persistir)
      │                              ├─► media → Storage bucket whatsapp-media
      │                              └─► Realtime → panel negocio
      │
      └────── respuestas ──  sendWhatsAppText → Graph API (token del Vault)
```

## Env vars nuevas (`.env` / `.env.local` de la app)

| Variable | Para qué |
|---|---|
| `META_WEBHOOK_VERIFY_TOKEN` | Token de verificación del webhook de Meta (GET `hub.challenge`). Lo definís vos y va también en Meta > Webhook config. |
| `META_APP_SECRET` | App secret de tu app de Meta. Se usa para validar la firma `X-Hub-Signature-256` de cada POST del webhook y como `client_secret` en el OAuth. |
| `META_APP_ID` | ID de la app de Meta. Necesario para el enlace self-service (Business Login). |
| `META_GRAPH_VERSION` | Opcional. Versión de Graph API, por defecto `v22.0`. Acepta `v22.0` o `22.0`. Antes convivían dos defaults (`v21.0` en los envíos, `v22.0` en el OAuth); ahora sale de `src/lib/whatsapp/graph.ts` y es una sola. |
| `META_OAUTH_REDIRECT_URI` | Redir del OAuth. Debe ser EXACTO al "Valid OAuth redirect URIs" de la app. Default: `<site>/api/meta/oauth/callback`. |
| `WHATSAPP_WEBHOOK_SECRET` | **Deprecated.** Era el secret compartido con n8n para `/api/webhooks/whatsapp`. Se mantiene solo por retro-compat con la rama `n8n`. |

## En Meta (Cloud API → Webhook configuration)

1. **Callback URL**: `https://<tu-app>/api/webhooks/meta`
2. **Verify token**: el valor de `META_WEBHOOK_VERIFY_TOKEN`.
3. **Campos (fields) a suscribir**:
   - `messages` → mensajes entrantes (texto + media).
   - `message_deliveries` y `message_reads` → actualizar estado delivered/read de los mensajes salientes.
   - `message_echoes` → (opcional) ver los envíos propios; el panel ya registra sus outbound al enviar, así que no es necesario.
4. Al guardar, Meta hace `GET /api/webhooks/meta?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…`, y Next responde el challenge si el token coincide.

> La firma se valida contra `META_APP_SECRET` con `X-Hub-Signature-256` en cada
> POST; si el secret no coincide, el webhook responde 401 y descarta el payload.

## Migración DB

Aplicar en orden (SQL Editor o `psql -f`):

1. `supabase/migrations/20260904_whatsapp_messages.sql`
   - Tabla `whatsapp_messages` (persistencia de mensajes inbound/outbound).
   - RLS: SELECT para miembros/admin (`is_business_member`); escrituras solo `service_role`.
   - Bucket `whatsapp-media` (public read, write service-only) para guardar la media entrante.
2. `supabase/migrations/20260904_whatsapp_status_templates.sql`
   - Columnas en `business_whatsapp`: `notify_status`, `template_order_status_name`, `template_order_status_language`.
3. `supabase/migrations/20260905000000_whatsapp_oauth.sql`
   - Tabla `meta_oauth_states` + RPC `consume_meta_oauth_state` (estado OAuth single-use).
   - `whatsapp_messages.updated_at`, status `rejected`, y publicación Realtime del chat.
   - `business_whatsapp`: `token_expires_at`, `connected_at`, `meta_user_id`, `verified_name`.
4. `supabase/migrations/20260906010000_whatsapp_webhook_timestamp_fix.sql`
   - Repara los inbound guardados con `created_at` de 1970 (ver más abajo).
5. `supabase/migrations/20260906020000_whatsapp_message_errors.sql`
   - `whatsapp_messages`: `error_code`, `error_title`, `error_details` para
     mostrar los envíos fallidos en el chat.

## Capas del envío

```
UI  →  actions.ts (server action)   authz + ventana 24 h + revalidatePath
                    │
sistema → templates.ts              elige texto libre vs template
                    │
                    ▼
              send.ts               primitivos: arma el payload y persiste
                    │               (incluida la fila `failed` con el código)
                    ▼
              graph.ts              versión, timeout, reintentos, MetaGraphError
```

`send.ts` no hace authz ni `revalidatePath` a propósito: la notificación de
estado la dispara el sistema desde `after()`, fuera de la sesión del usuario.
Cuando reusaba el server action arrastraba `requireBusinessAccess` —que hace
`redirect()` y depende de las cookies— dentro de un contexto donde no aplica.

Los envíos fallidos quedan en el chat con el motivo de Meta (`error_title`) en
vez de desaparecer: antes el error moría en un toast y el mensaje no aparecía
en ningún lado.

## Enlazar WhatsApp con Meta (self-service, sin admin)

Desde **Configuración → Canales**, el dueño toca **"Conectar con Meta / WhatsApp"**:

```
/negocio/[id]/configuracion/canales
   → GET /api/meta/oauth/start?businessId=…   (auth + miembro; crea meta_oauth_states)
   → facebook.com/v22.0/dialog/oauth          (scopes business_management,
        whatsapp_business_management, whatsapp_business_messaging)
   → GET /api/meta/oauth/callback          (consume state, code → short → long-lived 60d)
        ├─ GET /me                                  → dueño del token
        ├─ GET /{ownerId}/whatsapp_business_accounts → WABA
        ├─ GET /{waba_id}/phone_numbers             → número conectado
        ├─ GET /{phone_number_id}                   → verifica acceso
        ├─ POST /{waba_id}/subscribed_apps          → suscribe la app a los webhooks
        ├─ token → Supabase Vault (create_secret/update_secret)
        └─ upsert business_whatsapp: status='connected', is_active=true, token_expires_at
   → redirect a canales?whatsapp=connected
```

> El `POST /{waba_id}/subscribed_apps` no es opcional: sin él Meta no entrega
> **ningún** evento de esa WABA a la app y la conexión queda `connected` sin
> recibir un solo mensaje. Va antes de tocar el Vault para no dejar estado a
> medias si Meta lo rechaza; es idempotente, así que reconectar no rompe nada.

Requisito en Meta: la **WABA del local debe estar vinculada a la app** de la
plataforma (Business integration). El token queda en el Vault cifrado; nunca
toca el navegador. La conexión queda activa al instante, sin que un admin la
habilite. El form manual (token pegado) sigue disponible bajo
"Configuración avanzada" para casos excepcionales y conserva el paso de admin.

> Los tokens long-lived de system user vencen a los 60 días. El panel muestra
> la fecha de vencimiento —y a 7 días o menos lo avisa en ámbar— y los envíos
> rechazan un token vencido; el dueño usa "Reconectar con Meta" para rotar.

**Desconectar** (`disconnectWhatsAppNumber`) hace `DELETE
/{waba_id}/subscribed_apps` para cortar la entrega de webhooks y deja la
conexión inactiva, así ningún camino de envío la toma. No borra el secreto del
Vault: reconectar es un click y el token vence solo. Si Meta rechaza la baja de
la suscripción, igual se desactiva localmente — que es lo que el dueño pidió.

## Mover el webhook desde n8n a Next

Este hito **saca a n8n del path** de recepción:

1. En Meta, apuntá la Callback URL a `/api/webhooks/meta` (paso anterior) y desactivá el campo del webhook que apuntaba a n8n.
2. El bot de keywords (menú, "2 muzza", confirmar) queda **apagado**: ahora la toma de pedidos por WhatsApp es manual desde el chat (`+ Nueva comanda` / `Vincular pedido`).
3. El endpoint legacy `/api/webhooks/whatsapp` (create_order vía n8n) queda deprecated; se conserva para no romper la rama `n8n`, pero ya no lo llama ningún flujo nuevo.

## Flujo del chat (panel)

- **Lista**: `listChatSummaries` agrupa por `chat_id` con la RPC
  `whatsapp_chat_summaries` (último mensaje, no-leídos y último inbound
  agregados en la base) y le cruza los pedidos vivos. No trae mensajes.
- **Detalle**: `getChatDetail(businessId, chatId, before?)` trae una página de
  50 mensajes del chat abierto, paginando hacia atrás por keyset sobre
  `created_at`. `canReply` sale de una consulta propia del último inbound, no
  de la página: si los últimos 50 mensajes son salientes, el inbound que abre
  la ventana queda fuera de la página.
- **Realtime**: suscripción a `whatsapp_messages` y `orders` del negocio,
  con debounce de 250 ms. Un evento refresca la lista (una agregación) y sólo
  recarga el chat abierto si le pertenece. Antes cualquier evento del negocio
  —incluido un pedido sin chat— recargaba el historial completo de todas las
  conversaciones.
- **Responder**: `sendWhatsAppText` valida acceso, ventana de 24 h y token del Vault; persiste el outbound (status `sent` → `delivered`/`read` llegan por el webhook de Meta).
- **Ventana vencida**: fuera de las 24 h el input se reemplaza por un aviso + link `wa.me` para contestar desde la app oficial (Meta exige templates fuera de la ventana).
- **Nueva comanda**: modal con la carta del negocio (`products`); `createWhatsAppOrder` llama al RPC `create_order` con `source='whatsapp'` y `wa_chat_id`, así el pedido aparece en la comandera con sonido y queda ligado al chat.
- **Vincular pedido**: modal con pedidos en curso (pending/preparing/delivering) sin chat; `linkOrderToChat` setea `orders.wa_chat_id`.

## Media

Cuando llega una imagen o audio, el webhook la descarga con el token del Vault
(`fetchMetaMedia`) y la sube a `whatsapp-media` (la URL temporal de Meta vence
a los ~5 min).

**El bucket es privado.** Ahí adentro va lo que el cliente manda por WhatsApp:
comprobantes de transferencia, fotos de la fachada con la dirección, a veces
documentos. Nació con `public = true` y una policy de SELECT sin condición de
negocio, así que cualquiera con la URL los abría sin estar autenticado — y la
URL pública además quedaba guardada en `media_json.storage_url`.

Ahora sólo se persiste `media_json.storage_path`, y `getChatDetail` firma URLs
temporales (1 h) en lote con `createSignedUrls` al leer el chat. La migración
`20260906040000` cierra el bucket, borra la policy abierta y limpia las
`storage_url` viejas.

> **Pendiente de decisión: retención.** Hoy los mensajes y la media se guardan
> para siempre. No se implementó borrado automático a propósito —elegir la
> ventana es una decisión del negocio y el borrado no se deshace—, pero
> conviene definirla: es data personal de clientes que se acumula sin techo.

### Tipos de mensaje soportados

| Tipo | Cómo se guarda | Cómo se ve |
|---|---|---|
| `text` | `text_body` | burbuja |
| `image` / `sticker` | Storage + `storage_path` | preview |
| `audio` | Storage + `storage_path` | `<audio controls>` (Meta no manda duración: la lee el reproductor) |
| `video` | Storage + `storage_path` | `<video controls>` |
| `document` | Storage + `file_name` | link con el nombre del archivo |
| `location` | `media_json.location` | tarjeta con link a Google Maps |
| `contacts` | `media_json.contacts` | tarjeta con links `wa.me` |

`location` y `contacts` estaban tipados como media, así que el parser les
buscaba `id`/`mime_type`, no encontraba nada y el mensaje llegaba al chat como
una burbuja vacía. Su payload es estructurado (lat/long, o un array de
tarjetas) y ahora se guarda tal cual en `media_json`.

El audio tenía un botón de play que sólo cambiaba de ícono —no había ningún
`<audio>` en el componente— y mostraba "0:15" fijo para todos.

## Cambios de estados en el chat

El chat usa el lifecycle real de la app (`pending → preparing → delivering →
delivered | rejected`, `src/lib/orders/lifecycle.ts`). Se eliminaron los
estados mock `ready`/`cancelled`. El avance de estado desde el chat reusa
`advanceOrderStatus` (mismas reglas de PIN/permisos que la comandera).

## Notificaciones de estado al cliente (templates)

Los pedidos originados por WhatsApp (`source='whatsapp'`) quedan vinculados a
un chat (`wa_chat_id`) y al avanzar la comanda (`preparing / delivering /
delivered / rejected`) se le notifica al cliente:

- **Dentro de la ventana de 24 h** → texto libre (`sendWhatsAppText`, copy de
  `trackingCopy`), sin template.
- **Fuera de la ventana** → **template aprobada** de Meta (`sendOrderStatusTemplate`),
  solo si el negocio activó `notify_status` y cargó `template_order_status_name`.
  La template se mapea con los parámetros `[pedido, título, subtítulo]` (p. ej.
  `shipping_update` de las apps de ejemplo).

Implementación:

- `src/lib/whatsapp/templates.ts` — `notifyOrderStatusByWhatsApp(orderId, status)`
  y `sendOrderStatusTemplate(businessId, chatId, row)`.
- Hook en `src/lib/orders/actions.ts` → `advanceOrderStatus` (ramas forward +
  rejected) en paralelo a la notificación in-app.
- Config por negocio en `business_whatsapp` (Settings → Canales, bloque
  "Notificar estado del pedido" con su propio **Guardar avisos**): toggle
  `notify_status` + nombre/idioma de template. Se guarda con
  `updateWhatsAppNotifySettings`, **separado** del formulario de conexión: antes
  compartían action, así que guardar los avisos exigía re-pegar el access token
  y devolvía la conexión a `unverified`/`is_active=false`.
- La template se elige de un **select** con las aprobadas de la WABA
  (`GET /{waba_id}/message_templates` vía `/api/whatsapp/templates`), y elegirla
  también fija el idioma. Antes se tipeaba el nombre a ciegas y el error recién
  aparecía cuando un pedido salía de la ventana y el envío fallaba en silencio.
  Si Meta no devuelve las templates, la UI cae al input manual.

> Ojo con la semántica del toggle: hoy `notify_status` sólo gatea el envío
> **fuera** de la ventana (el de template). Dentro de las 24 h el texto libre
> sale igual, aunque el toggle esté apagado. Está pendiente decidir si se
> respeta el toggle en ambos caminos (y con qué default, hoy es `false`).

## `created_at` de los mensajes entrantes

Meta serializa `timestamp` como **string** (`"timestamp": "1757030400"`). El
parser lo leía con un guard `typeof v === "number"`, así que caía a `0` y todo
inbound se persistía con `created_at = 1970-01-01`. Como la ventana de 24 h se
deriva del último inbound, quedaba vencida siempre: el negocio no podía
responder desde el panel y las notificaciones nunca usaban texto libre.

`src/lib/whatsapp/webhook.check.ts` cubre el caso (string, número, milisegundos,
ausente y basura). La migración `20260906010000` repara las filas viejas usando
`updated_at`, clampeado fuera de la ventana viva para no habilitar envíos de
texto libre que Meta rechazaría (error 131047).

> **Producción**: cada negocio tiene su WABA, así que la template debe estar
> aprobada en SU WABA. En la app de prueba, `shipping_update` viene precargada.
> Si no hay template aprobada, el envío fuera de ventana se omite en silencio
> (solo se notifica si estabas dentro de las 24 h).

## + cheats para verificar

- Enviar un mensaje al número de prueba → debe aparecer en el chat del panel en tiempo real.
- Desde el panel, responder → el cliente recibe el texto y en la DB queda `direction='outbound'`.
- Marcar comanda desde el chat → `create_order` valida precios contra `products` (401/500 si el precio no coincide), y el pedido suena en `/negocio/{id}/pedidos`.
- Avanzar una comanda WhatsApp a `preparing` dentro de las 24 h → el cliente recibe "Preparando tu pedido"; fuera de la ventana, con template configurada → llega `shipping_update`.
- Fuera de las 24 h: el input se bloquea con el aviso de ventana.