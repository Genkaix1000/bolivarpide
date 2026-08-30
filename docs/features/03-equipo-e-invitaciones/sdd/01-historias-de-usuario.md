# SDD — 01: Historias de Usuario (Equipo & Staff)

> **Módulo:** `03-equipo-e-invitaciones`  
> **Fase:** 3  

---

## HU-3.1: Enviar Invitación a un Colaborador
> **Como** dueño de un local,  
> **Quiero** invitar a un empleado indicando su email y rol (`staff` o `driver`),  
> **Para** que opere el panel sin darle permisos de dueño.

```gherkin
Escenario: Invitación exitosa a staff
  Dado que el dueño se encuentra en "/negocio/{businessId}/equipo"
  Cuando ingresa el email "cocinero@gmail.com" con rol "staff"
  Y presiona "Enviar Invitación"
  Entonces se genera un registro en "business_members" con status "invited"
  Y se muestra en la lista de invitaciones pendientes del local
```

---

## HU-3.2: Aceptar / Rechazar Invitación en el Hub
> **Como** colaborador invitado,  
> **Quiero** ver la invitación pendiente en mi Hub (`/negocio`),  
> **Para** aceptar unirme al equipo o declinar la propuesta.

```gherkin
Escenario: Aceptar invitación en el Hub
  Dado que el usuario tiene una invitación pendiente para el local "Pizzería Centro"
  Cuando presiona "Aceptar" en la tarjeta de invitación en "/negocio"
  Entonces su estado pasa a "active"
  Y el local se incorpora a su lista de comercios accesibles
```
