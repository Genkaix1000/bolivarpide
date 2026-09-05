-- Web Push: suscripciones del cliente y disparador notificacion -> Edge Function
-- Flujo: INSERT en notifications -> trigger -> net.http_post (pg_net) -> /functions/v1/send-push

create extension if not exists pg_net;

begin;

-- Suscripciones Web Push por usuario/dispositivo
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Cada usuario solo ve/crea/borra sus propias suscripciones
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.push_subscriptions to service_role;

-- Config del disparador (URL de la funcion y secret compartido).
-- Sin policies: solo service_role (bypasses RLS) y el trigger (security definer) pueden leer.
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;
grant select, insert, update, delete on public.app_settings to service_role;

-- Trigger: notificacion insertada -> webhook a la Edge Function
create or replace function public.notify_push_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn_url text;
  webhook_secret text;
  anon_key text;
begin
  select value into fn_url from public.app_settings where key = 'push_function_url';
  if fn_url is null or fn_url = '' then
    return new;
  end if;

  select value into webhook_secret from public.app_settings where key = 'push_webhook_secret';
  select value into anon_key from public.app_settings where key = 'supabase_anon_key';

  perform net.http_post(
    fn_url,
    jsonb_build_object(
      'user_id', new.user_id::text,
      'category', new.category,
      'title', new.title,
      'body', coalesce(new.body, ''),
      'action_url', coalesce(new.action_url, ''),
      'payload', coalesce(new.payload, '{}'::jsonb)
    ),
    '{}'::jsonb,
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(anon_key, ''),
      'x-push-secret', coalesce(webhook_secret, '')
    ),
    5000
  );
  return new;
exception
  when others then
    null;
end;
$$;

drop trigger if exists trg_notification_push on public.notifications;
create trigger trg_notification_push
  after insert on public.notifications
  for each row execute function public.notify_push_after_insert();

commit;