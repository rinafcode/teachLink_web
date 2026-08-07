#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * 
 * Runs all SQL migration files in src/lib/db/migrations/ directory.
 * Usage:
 *   npm run db:migrate
 *   or
 *   npx tsx scripts/run-migrations.ts
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = join(process.cwd(), 'src', 'lib', 'db', 'migrations');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Starting database migrations...\n');

    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get all migration files
    const files = await readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter((f) => f.endsWith('.sql'))
      .sort(); // Ensure migrations run in order

    if (sqlFiles.length === 0) {
      console.log('✅ No migration files found.');
      return;
    }

    // Check which migrations have already been run
    const { rows: executedMigrations } = await pool.query(
      'SELECT filename FROM schema_migrations'
    );
    const executedSet = new Set(executedMigrations.map((r) => r.filename));

    // Run pending migrations
    let migrationsRun = 0;
    for (const filename of sqlFiles) {
      if (executedSet.has(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      console.log(`▶️  Running ${filename}...`);
      const filepath = join(MIGRATIONS_DIR, filename);
      const sql = await readFile(filepath, 'utf-8');

      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename]
        );
        await pool.query('COMMIT');
        console.log(`✅ Successfully executed ${filename}\n`);
        migrationsRun++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Failed to execute ${filename}:`);
        console.error(error);
        throw error;
      }
    }

    if (migrationsRun === 0) {
      console.log('\n✅ All migrations are up to date!');
    } else {
      console.log(`\n✅ Successfully ran ${migrationsRun} migration(s)!`);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
