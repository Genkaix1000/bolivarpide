# SDD — 01: Historias de Usuario (Auth & Sesión)

> **Módulo:** `00-auth-e-identidad`  
> **Fase:** 0  

---

## HU-0.1: Login Social Contextual
> **Como** usuario (cliente, comerciante o admin),  
> **Quiero** autenticarme con un solo clic usando mi cuenta de Google (u otro OAuth),  
> **Para** acceder rápidamente sin tener que recordar contraseñas.

```gherkin
Escenario: Login exitoso desde la PWA de Negocios
  Dado que un comerciante no autenticado ingresa a "/negocio/dashboard"
  Cuando el middleware detecta la ausencia de sesión
  Entonces es redirigido a "/negocio/login?returnUrl=/negocio/dashboard"
  Y al completar el flujo OAuth con Google exitosamente
  Entonces es redirigido a "/negocio/dashboard"
```

```gherkin
Escenario: Login exitoso desde la PWA Cliente
  Dado que un cliente hace clic en "Iniciar Sesión" en la barra de navegación
  Cuando completa la autenticación con Google
  Entonces la sesión se persiste en cookies HTTP-only
  Y permanece en la página actual con su avatar y nombre visibles
```

---

## HU-0.2: Redirección Inteligente según Membresías
> **Como** comerciante que inicia sesión en `/negocio/login`,  
> **Quiero** que el sistema evalúe mis membresías automáticamente,  
> **Para** ir directo al panel de mi local si solo tengo uno, o al hub selector si tengo varios.

```gherkin
Escenario: Comerciante con un solo local activo
  Dado que un usuario inicia sesión en "/negocio/login"
  Y posee exactamente 1 membresía activa con "businessId = 'abc-123'"
  Entonces es redirigido automáticamente a "/negocio/abc-123/dashboard"

Escenario: Usuario sin ningún local afiliado
  Dado que un usuario sin membresías activas ingresa a "/negocio"
  Entonces ve la pantalla de "Hub Vacío"
  Con accesos a: "Registrar mi negocio", "Revisar invitaciones pendientes" o "Volver al marketplace"
```

---

## HU-0.3: Protección de Rutas Administrativas
> **Como** administrador de la plataforma,  
> **Quiero** que el acceso a `/admin` esté bloqueado para cualquier usuario común,  
> **Para** proteger los datos de métricas y operaciones globales.

```gherkin
Escenario: Usuario no admin intenta ingresar a /admin
  Dado que un usuario autenticado con "app_metadata.role != 'admin'" navega a "/admin"
  Cuando el middleware evalúa sus claims
  Entonces es redirigido a "/admin/login?error=unauthorized" con mensaje de acceso denegado
```
