/**
 * Aplica migración menu_categories vía Postgres pooler (necesita DB password).
 *
 * Uso:
 *   SUPABASE_DB_PASSWORD='tu-password' node scripts/apply-menu-migration.mjs
 *
 * Password: Supabase Dashboard → Project Settings → Database → Database password
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = url.match(/https:\/\/([^.]+)\./)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD;

if (!ref || !password) {
  console.error(
    "Necesitás SUPABASE_DB_PASSWORD y NEXT_PUBLIC_SUPABASE_URL en .env.local\n" +
      "Dashboard → Project Settings → Database → Database password",
  );
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), "supabase/migrations/20260829_menu_categories.sql");
const sql = readFileSync(sqlPath, "utf8");

const conn = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log("Aplicando migración en proyecto:", ref);

const child = spawn("psql", [conn, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("Instalá psql (postgresql-client) o pegá el SQL en el SQL Editor del proyecto", ref);
    console.error("\n--- SQL ---\n");
    console.error(sql.slice(0, 500) + "...");
  } else {
    console.error(err);
  }
  process.exit(1);
});

child.on("close", (code) => process.exit(code ?? 1));
