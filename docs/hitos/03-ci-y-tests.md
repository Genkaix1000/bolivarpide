# Hito 03 — CI + hygiene de tests

## Objetivo

Que cada push/PR corra automáticamente **tests + typecheck + lint** y que los checks
sean reproducibles fuera de la máquina local.

## Problema

- No existe `.github/workflows/` (verificado: `Test-Path` = false).
- Los `35 *.check.ts` (patrón ponytail, `scripts/run-checks.mjs`) corren **solo en local**;
  un cambio que los rompe se detecta al correr `pnpm test`, que nadie garantiza en el repo.
- `tsc --noEmit` repo-wide ya se rompió una vez por un refactor a medio cerrar (chatQueries) —
  el CI lo atraparía de inmediato.

## Estado actual de los checks (relevante para el CI)

- **Ningún check requiere `.env`** (`node` no lo autoload; los helpers son puros). `publicStore.check.ts`
  se seteá su propio `NEXT_PUBLIC_SUPABASE_URL` dentro del test.
- El único check con dependencia externa era **`storeLocation.check.ts`**, que geocodificaba vía
  **Nominatim por red** → **hermético** ahora con un stub de `globalThis.fetch` dentro del check
  (run-checks.spawna un proceso por check → sin filtraciones).
- Los restantes son puros o con mocks (`mp-fetch`, `reconcile`, `refund`, `whatsapp *`).

## Resultado de la verificación local (simulando CI)

- `pnpm test` con env crítico limpio → **35/35**.
- `pnpm typecheck` → exit 0. `pnpm lint` → 0 errores.

## Alcance

**In v1**
- Workflow **GitHub Actions** `ci.yml` con 3 jobs en paralelo:
  1. `test` → `pnpm install --frozen-lockfile` + `pnpm test`
  2. `typecheck` → `pnpm exec tsc --noEmit`
  3. `lint` → `pnpm eslint`
- Uso de `pnpm/action-setup@v4` (verificar versión vigente) + `actions/setup-node` con
  `cache: pnpm`.
- Task 0: suite **hermética** — volver `storeLocation.check.ts` determinístico (stub de `fetch`)
  para que el CI no dependa de red ni secretos.
- Script `pnpm typecheck` en `package.json` (conveniencia local + CI).

**Out (v2 posibles)**
- Framework de tests robusto (Vitest) y cobertura por dominio crítico (delivery, pagos).
- Branch protection / requerir checks en PRs.
- Cache de `tsc --noEmit` incremental y `next build` en CI.

## Decisión clave a resolver

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Framework nuevo ahora vs no | (a) mantener ponytail + CI; (b) sumar Vitest | **(a)** para este hito: el CI es el valor; Vitest se evalúa cuando los checks dejen de dar el ancho (dominios con mocking pesado) |
| Secretos en CI | ninguno para `test/typecheck/lint` vs `SUPABASE_*` como dummy | ninguno; los checks se hacen herméticos (Task 0) |
| Versión de Node | 22 LTS vs 24 | **24** — igual que el entorno local (elimina el "anda en mi máquina") |
| Hermeticidad de geocodificación | stub de `fetch` en el check vs inyección `fetchImpl` en prod | **stub en el check** (proceso por check → sin filtraciones, cero churn de prod) |

## Tareas

- [x] **Task 0**: `storeLocation.check.ts` con stub de `fetch` (hermético) y verificación de la
      suite con env limpio (35/35). `publicStore.check.ts` no requería cambio (es auto-contenido).
- [x] `.github/workflows/ci.yml` (jobs test / typecheck / lint, `pnpm/action-setup`, `setup-node`
      Node 24 con `cache: pnpm`, `pnpm install --frozen-lockfile`, `permissions: contents: read`,
      `concurrency` cancel-in-progress).
- [x] `package.json`: `packageManager: pnpm@11.24.0` + script `typecheck`.
- [x] `pnpm-workspace.yaml`: `allowBuilds` + `esbuild: true` (CI con install limpio fallaba con
      `ERR_PNPM_IGNORED_BUILDS` en instalaciones frescas — solo sharp estaba aprobado).
- [x] Confirmada la primera corrida verde en GitHub (Tests / Typecheck / Lint → success).

## Referencias

- `scripts/run-checks.mjs` · `package.json` (scripts `test`/`lint`)
- Checks actuales: `src/**/*.check.ts` (35)
- `src/lib/business/publicStore.check.ts` (única lectura de `process.env`)