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
| `META_GRAPH_VERSION` | Opcional. Versión de Graph API, por defecto `v21.0` (p. ej. `v22.0`). |
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
> la fecha de vencimiento y `sendWhatsAppText` rechaza responder con un token
> vencido; el dueño usa "Reconectar con Meta" para rotar.

## Mover el webhook desde n8n a Next

Este hito **saca a n8n del path** de recepción:

1. En Meta, apuntá la Callback URL a `/api/webhooks/meta` (paso anterior) y desactivá el campo del webhook que apuntaba a n8n.
2. El bot de keywords (menú, "2 muzza", confirmar) queda **apagado**: ahora la toma de pedidos por WhatsApp es manual desde el chat (`+ Nueva comanda` / `Vincular pedido`).
3. El endpoint legacy `/api/webhooks/whatsapp` (create_order vía n8n) queda deprecated; se conserva para no romper la rama `n8n`, pero ya no lo llama ningún flujo nuevo.

## Flujo del chat (panel)

- **Lista**: las conversaciones se agrupan por `chat_id` desde `whatsapp_messages`, con último mensaje, no-leídos y pedido activo vinculado.
- **Realtime**: cancelar suscripción a `whatsapp_messages` y `orders` del negocio — un mensaje nuevo refresca la lista al instante.
- **Responder**: `sendWhatsAppText` valida acceso, ventana de 24 h y token del Vault; persiste el outbound (status `sent` → `delivered`/`read` llegan por el webhook de Meta).
- **Ventana vencida**: fuera de las 24 h el input se reemplaza por un aviso + link `wa.me` para contestar desde la app oficial (Meta exige templates fuera de la ventana).
- **Nueva comanda**: modal con la carta del negocio (`products`); `createWhatsAppOrder` llama al RPC `create_order` con `source='whatsapp'` y `wa_chat_id`, así el pedido aparece en la comandera con sonido y queda ligado al chat.
- **Vincular pedido**: modal con pedidos en curso (pending/preparing/delivering) sin chat; `linkOrderToChat` setea `orders.wa_chat_id`.

## Media

Cuando llega una imagen o audio, el webhook la descarga con el token del Vault
(`fetchMetaMedia`) y la sube a `whatsapp-media` para que la URL no venza (la
URL temporal de Meta expira). En el chat se previsualiza desde Storage; el
audio se muestra como botón de play (compat de codec según browser).

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