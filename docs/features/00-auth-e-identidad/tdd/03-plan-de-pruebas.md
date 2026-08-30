# TDD — 03: Plan de Pruebas Unitarias & Integración

> **Módulo:** `00-auth-e-identidad`  
> **Fase:** 0  

---

## 1. Pruebas Unitarias (`__tests__/unit/auth/session.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { parseUserSession } from '@/lib/auth/session';

describe('TDD Auth - parseUserSession', () => {
  it('debe identificar a un usuario como admin si app_metadata.role es admin', () => {
    const mockUser = {
      id: 'd3b07384-d113-41a4-9464-32a58b8f2c2e',
      email: 'admin@bolivarpide.com',
      app_metadata: { role: 'admin' },
      user_metadata: { full_name: 'Admin Test' },
    };

    const session = parseUserSession(mockUser as any);
    expect(session?.isPlatformAdmin).toBe(true);
    expect(session?.userId).toBe(mockUser.id);
  });

  it('NO debe otorgar permisos de admin si user_metadata.role dice admin (prevención de escalada)', () => {
    const maliciousUser = {
      id: 'e4c08495-e224-42b5-8575-43b69c9f3d3f',
      email: 'hacker@bolivarpide.com',
      app_metadata: {},
      user_metadata: { role: 'admin' }, // Intento de inyección no autorizada
    };

    const session = parseUserSession(maliciousUser as any);
    expect(session?.isPlatformAdmin).toBe(false);
  });

  it('debe devolver null cuando no hay usuario autenticado', () => {
    const session = parseUserSession(null);
    expect(session).toBeNull();
  });
});
```

---

## 2. Pruebas de Integración del Middleware (`__tests__/integration/auth/middleware.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('TDD Auth - Middleware Guards', () => {
  it('debe permitir acceso a "/" sin sesión', async () => {
    const res = await testMiddlewareRoute('/');
    expect(res.status).toBe(200);
  });

  it('debe redirigir "/negocio/abc/dashboard" a "/negocio/login" si no hay sesión', async () => {
    const res = await testMiddlewareRoute('/negocio/abc/dashboard', { authenticated: false });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/negocio/login');
  });

  it('debe bloquear "/admin" con redirect si el usuario no tiene app_metadata.role == "admin"', async () => {
    const res = await testMiddlewareRoute('/admin', {
      authenticated: true,
      appMetadata: { role: 'customer' },
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login?error=forbidden');
  });
});
```
