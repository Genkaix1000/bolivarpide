# 🔐 Fase 0: Auth, Identidad & Sesión Unificada

> **Módulo:** `00-auth-e-identidad`  
> **Fase Roadmap:** Fase 0  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Implementa el **modelo de identidad única** de BolivarPide. Un usuario se autentica exclusivamente mediante proveedores OAuth (Google, Apple, Facebook) y comparte una misma cuenta para interactuar como cliente final, operador de comercio o administrador de la plataforma.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/sdd/01-historias-de-usuario.md) — Historias de usuario y criterios de aceptación Gherkin.
- [02-flujos-y-estados.md](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/sdd/02-flujos-y-estados.md) — Diagrama de puertas de acceso, matriz de permisos y estados de sesión.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/tdd/01-arquitectura-y-contratos.md) — Contratos Zod, cookies `@supabase/ssr`, middleware guards y callback PKCE.
- [02-base-de-datos-y-rls.md](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/tdd/02-base-de-datos-y-rls.md) — Funciones SQL security definer y claims de `app_metadata`.
- [03-plan-de-pruebas.md](file:///home/cipher/Projects/delivery/docs/features/00-auth-e-identidad/tdd/03-plan-de-pruebas.md) — Suites de pruebas unitarias e integración en Vitest.

---

## ✅ Checklist de Cierre

- [ ] Paquete `@supabase/ssr` configurado en `src/lib/supabase/`.
- [ ] Middleware protegiendo rutas `/negocio/*` y `/admin/*`.
- [ ] Handler `/auth/callback` con intercambio PKCE.
- [ ] 100% de tests unitarios de sesión pasando.
