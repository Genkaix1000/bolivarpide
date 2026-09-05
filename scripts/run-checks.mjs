/**
 * Corre todos los *.check.ts (patrón ponytail) bajo src/ con tsx.
 * Devuelve exit 0 si todos pasan, 1 si alguno falla.
 */
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(process.cwd(), "src");
const TSX_CLI = resolve(ROOT, "..", "node_modules", "tsx", "dist", "cli.mjs");

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collect(full));
    else if (entry.endsWith(".check.ts")) out.push(full);
  }
  return out;
}

const files = collect(ROOT).sort();
let failed = 0;

for (const file of files) {
  const res = spawnSync(process.execPath, [TSX_CLI, file], {
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) failed += 1;
}

console.log(`\n[run-checks] ${files.length - failed}/${files.length} checks pasaron`);
if (failed > 0) {
  console.error(`[run-checks] ${failed} check(s) fallaron`);
  process.exit(1);
}