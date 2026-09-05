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

- Solo **1** check lee `process.env` directamente: `src/lib/business/publicStore.check.ts`
  (con env de la máquina). `env.check.ts` y `oauthConfig.check.ts` llaman helpers puros con
  literales → **no dependen** de `.env`.
- Riesgo: en un runner limpio, `publicStore.check.ts` puede fallar si asume variables.
  Tarea 0 del hito: correr `pnpm test` con las env vacías y arreglar/gatear ese check.

## Alcance

**In v1**
- Workflow **GitHub Actions** `ci.yml` con 3 jobs en paralelo:
  1. `test` → `pnpm install --frozen-lockfile` + `pnpm test`
  2. `typecheck` → `pnpm exec tsc --noEmit`
  3. `lint` → `pnpm eslint`
- Uso de `pnpm/action-setup@v4` (verificar versión vigente) + `actions/setup-node` con
  `cache: pnpm`.
- Task 0: hacer que la suite corra **sin `.env`** (gatear `publicStore.check.ts` con dummy o
  guard) para que el CI no dependa de secretos para la parte básica.
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

## Tareas

- [ ] **Task 0**: `pnpm test` con env vacía → gatear `publicStore.check.ts` (o decidir su dummy) y
      corregir cualquier check que asuma `.env`.
- [ ] `.github/workflows/ci.yml` (jobs test / typecheck / lint, pnpm setup, frozen lockfile).
- [ ] `package.json`: script `typecheck`.
- [ ] Verificación local del flujo: emular el paso de CI en la máquina (env vacía) y confirmar
      verde; luego `git push` y ver el check en GitHub.

## Referencias

- `scripts/run-checks.mjs` · `package.json` (scripts `test`/`lint`)
- Checks actuales: `src/**/*.check.ts` (35)
- `src/lib/business/publicStore.check.ts` (única lectura de `process.env`)