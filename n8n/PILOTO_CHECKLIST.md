# Piloto WhatsApp — Checklist de verificación end-to-end

Usar junto con `README.md`. Si algo falla, cada sección indica el error típico.

## 1. Migración (debe estar aplicada)

En Supabase SQL Editor:

```sql
select table_name from information_schema.tables
where table_schema='public' and table_name in ('business_whatsapp','whatsapp_sessions');
-- → las 2 tablas

select proname from pg_proc
where proname in ('create_order','whatsapp_session_add_item','whatsapp_session_reset');
-- → los 3 RPCs
```

## 2. Seed (negocio demo + conexión)

1. Corré `supabase/seed/whatsapp_pilot.sql` **reemplazando** los `REEMPLAZAR_PHONE_NUMBER_ID` y `REEMPLAZAR_WABA_ID` con los valores de tu app de Meta.
2. Verificá:

```sql
select b.name, w.phone_number_id, w.status, w.is_active
from public.businesses b
join public.business_whatsapp w on w.business_id = b.id
where b.slug = 'pizzeria-demo-bolivar';
-- → una fila, status='connected', is_active=true

select count(*) from public.products
where business_id = (select id from public.businesses where slug='pizzeria-demo-bolivar');
-- → 6
```

3. Como **administrador** (rol admin), entrá a `/admin` y confirmá que "Pizzería Demo Bolívar" aparece en la sección **WhatsApp** (botón verá "Desactivar" = ya activa).

## 3. Prueba del RPC con pedido real (sin Meta aún)

Con el número ya activo, en SQL Editor:

```sql
select public.create_order(
  (select id from public.businesses where slug='pizzeria-demo-bolivar')::uuid,
  'Cliente Test', '+5492314443322', 'whatsapp', '5492314443322',
  NULL, 'Pedido de prueba',
  '[{"name":"Pizza Muzza","quantity":2,"unit_price_cents":1200000}]'::jsonb
);
```

- Si devuelve un `uuid` → el RPC está OK y la orden quedó `pending`.
- Si da `WhatsApp no activo para este comercio` → revisar que `is_active=true` y `status='connected'` (punto 2).

> Borrá el pedido de prueba después:
> `delete from public.orders where notes='Pedido de prueba' and source='whatsapp';`
> (cascadea a `order_items`).

## 4. n8n arriba + expuesto

- `docker compose -f n8n/docker-compose.yml up -d` corriendo.
- Tunnel activo: `cloudflared tunnel --url http://localhost:5678`.
- Guardá la URL pública `https://<hash>.trycloudflare.com` — la necesitás en Meta.

## 5. Webhook en Meta (app de test)

En **WhatsApp → Configuration**:

| Campo | Valor |
|---|---|
| Callback URL | `https://<hash>.trycloudflare.com/webhook/whatsapp` |
| Verify token | el que elijas (coincidir con el del workflow si detectás uno) |

Suscribí el campo **messages**. Debe quedar **"Verified"**.

> Error típico "Temporal error": el workflow n8n debe estar **activo** y su path `/webhook/whatsapp` coincidir.

## 6. Importar workflow en n8n

1. **Workflows → Import** → `n8n/whatsapp-bot.workflow.json`.
2. Credencial **WhatsApp Cloud API**: Access Token + Business Account ID (WABA) de la app de test.
3. Env vars de la instancia n8n:

| Variable | Valor de ejemplo |
|---|---|
| `N8N_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `N8N_SUPABASE_SERVICE_KEY` | la `SUPABASE_SERVICE_ROLE_KEY` del `.env` |
| `N8N_APP_URL` | tu app Next.js (dev: `http://localhost:3000`) |
| `N8N_WHATSAPP_WEBHOOK_SECRET` | la que ya está en tu `.env` |

4. **Active** el workflow.

## 7. Pedir el número de prueba de Meta

En **WhatsApp → API Setup** usá **"Add test number"** (número de prueba del WABA). Agrégalo como contacto en tu WhatsApp real.

## 8. Test end-to-end

Desde WhatsApp (número de prueba):

| Envás | Esperás |
|---|---|
| `menú` | Carta con los 6 productos y precios |
| `horario` | "Lunes a Sábado 09:00–23:00 / Domingo cerrado" |
| `2 pizza muzza` | "Agregamos 2x Pizza Muzza … ¿Confirmás?" |
| `confirmar` | "✅ Pedido enviado al local" |
| (a la vez) | En el panel `/negocio/{id}/pedidos` aparece con sonido (beep) |

En `/admin`, la orden debe verse en "Pedidos hoy".

## Errores comunes

| Síntoma | Causa / Fix |
|---|---|
| El bot no responde | Workflow inactivo, tunnel caído, o webhook sin verificar en Meta |
| "Número desconocido" | `phone_number_id` no coincide con el de la app de test y/o `is_active` false |
| RPC rechaza pedidos | `is_active=false` o `status != 'connected'` en `business_whatsapp` |
| Token expirado en n8n | El access token de test dura 24h → regenerar en Meta y actualizar la credencial |
| Duplicados de pedido al confirmar | Ya mitigado por `lastConfirmedMessageId` (idempotencia) |
| El menú no lista | No hay `products` con `available=true` del negocio (corré el seed) |