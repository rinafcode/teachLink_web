# Database Migrations

This directory contains SQL migration files for the TeachLink database schema.

## Migration Naming Convention

Migrations are numbered sequentially:
- `001_create_feature_flags_table.sql`
- `002_next_migration.sql`
- etc.

## Running Migrations

### Manual Execution
You can run migrations manually using psql:
```bash
psql $DATABASE_URL -f src/lib/db/migrations/001_create_feature_flags_table.sql
```

### Using Node.js
```bash
npm run db:migrate
```

## Creating New Migrations

1. Create a new file with the next sequential number
2. Include descriptive comments at the top
3. Use `IF NOT EXISTS` clauses to make migrations idempotent
4. Test locally before committing

## Migration Files

- **001_create_feature_flags_table.sql**: Creates the `feature_flags` and `feature_flags_audit` tables with initial seed data
