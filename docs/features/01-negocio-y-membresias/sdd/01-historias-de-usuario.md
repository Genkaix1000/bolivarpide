# SDD — 01: Historias de Usuario (Negocios & Membresías)

> **Módulo:** `01-negocio-y-membresias`  
> **Fase:** 1  

---

## HU-1.1: Visualización del Hub de Negocios
> **Como** usuario autenticado en la plataforma,  
> **Quiero** acceder a `/negocio` y ver todos los comercios donde tengo rol activo o invitaciones,  
> **Para** elegir con cuál deseo operar en esta sesión.

```gherkin
Escenario: Usuario con múltiples comercios asociados
  Dado que un usuario autenticado posee rol "owner" en "Pizzería Centro" y "staff" en "Heladería Sur"
  Cuando ingresa a "/negocio"
  Entonces ve ambas tarjetas de comercio con sus respectivos badges de rol
  Y al hacer clic en "Pizzería Centro" es dirigido a "/negocio/{pizzeria_id}/dashboard"
```

---

## HU-1.2: Aislamiento y Scoping por URL (`/negocio/[businessId]`)
> **Como** operador de un local,  
> **Quiero** que todas las operaciones estén delimitadas por el ID del comercio en la URL,  
> **Para** no alterar accidentalmente la configuración de otro local si tengo varias pestañas abiertas.

```gherkin
Escenario: Intento de acceso a local no autorizado
  Dado que un usuario autenticado como staff solo en el local "A"
  Cuando intenta ingresar por URL directa a "/negocio/{local_B_id}/dashboard"
  Entonces el layout del panel detecta la falta de membresía activa para "{local_B_id}"
  Y es redirigido a "/negocio" con un mensaje de alerta "No perteneces a este local"
```

---

## HU-1.3: Gestión de Horarios y Switch Abierto / Cerrado
> **Como** dueño de un local,  
> **Quiero** definir mis horarios semanales y tener un switch rápido de "Abierto / Cerrado",  
> **Para** pausar temporalmente la recepción de pedidos si la cocina está saturada.

```gherkin
Escenario: Pausar local manualmente
  Dado que el dueño se encuentra en "/negocio/{businessId}/dashboard"
  Cuando desactiva el switch "Local Abierto"
  Entonces el campo "businesses.is_open" se actualiza a "false" inmediatamente
  Y el feed público muestra el local como "Cerrado temporalmente"
```
