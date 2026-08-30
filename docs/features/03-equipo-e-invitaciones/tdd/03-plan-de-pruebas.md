# TDD — 03: Plan de Pruebas Unitarias & Integración

> **Módulo:** `03-equipo-e-invitaciones`  
> **Fase:** 3  

---

## 1. Pruebas Unitarias (`__tests__/unit/team/invite.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { InviteMemberSchema } from '@/lib/team/schemas';

describe('TDD Team - Member Invitation Schemas', () => {
  it('debe validar una invitación con rol staff', () => {
    const valid = {
      businessId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'colaborador@bolivarpide.com',
      role: 'staff',
    };
    expect(InviteMemberSchema.safeParse(valid).success).toBe(true);
  });

  it('debe rechazar roles inválidos', () => {
    const invalid = {
      businessId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'colaborador@bolivarpide.com',
      role: 'admin', // Inválido
    };
    expect(InviteMemberSchema.safeParse(invalid).success).toBe(false);
  });
});
```

---

## 2. Pruebas de Integración (`__tests__/integration/team/flow.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('TDD Team - Invitation Lifecycle', () => {
  it('el usuario invitado puede aceptar su propia invitación', async () => {
    const inviteeClient = createTestClient('invitee-user-id');
    const { data, error } = await inviteeClient
      .from('business_members')
      .update({ status: 'active' })
      .eq('id', 'membership-invite-id')
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('active');
  });
});
```
