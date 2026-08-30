# BolivarPide (delivery)

App de delivery y panel de negocios para San Carlos de Bolívar.

## Desarrollo

```bash
npm install
npm run dev
```

Migraciones Supabase: `supabase/migrations/`. Tras pull, aplicar en tu proyecto (CLI o dashboard).

Checks locales:

```bash
node scripts/wipe-carta.mjs <businessId>
npm run build
```

## Carta / menú del negocio

- **Ruta panel:** `/negocio/[businessId]/carta`
- **Categorías:** tabla `menu_categories`, orden con drag (lista plana, sin subcategorías).
- **Productos:** fotos en bucket `business-assets` (`icon_path` + `image_path` foto real).
- **Plan Free:** 25 productos, 5 categorías (`src/lib/business/planLimits.ts`).
- **Carta pública:** `/c/[slug]` — productos `available=true`, navegación sticky por categoría.

Ver `ARQUITECTURA.md` y migración `20260829_menu_categories.sql`.

## Documentación

- `ARQUITECTURA.md` — diseño del producto y esquema de datos.
