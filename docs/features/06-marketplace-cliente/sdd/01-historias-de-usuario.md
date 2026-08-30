# SDD — 01: Historias de Usuario (Marketplace Cliente)

> **Módulo:** `06-marketplace-cliente`  
> **Fase:** 6  

---

## HU-6.1: Exploración del Feed de Comercios
> **Como** cliente que quiere pedir comida en Bolívar,  
> **Quiero** ver la lista de locales abiertos en mi ciudad,  
> **Para** elegir dónde comprar de manera rápida.

```gherkin
Escenario: Feed de comercios publicados
  Dado que existen 3 locales con "published = true" y 1 con "published = false"
  Cuando el usuario ingresa a "/"
  Entonces solo visualiza las tarjetas de los 3 locales publicados
  Y cada tarjeta indica: nombre, foto de portada, tiempo de entrega estimado y si está "Abierto"
```

---

## HU-6.2: Navegación de la Carta del Comercio
> **Como** cliente,  
> **Quiero** hacer clic en un comercio y ver su carta completa categorizada,  
> **Para** armar mi pedido con los platos disponibles.

```gherkin
Escenario: Ingreso a la carta del local
  Dado que el usuario hace clic en el local "Pizzería Centro"
  Cuando navega a "/c/pizzeria-centro"
  Entonces ve el banner del local, teléfono, dirección y las categorías de productos
  Y los productos pausados ("available = false") se muestran deshabilitados
```
