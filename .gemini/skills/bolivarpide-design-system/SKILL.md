---
name: bolivarpide-design-system
description: Sistema de diseño oficial de BolivarPide. Define reglas de color, tipografía, componentes y patrones visuales para mantener coherencia absoluta entre el Dashboard de Negocio y la vista de Cliente.
---

# BolivarPide — Guía del Sistema de Diseño

Este documento establece las reglas indispensables de diseño para cualquier componente, pantalla o módulo en el proyecto **BolivarPide**.

---

## 1. Tokens de Color y Paleta Oficial

- **Fondo Global del Sitio (`--background`)**:
  - Modo claro: `#faf6f1` (Cream Vanilla - un blanco neutro, suave y cálido).
  - Modo oscuro: `#1c1917` (Deep Warm Charcoal).
- **Superficies y Tarjetas (`--card` / `bg-white`)**:
  - Modo claro: `bg-white` o `bg-[#faf6f1]` con bordes `border-gray-200` o `border-[#ddd4c8]`.
  - Modo oscuro: `bg-[#231f1c]` con bordes `border-[#3d3732]`.
  - **Sombra suave**: `.penpot-shadow` o `shadow-sm`.

- **Color Primario de Marca**: `#9a0002` (Cherry Cola / Rojo Diner).
- **Color Oscuro de Marca**: `#6b0001` (Deep Cherry).
- **Color Acento / Glow**: `#c62828`.

---

## 2. Política de Colores Flat vs. Gradientes

- **Prohibición de Gradientes Estridentes Multicolores**:
  - Quedan prohibidos los gradientes multicolores aleatorios (amarillos-mostaza, violetas, naranjas) en tarjetas de producto o fondos de sección.
  - Usar superficies **flat** limpias (`bg-white` / `bg-[#faf6f1]` / `bg-[#231f1c]`) con detalles y acentos en el rojo de marca `#9a0002`.
  - Los gradientes sólo se permiten de forma sutil en elementos de marca oficiales (ej: logo "B" `#9a0002` a `#6b0001` o el fondo curvo principal del header).

---

## 3. Estandarización de Botones

Todos los botones interactivos del proyecto deben seguir uno de estos patrones estandarizados:

### A. Botones de Texto Seleccionables / Tabs y Filtros (Pill Tabs)
- **Regla para Botones de Texto Seleccionables** ("Hoy", "Esta semana", "Todos", "Activos", "Pausados", etiquetas de filtro):
  - Cuando está **seleccionado/activo**: Relleno completo en color acento de marca (`bg-[#9a0002]`), texto en **blanco puro** (`text-white font-bold`) y sombra suave (`shadow-sm`).
  - Cuando está **inactivo**: Fondo neutro/blanco (`bg-white dark:bg-[#2a2623]` o transparente en contenedores pill) y texto gris (`text-gray-600 dark:text-gray-400 hover:text-gray-900`).

### B. Botones Circulares de Categoría y Cajas de Selección (Cards/Icons)
- **Regla para Botones Circulares y Cajas con Iconos**:
  - Cuando está **seleccionado/activo**: Mantiene su **fondo blanco puro** (`bg-white` en modo claro / `bg-[#231f1c]` en modo oscuro) e indica la selección mediante un borde/anillo en rojo de marca (`ring-2 ring-[#9a0002] border-[#9a0002]`) e icono/texto en rojo (`text-[#9a0002]`).

### C. Botón de Acción Principal (Primary Action Button)
- Fondo: `#9a0002` (rojo marca flat)
- Texto / Icono: Blanco `#ffffff`
- Bordes: Redondeado total (`rounded-full`) o de tarjeta (`rounded-xl`)
- Hover/Active: `hover:bg-[#850002] active:scale-95 transition-all`
- *Ejemplo*: Botones de confirmación, "Nuevo Producto", "Siguiente", botón `+` para agregar al carrito.


---

## 4. Búsquedas (Searchbars)

- **Contenedor**: Cápsula redonda (`rounded-full`), altura `h-11`, padding `px-4.5`.
- **Fondo**: `bg-white dark:bg-[#2a2623]`.
- **Borde**: `border border-gray-200 dark:border-[#3d3732] focus-within:border-[#9a0002]/40`.
- **Icono**: Lupa en rojo `#9a0002` a la izquierda.
- **Input**: `SmoothInput` o `<input className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-full bg-transparent focus:outline-none" />`.

---

## 5. Navegación Móvil / Menús Desplegables (Drawers)

El menú móvil debe coincidir 100% con la estética de `BusinessSidebar`:
- **Item Activo**:
  - `bg-[#9a0002]/10 text-[#9a0002] font-bold border-l-2 border-[#9a0002]`
  - Esquinas: `rounded-xl`
  - Altura: `h-11`, padding: `px-3.5`
- **Item Inactivo**:
  - `text-gray-500 dark:text-gray-400 hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623] hover:text-gray-800 border-l-2 border-transparent`
- **Encabezado del Drawer**:
  - Logo circular "B" (`#9a0002` a `#6b0001`), título "BolivarPide" y botón de cierre circular.

---

## 6. Desplegables y Menús Flotantes (Dropdowns / Popovers)

- **Fondo**: `bg-[#faf6f1]/96 dark:bg-[#1c1917]/96 backdrop-blur-md`
- **Borde**: `border border-white/50 dark:border-[#3d3732]`
- **Bordes redondeados**: `rounded-[20px]` o `rounded-[22px]`
- **Sombra**: `shadow-2xl`
- **Items internos**: `rounded-xl p-2.5 hover:bg-[#ede4d9]/60 dark:hover:bg-[#2a2623]`
