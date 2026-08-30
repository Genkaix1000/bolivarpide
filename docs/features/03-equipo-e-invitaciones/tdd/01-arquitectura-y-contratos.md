# TDD — 01: Arquitectura Técnica & Esquemas Zod

> **Módulo:** `03-equipo-e-invitaciones`  
> **Fase:** 3  

---

## 1. Esquemas Zod (`src/lib/team/schemas.ts`)

```typescript
import { z } from 'zod';

export const InviteMemberSchema = z.object({
  businessId: z.string().uuid(),
  email: z.string().email('Email de colaborador inválido'),
  role: z.enum(['owner', 'staff', 'driver']),
});

export const RespondInviteActionSchema = z.object({
  membershipId: z.string().uuid(),
  action: z.enum(['accept', 'reject']),
});

export const LeaveTeamSchema = z.object({
  businessId: z.string().uuid(),
});
```
