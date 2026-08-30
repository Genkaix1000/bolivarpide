# TDD — 01: Arquitectura Técnica & Contratos

> **Módulo:** `00-auth-e-identidad`  
> **Fase:** 0  

---

## 1. Estructura de Archivos del Módulo

```text
src/
├── proxy.ts                           # Middleware de Next.js (Token Refresh & Route Guards)
├── app/auth/callback/route.ts         # Route Handler para intercambio PKCE de OAuth
└── lib/
    ├── auth/
    │   ├── schemas.ts                 # Validadores Zod de sesión y claims
    │   ├── session.ts                 # Funciones puras para procesar usuario y roles
    │   └── guards.ts                  # Aserciones para Server Actions
    └── supabase/
        ├── client.ts                  # Supabase Browser Client (@supabase/ssr)
        ├── server.ts                  # Supabase Server Component/Action Client (@supabase/ssr)
        ├── admin.ts                   # Supabase Service Role Client (Admin-only)
        └── middleware.ts              # Helper de cookies para NextRequest/Response
```

---

## 2. Esquemas Zod de Validación (`src/lib/auth/schemas.ts`)

```typescript
import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'customer']);
export const BusinessRoleSchema = z.enum(['owner', 'staff', 'driver']);
export const MembershipStatusSchema = z.enum(['invited', 'active', 'left', 'rejected']);

export const AppMetadataSchema = z.object({
  provider: z.string().optional(),
  providers: z.array(z.string()).optional(),
  role: z.string().optional(), // 'admin' si está autorizado en whitelist
});

export const UserSessionSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isPlatformAdmin: z.boolean(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;
```

---

## 3. Handler de Callback OAuth PKCE (`src/app/auth/callback/route.ts`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
}
```
