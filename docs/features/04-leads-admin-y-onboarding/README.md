# 🛡️ Fase 4: Onboarding Wizard, Alta Directa Free & Verificación KYC

> **Módulo:** `04-leads-admin-y-onboarding`  
> **Fase Roadmap:** Fase 4  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Implementa el **Wizard de Onboarding en 3 Pasos** (inspirado en la estética de SaaS moderna con stepper visual adaptable a desktop/mobile), con **CERO fricción operativa**:
1. **Paso 1 (Cuenta 1-Click):** Autenticación OAuth con Google/Apple (omite si ya está logueado).
2. **Paso 2 (Datos del Local):** Nombre, rubro con pills de alta relevancia local (*Pizzería, Hamburguesería, Empanadas, Helados, Otros* con buscador predictivo y fallback a `variados` registrando la sugerencia), WhatsApp de pedidos y dirección en Bolívar.
3. **Paso 3 (Selección de Plan):** Selector visual con los 3 planes de monetización (*Inicial $0, Impulso $45k, Líder $95k*).
4. **Cero Fricción Bancaria:** No se solicitan CBUs ni datos bancarios manuales; los cobros y liquidaciones se vincularán fluidamente mediante **OAuth de Mercado Pago**.
5. **Verificación Nivel 2 Diferida:** El local se crea al instante en Plan Free; el DNI/CUIT se solicita como paso posterior para desbloquear la publicación en el marketplace.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](./sdd/01-historias-de-usuario.md) — Historias de usuario del Wizard (Paso 1, 2, 3), fallback de rubros y verificación Nivel 2.
- [02-flujos-y-estados.md](./sdd/02-flujos-y-estados.md) — Layout del Stepper (Desktop Sidebar vs Mobile Top Bar), taxonomía de categorías, integración Mercado Pago OAuth y marco legal.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](./tdd/01-arquitectura-y-contratos.md) — Esquemas Zod, resolución de categorías custom y Server Action `createBusinessOnboarding`.
- [02-base-de-datos-y-auditoria.md](./tdd/02-base-de-datos-y-auditoria.md) — Esquema SQL (`custom_category_input`, campos KYC y MP OAuth), Storage privado y `admin_audit_log`.
- [03-plan-de-pruebas.md](./tdd/03-plan-de-pruebas.md) — Suites de test en Vitest para resolución de rubros, validaciones Zod y alta en base de datos.

---

## ✅ Checklist de Cierre

> **Nota (2026-09) — rutas reales:** el wizard shippeó en **`/negocio/registro`** (`src/app/negocio/registro/page.tsx`), no en `/negocio/nuevo` ni `/negocio/alta`.
> `/negocio/onboarding` es un flujo **distinto**: el canje de claim token para leads aprobados por admin (`src/app/negocio/onboarding/page.tsx` → `claimBusinessOwnership`).

- [x] Wizard responsive (`/negocio/registro`) con layout Stepper (`src/components/business/BusinessOnboardingWizard.tsx:87-115`).
- [x] Pills de categorías principales + buscador predictivo con captura de `custom_category_input` (mismo wizard).
- [x] Tarjetas interactivas de los 3 planes con preselección del Plan Inicial ($0/mes) — **nota:** en `src/lib/business/plans.ts` solo `free` tiene `available: true`; Impulso y Líder quedan diferidos post-beta.
- [x] Creación inmediata del local en base de datos y redirección al panel de control (`src/lib/business/onboardingActions.ts:35-115`, `createBusinessFromOnboarding`).
- [x] Tests de resolución de taxonomía y contratos Zod pasando al 100% (`src/lib/business/categories.check.ts`).
