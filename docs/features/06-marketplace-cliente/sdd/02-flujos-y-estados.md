# SDD — 02: Flujos & Reglas del Marketplace

> **Módulo:** `06-marketplace-cliente`  
> **Fase:** 6  

---

## 1. Reglas de Negocio

1. **Filtro Estricto de Publicación:** Solo comercios con `published = true` aparecen en el catálogo público.
2. **Cálculo de Horario:** La etiqueta "Abierto" combina el switch manual `businesses.is_open` y los horarios configurados en `business_hours` para la zona horaria `America/Argentina/Buenos_Aires`.
3. **Manejo de Stock:** Productos pausados se muestran con badge "Agotado", impidiendo su selección.
