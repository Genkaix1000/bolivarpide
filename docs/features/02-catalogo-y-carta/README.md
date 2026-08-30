# 🍕 Fase 2: Catálogo & Carta Digital

> **Módulo:** `02-catalogo-y-carta`  
> **Fase Roadmap:** Fase 2  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Gestiona el catálogo de productos y categorías de los comercios gastronómicos (`/negocio/[businessId]/carta`), con soporte para precios exactos en centavos, toggles rápidos de disponibilidad ("Hay stock / Agotado") y subida de imágenes a Supabase Storage.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/sdd/01-historias-de-usuario.md) — Historias de usuario, CRUD de productos y estados de disponibilidad.
- [02-flujos-y-estados.md](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/sdd/02-flujos-y-estados.md) — Modelo de dominio y reglas de negocio.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/tdd/01-arquitectura-y-contratos.md) — Esquemas Zod y helpers de conversión de moneda (`toCents` / `fromCents`).
- [02-base-de-datos-y-storage.md](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/tdd/02-base-de-datos-y-storage.md) — Tabla `products`, bucket `product-images` y políticas RLS.
- [03-plan-de-pruebas.md](file:///home/cipher/Projects/delivery/docs/features/02-catalogo-y-carta/tdd/03-plan-de-pruebas.md) — Tests unitarios de centavos y pruebas de integración CRUD.

---

## ✅ Checklist de Cierre

- [ ] Tabla `products` con constraint `price_cents >= 0`.
- [ ] Bucket de Storage `product-images` configurado con RLS.
- [ ] Server Actions de creación, edición y toggle de disponibilidad.
- [ ] Tests de conversión de dinero y RLS aprobados.
