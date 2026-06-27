import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbPool, query } from './pool';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_TABLE = '_migrations';
const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`);
  return new Set(result.rows.map((r: { name: string }) => r.name));
}

async function applyMigration(name: string, sql: string): Promise<void> {
  await query(sql);
  await query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [name]);
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    await applyMigration(file, sql);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
