-- Corrección de ACL en user_profiles: garantiza que el cliente NO pueda escribir
-- awarded_badges (escritura server-only vía RPC grant_customer_badges).
--
-- Contexto: el REVOKE UPDATE (awarded_badges) por columna de la migración
-- 20260909000000 NO surtió efecto real en la DB: el rol authenticated mantiene
-- UPDATE sobre la columna porque lo hereda del grant de TABLA (relacl
-- `arwdDxtm`), y PostgreSQL no crea attacl de columna negativo en ese caso.
--
-- Solución robusta: revocar UPDATE a nivel de tabla para anon/authenticated y
-- conceder UPDATE SOLO por columna para las que el cliente edita via
-- saveUserProfileAction/verifyIdentityAction (todas excepto awarded_badges).
-- El INSERT (alta de perfil) y el resto de privilegios quedan intactos.

REVOKE UPDATE ON public.user_profiles FROM anon, authenticated;

GRANT UPDATE (
  display_name,
  first_name,
  last_name,
  phone,
  avatar_type,
  avatar_value,
  avatar_gradient_id,
  primary_address,
  identity_verified,
  identity_verified_at,
  notification_orders,
  notification_promos,
  notification_whatsapp,
  preferred_payment_method,
  updated_at
) ON public.user_profiles TO authenticated;

-- anon no edita perfiles (solo lectura vía RLS, si aplica).
REVOKE UPDATE ON public.user_profiles FROM anon;