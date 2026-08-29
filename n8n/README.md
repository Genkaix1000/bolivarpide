# WhatsApp Bot — n8n Integration Runbook

Integración de WhatsApp (Meta Cloud API) vía **n8n self-hosted** para que los
comercios de BolivarPide tomen pedidos y respondan consultas por WhatsApp.
El pedido confirmado se inserta en `orders`/`order_items` contra Supabase y
aparece en el panel del negocio por Realtime (el `OrdersBoard` ya suena cuando
llega un `pending`).

```
Cliente WhatsApp
      │
      ▼
Meta Cloud API  ──webhook──►  n8n (self-hosted, HTTPS público)
      ▲                             │
      │                             ├─► Supabase: lookup business_whatsapp (por phone_number_id)
      │                             ├─► Supabase: leer/guardar whatsapp_sessions (carrito)
      │                             ├─► Supabase: leer products / business_hours (menú, horarios)
      │                             └─► POST /api/webhooks/whatsapp (pedido confirmado)
      │                                        │
      │                                        ▼
      └─────────────── respuestas ────  Next.js → RPC create_order (transacción)
```

## Arquitectura / decisiones

- **n8n self-hosted** con tunnel HTTPS (`cloudflared`) para que Meta pueda llegar.
- **1 solo workflow** que rutea por `metadata.phone_number_id` → `business_whatsapp`.
  El modelo es *número por comercio*; el piloto usa el número de **test** de Meta (1 solo).
  Solo responde números con `is_active = true` y `status = 'connected'`.
- **n8n recibe el webhook de Meta** (verificación `hub.challenge` dentro del flujo).
  Next.js NO recibe webhooks de Meta; expone **`/api/webhooks/whatsapp`** (POST),
  autenticado por header `x-whatsapp-secret`, como puerta de creación de pedidos.
- **Tokens**: el access token de Meta vive en la credencial de n8n (encriptada por n8n)
  y, cuando un comercio conecta número desde el panel, se guarda cifrado en **Supabase Vault**.
- **Sesión atómica**: el bot persiste el carrito vía RPC
  (`whatsapp_session_add_item` / `whatsapp_session_reset`), no con un
  read-modify-write desde n8n — así dos mensajes concurrentes no se pisan.
- **Idempotencia**: tras confirmar, se guarda `lastConfirmedMessageId` en la sesión;
  un retry de Meta del mismo mensaje no vuelve a crear el pedido.
- **Sin LLM en el MVP**: parsing con keywords. La IA (GPT) queda para el Tier 2.

## Requisitos de entorno (env vars en n8n)

El workflow lee estas variables de entorno de la instancia n8n:

| Variable | Descripción |
|---|---|
| `N8N_SUPABASE_URL` | URL del proyecto Supabase (`https://<ref>.supabase.co`) |
| `N8N_SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` (service_role, para leer productos/sesiones) |
| `N8N_APP_URL` | Origen público de la app Next.js (ej. `https://bolivarpide.vercel.app`) |
| `N8N_WHATSAPP_WEBHOOK_SECRET` | Mismo valor que `WHATSAPP_WEBHOOK_SECRET` del `.env` de la app |

> En n8n, las variables `N8N_*` se exponen a los workflows. Si querés usar otro
> prefijo, configurá `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` y el rango que quieras.

## Paso 1 — Meta WhatsApp Cloud API (app de test)

1. Entrá a [developers.facebook.com](https://developers.facebook.com) → **Apps** → **Create app** → tipo *Business*.
2. En **Add Products** → **WhatsApp** → *Set up*.
3. En la pestaña **WhatsApp > API Setup**:
   - Anotá el **Phone number ID** y el **WABA ID** (WhatsApp Business Account ID).
   - **Generate access token** (token de prueba, dura 24h en dev).
4. En **WhatsApp > Configuration** (Webhook):
   - **Callback URL**: `https://<tu-n8n>/webhook/whatsapp`
   - **Verify token**: un valor secreto que elijas (lo usás como `VERIFY_TOKEN`).
   - Suscribí los campos: **messages** (y status si querés logs).
5. Aceptá el webhook → Meta hace GET con `hub.challenge` → n8n responde con el challenge.

## Paso 2 — n8n self-hosted (Docker) + tunnel publico

Con `n8n/docker-compose.yml` (en este repo) o instalación estándar:

```bash
docker compose -f n8n/docker-compose.yml up -d
```

Para exponer el webhook (Meta exige HTTPS):

```bash
cloudflared tunnel --url http://localhost:5678
# → https://<random>.trycloudflare.com  (URL pública del n8n)
```

> Para producción usá `cloudflared tunnel` con tu dominio y DNS en Cloudflare,
> o un reverse proxy (Caddy/traefik) con certificado.

## Paso 3 — Importar el workflow

1. En n8n, **Workflows → ⋮ → Import from File** → `n8n/whatsapp-bot.workflow.json`.
2. Configurá:
   - **Credencial "WhatsApp Cloud API"** (nodo *Enviar por WhatsApp*): Access Token + Business Account ID de la app de test.
   - Las **env vars** del paso anterior.
   - En el trigger *Meta Webhook*: el **path** debe coincidir con la Callback URL (`/webhook/whatsapp`).
3. Activalo (**Active** en el panel).

**Nota**: si tu versión de n8n difiere (typeVersion), n8n pide *update node* al importar — aceptalo y reconfirmá los campos señalados en rojo.

## Paso 4 — Conectar un comercio en la DB

Con el cliente service (o desde el Admin una vez armada la Fase 5):

```sql
insert into public.business_whatsapp (business_id, phone_number_id, display_phone_number, waba_id, status, is_active)
values ('<business_id>', '<phone_number_id_test>', '<numero a mostrar>', '<waba_id>', 'connected', true);
```

Luego un mensaje de texto a ese número de prueba activa el bot.

## Probar el flujo

Con el número de prueba agregado como contacto, mandá desde WhatsApp:

| Mensaje | Respuesta esperada |
|---|---|
| `menú` | Carta formateada con precios |
| `horario` | Horario genérico (config wires lo hace real) |
| `2 muzza` | Agrega 2x Muzza al carrito y pide confirmación |
| `confirmar` | POST al webhook → crea la orden (`pending`) → 200 |
| `cancelar` | Vacía el carrito |

Al confirmar, el pedido aparece en `/negocio/{id}/pedidos` del comercio con sonido.

## Esquema de datos (nuevo en esta rama)

- `business_whatsapp` — mapping número ↔ comercio + estado + `vault_token_ref`.
- `whatsapp_sessions` — estado de conversación (`state: { step, cart, lastConfirmedMessageId }`) por `(business_id, chat_id)`.
- `orders` + columnas `source`, `wa_chat_id`, `delivery_address`.
- RPC `create_order` — transacción `orders`+`order_items`, `security definer`, solo `authenticated`/`service_role`. Valida que el negocio tenga WhatsApp activo cuando `source='whatsapp'`.
- RPC `whatsapp_session_add_item` / `whatsapp_session_reset` — mutaciones atómicas del carrito (sin race conditions).

## Seguridad

- El webhook interno `/api/webhooks/whatsapp` valida `x-whatsapp-secret` (header).
- El access token de Meta se guarda en **Supabase Vault** al conectar un número desde el panel; el workflow usa la credencial de n8n (cifrada en disco por n8n) en el piloto.
- El proxy de Next excluye `/api/webhooks/whatsapp` del matcher para no pagar `auth.getUser()` por webhook.

## Pendientes fuera de este MVP

- Precios/horarios dinámicos por comercio (leer `business_hours` reales).
- Darse de baja + flujo OAuth de Meta para que cada comercio conecte su propio número.
- Templates de WhatsApp para mensajes proactivos (estado del pedido) — requiere plantillas aprobadas y fuera de la ventana de 24h.
- IA (GPT-4o) para comprensión libre — Tier 2.