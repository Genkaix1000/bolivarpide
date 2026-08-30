# SDD — 02: Flujos y Estados de Sesión

> **Módulo:** `00-auth-e-identidad`  
> **Fase:** 0  

---

## 1. Diagrama de Puertas de Acceso

```mermaid
flowchart TD
    A[Usuario navega a una URL] --> B{¿Tiene sesión activa?}
    B -- No --> C{¿Ruta protegida?}
    C -- /negocio/* --> D[/negocio/login]
    C -- /admin/* --> E[/admin/login]
    C -- /c/* o /perfil --> F[/login]
    C -- Pública (/, /login, /registro) --> G[Renderizar Vista]
    
    B -- Sí --> H{¿Ruta /admin/*?}
    H -- Sí --> I{¿app_metadata.role == 'admin'?}
    I -- Sí --> J[Dashboard Admin]
    I -- No --> K[Error 403 / Redirigir a /]
    
    H -- No --> L{¿Ruta /negocio/[bid]/*?}
    L -- Sí --> M{¿Es miembro activo de bid o Admin?}
    M -- Sí --> N[Panel de Negocio Scoped]
    M -- No --> O[Redirigir a Hub /negocio]
    
    L -- No --> P[Página Solicitada]
```

---

## 2. Matriz de Estados de la UI de Sesión

| Estado | Contexto de Usuario | Comportamiento Header / Nav | Comportamiento Sidebar Cliente |
|---|---|---|---|
| `unauthenticated` | Visitante anónimo | Botón "Iniciar Sesión" contextual | Enlace "Abrir / Afiliar mi Negocio" |
| `customer_only` | Logueado, sin comercios | Avatar + Nombre + Mis Pedidos | Enlace "Abrir / Afiliar mi Negocio" |
| `merchant_member` | Logueado, ≥1 comercio activo | Avatar + Selector de Local | Enlace "Ir a mi Negocio" → Hub / Local |
| `platform_admin` | Logueado + `role: admin` | Banner Admin + Selector Impersonación | Acceso directo a `/admin` |

---

## 3. Reglas de Negocio

1. **Cero Passwords:** Se elimina la fricción de registro manual y recuperación de contraseñas.
2. **Cookies Seguras:** La sesión se maneja en cookies `HttpOnly`, `SameSite=Lax` vía `@supabase/ssr`.
3. **Multi-PWA Compartida:** Las PWAs de cliente (`/`), negocio (`/negocio`) y admin (`/admin`) comparten el mismo dominio y la misma cookie de sesión, resolviendo permisos según la ruta activa.
