# TDD — 02: Base de Datos, Helpers & RLS

> **Módulo:** `01-negocio-y-membresias`  
> **Fase:** 1  

---

## 1. Esquema SQL de Tablas

```sql
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  logo_path text,
  banner_path text,
  is_open boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  rating numeric NOT NULL DEFAULT 0,
  reviews_count int NOT NULL DEFAULT 0,
  prep_time_minutes int NOT NULL DEFAULT 30,
  phone text,
  address text,
  city text NOT NULL DEFAULT 'San Carlos de Bolivar',
  province text NOT NULL DEFAULT 'Buenos Aires',
  postal_code text NOT NULL DEFAULT '6550',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'staff', 'driver')),
  status text NOT NULL CHECK (status IN ('invited', 'active', 'left', 'rejected')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
```

---

## 2. Helpers y Políticas RLS

```sql
CREATE OR REPLACE FUNCTION public.is_business_member(bid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members m
    WHERE m.business_id = bid AND m.user_id = auth.uid() AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(bid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members m
    WHERE m.business_id = bid AND m.user_id = auth.uid() AND m.status = 'active' AND m.role = 'owner'
  );
$$;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Miembros activos o admins pueden leer su propio comercio no publicado
CREATE POLICY "Members read business"
  ON public.businesses FOR SELECT
  USING (public.is_business_member(id) OR public.is_platform_admin() OR published = true);

-- Owners o admins pueden actualizar datos del negocio
CREATE POLICY "Owners update business"
  ON public.businesses FOR UPDATE
  USING (public.is_business_owner(id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_owner(id) OR public.is_platform_admin());
```
