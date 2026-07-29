# 📄 Especificación Funcional: Dashboard de Negocios

---

## 1. Visión General y Arquitectura

El Dashboard de Negocios es la herramienta de gestión central para los comercios adheridos a la plataforma de pedidos. La arquitectura se basa en un **panel único e integrado** que habilita características y comportamientos dinámicos según el o los rubros seleccionados por el comercio.

---

## 2. Definición de Rubros (Fase 1) y Modelo Híbrido

Para la primera fase, la plataforma dará soporte especializado a tres rubros principales: **Cafetería**, **Restaurante** y **Kiosco**.

### 2.1. Modelo de Categoría Principal y Etiquetas Múltiples
* **Categoría Principal (Dashboard):** Se define al momento del registro e inicializa los parámetros operativos sugeridos (ej. tiempo medio de preparación estimado, estructura de menú por defecto).
* **Etiquetas Secundarias (Descubrimiento):** El comercio puede marcar múltiples etiquetas (ej. `Cafetería` + `Restaurante`). Esto permite que el local aparezca en las búsquedas de los clientes según el momento de consumo.
* **Disponibilidad por Franja Horaria (Menú Dinámico):** Cada subcategoría de productos o menú puede asociarse a un horario específico (ej. Menú Desayuno de 08:00 a 12:00 hs; Platos Ejecutivos de 12:00 a 16:00 hs).

### 2.2. Adaptación por Rubro

#### A. Cafetería
* **Modificadores frecuentes:** Tipo de leche (entera, descremada, almendra, avena), temperatura (frío/caliente), endulzantes y agregados/extra shots.
* **Venta cruzada (Cross-selling):** Sugerencia automática de pastelería/panificados al seleccionar una bebida.
* **Tiempos operativos:** Tiempos de respuesta y preparación rápidos (objetivo: 5 - 15 min).

#### B. Restaurante
* **Modificadores frecuentes:** Punto de cocción de carnes, selección de guarnición, ingredientes a excluir.
* **Estructura de Menú:** Entradas, Platos Principales, Postres, Bebidas y Menús Ejecutivos.
* **Tiempos operativos:** Tiempos de preparación elaborados (objetivo: 20 - 45 min).

#### C. Kiosco
* **Carga de productos envasados:** Énfasis en productos industrializados (snacks, golosinas, bebidas, cigarrillos).
* **Gestión de Stock Simplificada:** Control rápido por unidades o packs.
* **Tiempos operativos:** Alistado exprés / picking inmediato (objetivo: 1 - 5 min).

---

## 3. Estructura y Grilla del Dashboard

La interfaz del Dashboard se organiza en dos bloques principales: **Sección Central/Principal** y **Columna Lateral Derecha (Estadísticas y Entregas)**.

```
+-------------------------------------------------------------------+---------------------------+
|                                                                   |  ESTADÍSTICAS DEL LOCAL   |
|   BANNER DE TUTORIAL / ONBOARDING (% de progreso)                 |  - Icono / Logo           |
|                                                                   |  - Puntuación / Rating    |
|-------------------------------------------------------------------|  - Gráfico Ventas Semanal |
|  KPI 1        |  KPI 2        |  KPI 3        |  KPI 4            |                           |
|  Total Mes    |  Pedidos Compl|  Ticket Prom. |  T. Resp / Prep   |---------------------------|
|               |               |               |                   |  DELIVERIES ASOCIADOS     |
|-------------------------------------------------------------------|  - Lista de repartidores  |
|                                                                   |  - Estado y asignación    |
|   SECCIÓN PRINCIPAL (Pedidos activos, accesos rápidos, etc.)      |                           |
+-------------------------------------------------------------------+---------------------------+
```

---

## 4. Detalle de Componentes del Dashboard

### 4.1. Banner de Tutorial / Onboarding (Estado de Progreso)
* **Ubicación:** Parte superior del área principal.
* **Indicador:** Barra de progreso visual con porcentaje de completitud (0% a 100%).
* **Checklist de Hitos:**
  1. **Perfil del Local:** Logo y banner de portada subidos en buena calidad.
  2. **Catálogo Cargar:** Al menos 5 productos/platos publicados.
  3. **Menú QR:** Carta / Menú QR generado para uso en mostrador o mesa.
  4. **Promociones:** Al menos 1 oferta o descuento de bienvenida activo.
  5. **Logística:** Al menos 1 repartidor/delivery asociado (o modalidad Take Away activada).
* **Comportamiento al completar (100%):**
  * El banner de onboarding se transforma automáticamente en un **Banner de Impulso de Ventas y Promociones**.
  * Incluye un botón de acción rápida destacado: **"Ir a Pedidos Activos"**.

---

### 4.2. Grilla de Tarjetas KPI (Debajo del Banner de Tutorial)
Cuatro tarjetas métricas que cubren horizontalmente el ancho del banner:

1. **Total Generado en el Mes ($):**
   * Monto total facturado en el mes en curso.
   * Indicador porcentual de incremento o disminución respecto al mes anterior.
2. **Total de Pedidos Completados (#):**
   * Cantidad neta de órdenes entregadas con éxito en el período.
3. **Ticket Promedio ($):**
   * Valor medio consumido por pedido (`Monto Total / Cantidad de Pedidos`).
4. **Métricas de Tiempo Operativo (Minutos):**
   * **Tiempo de Respuesta:** Tiempo promedio desde que entra la notificación hasta que el local presiona *"Aceptar Pedido"*.
   * **Tiempo de Preparación:** Tiempo promedio desde que se acepta el pedido hasta que se marca como *"Listo para Entrega / Completado"*.

---

### 4.3. Columna Derecha (Estadísticas Rápidas & Deliveries)

#### A. Tarjeta Superior: Rendimiento del Local
* **Identidad:** Avatar/Logo del negocio, nombre y nota de puntuación promedio (estrellas y nota numérica acumulada).
* **Gráfico Semanal:** Gráfico de barras simple que muestra las ventas de los últimos 7 días (Lunes a Domingo) para identificar días pico.

#### B. Tarjeta Inferior: Deliveries Asociados
* **Listado de repartidores vinculados al negocio:**
  * Foto / Avatar del repartidor.
  * Nombre y estado actual (`Disponible`, `En viaje`, `Fuera de servicio`).
  * Cantidad de entregas realizadas en el día.
* **Acciones:**
  * Botón para asociar o invitar a un nuevo repartidor (vía código o enlace).
  * Asignación rápida de pedidos pendientes al repartidor disponible.

---

## 5. Flujo Operativo del Pedido y Métricas asociadas

```
[ Cliente Realiza Compra ]
          │
          ▼
┌─────────────────────────┐
│  1. Pedido ENTRANTE     │ ◄─── Comienza a medirse el TIEMPO DE RESPUESTA
└─────────┬───────────────┘
          │ (El negocio presiona "Aceptar")
          ▼
┌─────────────────────────┐
│  2. Pedido ACEPTADO     │ ◄─── Se detiene Tiempo de Respuesta
└─────────┬───────────────┘ ◄─── Comienza a medirse el TIEMPO DE PREPARACIÓN
          │
          ▼
┌─────────────────────────┐
│ 3. EN PREPARACIÓN       │ (Elaboración en cocina / Armado de paquete)
└─────────┬───────────────┘
          │ (El negocio presiona "Listo / Completado")
          ▼
┌─────────────────────────┐
│ 4. LISTO PARA ENTREGA   │ ◄─── Se detiene Tiempo de Preparación
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 5. EN CAMINO / ENTREGADO│ (Asignado a Delivery Asociado o retirado)
└─────────┬───────────────┘
```
