# BolivarPide

App de delivery y panel de negocios para San Carlos de Bolívar.
Next.js 16 (App Router) + Supabase + MercadoPago QR.

## Stack

- **Frontend:** Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript
- **Backend/datos:** Supabase (PostgreSQL, Auth, Storage, Realtime) · Route Handlers
- **Pagos:** MercadoPago QR dinámico (OAuth por comercio)
- **WhatsApp:** n8n self-hosted (bot) + Meta OAuth con tokens en Supabase Vault

Ver `ARQUITECTURA.md` (estado real) y `docs/debt.md` (deuda técnica y plan de remediación).

## Desarrollo

```bash
pnpm install
pnpm dev
```

Verificación local:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test          # corre los *.check.ts (patrón ponytail) vía tsx
```

## Migraciones Supabase

Se aplican con la CLI (nunca desde el SQL editor):

```bash
supabase login                       # una vez
supabase link --project-ref <ref>    # una vez
supabase db push
```

Las migraciones viven en `supabase/migrations/`. El historial de la DB debe
coincidir 1:1 con los archivos (reconciliação en `docs/debt.md`).

## Documentación

- `ARQUITECTURA.md` — estado real de la arquitectura y el esquema
- `ARQUITECTURA.legacy.md` — diseño original (caras usuario/negocio/delivery, roadmap; **no** refleja la implementación)
- `docs/specs/` — specs compartidas (pagos MP QR, config de locales)
- `docs/features/` — TDD/SDD de features
- `docs/debt.md` — auditoría de deuda técnica consolidada