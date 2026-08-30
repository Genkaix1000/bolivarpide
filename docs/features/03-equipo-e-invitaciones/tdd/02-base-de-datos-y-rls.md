# TDD — 02: Base de Datos & Políticas RLS de Invitaciones

> **Módulo:** `03-equipo-e-invitaciones`  
> **Fase:** 3  

---

## 1. Políticas RLS para Membresías

```sql
-- Usuario puede ver y responder a sus propias invitaciones
CREATE POLICY "Users can respond to own invite"
  ON public.business_members FOR UPDATE
  USING (user_id = auth.uid() AND status = 'invited')
  WITH CHECK (user_id = auth.uid() AND status IN ('active', 'rejected'));

-- Usuario activo puede salir voluntariamente
CREATE POLICY "Users can leave business"
  ON public.business_members FOR UPDATE
  USING (user_id = auth.uid() AND status = 'active')
  WITH CHECK (user_id = auth.uid() AND status = 'left');

-- Owners pueden invitar y revocar accesos
CREATE POLICY "Owners manage team members"
  ON public.business_members FOR ALL
  USING (public.is_business_owner(business_id) OR public.is_platform_admin())
  WITH CHECK (public.is_business_owner(business_id) OR public.is_platform_admin());
```
