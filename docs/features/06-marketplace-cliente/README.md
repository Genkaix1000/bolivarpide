# 🛍️ Fase 6: Marketplace Cliente & Feed de Locales

> **Módulo:** `06-marketplace-cliente`  
> **Fase Roadmap:** Fase 6  
> **Estado:** 🟢 Aprobado para base  

---

## 📌 Resumen de la Fase

Superficie pública del marketplace (`/`). Muestra los comercios locales publicados (`published = true`), filtra comercios abiertos/cerrados según su horario comercial, y renderiza la carta pública en `/c/[slug]`.

---

## 📂 Documentos del Módulo

### 📋 Especificación Funcional (SDD)
- [01-historias-de-usuario.md](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/sdd/01-historias-de-usuario.md) — Feed público y navegación de la carta digital.
- [02-flujos-y-estados.md](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/sdd/02-flujos-y-estados.md) — Filtros de visibilidad y reglas de horarios.

### 🛠️ Especificación Técnica & Tests (TDD)
- [01-arquitectura-y-contratos.md](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/tdd/01-arquitectura-y-contratos.md) — Helper puro `isBusinessCurrentlyOpen` y data fetching.
- [02-base-de-datos-y-queries.md](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/tdd/02-base-de-datos-y-queries.md) — Query de comercios publicados con JOIN a `business_hours`.
- [03-plan-de-pruebas.md](file:///home/cipher/Projects/delivery/docs/features/06-marketplace-cliente/tdd/03-plan-de-pruebas.md) — Tests unitarios de cálculo de horarios de atención.

---

## ✅ Checklist de Cierre

- [ ] Feed en `/` consumiendo datos de DB (`published = true`).
- [ ] Función `isBusinessCurrentlyOpen` testeada con horarios partidos.
- [ ] Vista SSR `/c/[slug]` renderizando carta de productos.
