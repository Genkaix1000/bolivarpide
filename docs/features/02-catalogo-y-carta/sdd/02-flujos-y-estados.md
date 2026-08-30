# SDD — 02: Flujos, Categorías y Estados de Producto

> **Módulo:** `02-catalogo-y-carta`  
> **Fase:** 2  

---

## 1. Modelo de Dominio

```mermaid
classDiagram
    class Business {
        +UUID id
        +string name
        +boolean published
    }
    class Product {
        +UUID id
        +UUID business_id
        +string name
        +string description
        +string category
        +int price_cents
        +boolean available
        +string image_path
        +int sort_order
        +datetime created_at
    }
    Business "1" --> "*" Product : contiene
```

---

## 2. Reglas de Negocio

1. **Precios en Centavos:** Todos los precios se manejan como números enteros de centavos (`price_cents >= 0`) para evitar errores de precisión de coma flotante.
2. **Aislamiento Multi-Tenant:** Los productos pertenecen estrictamente a un único `business_id`.
3. **Visibilidad Pública Condicionada:** Un producto solo puede ser visto por clientes si el comercio tiene `businesses.published = true`.
