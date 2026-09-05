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
- [01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) — Historias de usuario y criterios de aceptación Gherkin.
- [02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) — Diagrama de puertas de acceso, matriz de permisos y estados de sesión.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) — Contratos Zod, cookies `@supabase/ssr`, middleware guards y callback PKCE.
- [02-base-de-datos-y-rls.md](./tdd/02-base-de-datos-y-rls.md) — Funciones SQL security definer y claims de `app_metadata`.
- [03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) — Suites de pruebas unitarias e integración en Vitest.

---

## ✅ Checklist de Cierre

- [x] Paquete `@supabase/ssr` configurado en `src/lib/supabase/` (`client.ts`, `server.ts`, `service.ts`, `proxy.ts`).
- [x] Middleware protegiendo rutas `/negocio/*` y `/admin/*` (en Next.js 16 vive en `src/proxy.ts`, no en `middleware.ts`; guards en `src/lib/supabase/proxy.ts:35-52` para `/admin` y `:59-62` para `/negocio`).
- [x] Handler `/auth/callback` con intercambio PKCE (`src/app/auth/callback/route.ts:20-26`, `exchangeCodeForSession`).
- [x] 100% de tests unitarios de sesión pasando (`src/lib/auth/*.check.ts`: `errors`, `guards`, `password`, `rememberedAccount`; `npm test` → 42/42 checks).
