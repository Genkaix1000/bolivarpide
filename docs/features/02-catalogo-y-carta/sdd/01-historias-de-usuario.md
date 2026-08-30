# SDD — 01: Historias de Usuario (Catálogo & Carta)

> **Módulo:** `02-catalogo-y-carta`  
> **Fase:** 2  

---

## HU-2.1: Gestión CRUD de Productos
> **Como** comerciante (dueño o cocinero),  
> **Quiero** crear y editar platos en mi carta con nombre, descripción, precio y categoría,  
> **Para** mantener mi menú siempre actualizado.

```gherkin
Escenario: Creación exitosa de un producto
  Dado que el comerciante está en "/negocio/{businessId}/carta"
  Cuando completa el formulario con:
    | Campo       | Valor                   |
    | Nombre      | Hamburguesa Especial    |
    | Categoría   | Hamburguesas            |
    | Precio      | 8500                    |
    | Descripción | Doble medallón, cheddar |
  Y presiona "Guardar Producto"
  Entonces el producto aparece inmediatamente en la lista de la categoría "Hamburguesas"
  Y el precio se almacena internamente en centavos (850000)
```

---

## HU-2.2: Toggle Rápido de Disponibilidad
> **Como** cocinero en hora pico,  
> **Quiero** pausar un producto con un solo toque si se agotaron los ingredientes,  
> **Para** que los clientes no pidan ítems que no puedo preparar.

```gherkin
Escenario: Pausar producto agotado
  Dado que el producto "Empanada de Carne" tiene disponibilidad activa
  Cuando el comerciante desactiva el switch "Disponible" en la tabla de la carta
  Entonces el campo "available" pasa a ser "false"
  Y en la vista del cliente el producto se muestra deshabilitado con el badge "Agotado"
```
