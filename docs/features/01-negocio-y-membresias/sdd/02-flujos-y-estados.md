# SDD — 02: Flujos, Roles y Scoping

> **Módulo:** `01-negocio-y-membresias`  
> **Fase:** 1  

---

## 1. Roles y Permisos de Negocio

| Rol | Ámbito | Permisos Operativos |
|---|---|---|
| **Owner (Dueño)** | Local específico | Control total: perfil, horarios, carta, equipo (invitar/remover staff), métricas y facturación. |
| **Staff (Cocina / Caja)** | Local específico | Operar comandera (pedidos), actualizar disponibilidad de productos en la carta. |
| **Driver (Repartidor)** | Local específico | Visualizar pedidos listos asignados a entrega interna. |

---

## 2. Estructura de Rutas Scoped (`/negocio/[businessId]`)

```text
/negocio                         → Hub de membresías (lista locales e invitaciones)
/negocio/[businessId]/
├── layout.tsx                   → Guard de membresía + Sidebar
├── dashboard/                   → KPIs rápidos y switch abierto/cerrado
├── carta/                       → Gestión de productos y categorías
├── pedidos/                     → Comandera en tiempo real
├── horarios/                    → Configuración semanal
├── equipo/                      → Gestión de miembros (solo owner)
└── configuracion/               → Perfil del local, logo y datos
```

---

## 3. Reglas de Negocio

1. **Unicidad:** Un usuario no puede tener registros duplicados para el mismo local (`UNIQUE (business_id, user_id)`).
2. **Propiedad Garantizada:** Todo local activo debe contar con al menos un miembro con rol `owner`.
3. **Visibilidad Pública:** Un local puede ser configurado por su dueño aún con `published = false`, pero no se listará en el feed de clientes hasta su publicación por admin.
