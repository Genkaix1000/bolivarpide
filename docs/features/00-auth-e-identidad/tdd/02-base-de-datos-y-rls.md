# TDD — 02: Base de Datos, Roles & RLS

> **Módulo:** `00-auth-e-identidad`  
> **Fase:** 0  

---

## 1. Helper SQL de Verificación de Roles

```sql
-- Helper de seguridad evaluado en JWT app_metadata
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
```

---

## 2. Principios de Seguridad RLS para Identidad

1. **Nunca autorizar con `user_metadata`:** Los campos dentro de `user_metadata` son editables por el propio usuario desde el cliente. Los roles críticos de plataforma residen en `app_metadata` (gestionados exclusivamente con service role).
2. **Consultas de Sesión RLS:** Para tablas multi-tenant, la verificación de pertenencia se realiza contra la tabla `business_members` vinculada a `auth.uid()`.
