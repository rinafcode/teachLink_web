# Feature Flags Migration Quick Start

## 🚀 Getting Started

### Prerequisites
- PostgreSQL database running
- `DATABASE_URL` environment variable configured in `.env`

```bash
# Example .env
DATABASE_URL=postgresql://user:password@localhost:5432/teachlink
```

### Step 1: Run the Migration

```bash
npm run db:migrate
```

Expected output:
```
🔄 Starting database migrations...

▶️  Running 001_create_feature_flags_table.sql...
✅ Successfully executed 001_create_feature_flags_table.sql

✅ Successfully ran 1 migration(s)!
```

### Step 2: Verify the Setup

```bash
# Connect to your database
psql $DATABASE_URL

# Check tables were created
\dt feature_flags*

# Verify seed data
SELECT id, name, enabled FROM feature_flags;
```

Expected result:
```
           id            |         name           | enabled
-------------------------+------------------------+---------
 flag_new_dashboard      | New Dashboard          | f
 flag_ai_tutor           | AI Tutor               | f
 flag_video_speed        | Video Speed Controls   | t
```

### Step 3: Start Your Application

```bash
npm run dev
```

## ✅ Verification

### Test API Endpoints

```bash
# List all flags
curl http://localhost:3000/api/admin/feature-flags

# Get specific flag
curl http://localhost:3000/api/admin/feature-flags/flag_new_dashboard

# Create new flag
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Feature",
    "description": "Testing database persistence",
    "strategy": "percentage",
    "percentage": 50,
    "tags": ["test"]
  }'

# Update flag
curl -X PUT http://localhost:3000/api/admin/feature-flags/flag_new_dashboard \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Check audit log
curl http://localhost:3000/api/admin/feature-flags/audit
```

### Verify Persistence

1. Create a flag via API (as shown above)
2. Note the flag ID from the response
3. Restart the server: `npm run dev`
4. Query the flag again - it should still exist!

## 🔧 Troubleshooting

### Migration Already Run

If you see:
```
⏭️  Skipping 001_create_feature_flags_table.sql (already executed)
✅ All migrations are up to date!
```

This is normal! Migrations only run once.

### Database Connection Error

```
❌ Migration failed: connection refused
```

**Solutions:**
- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` in `.env`
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### Table Already Exists

```
ERROR: relation "feature_flags" already exists
```

The migration uses `IF NOT EXISTS` clauses, so this shouldn't happen. If it does:

```sql
-- Check what exists
\dt feature_flags*

-- If tables are incomplete, drop and re-run
DROP TABLE IF EXISTS feature_flags_audit;
DROP TABLE IF EXISTS feature_flags;
DELETE FROM schema_migrations WHERE filename = '001_create_feature_flags_table.sql';

-- Then run migration again
npm run db:migrate
```

## 📚 Next Steps

- Read [FEATURE_FLAGS_DATABASE_IMPLEMENTATION.md](../../../FEATURE_FLAGS_DATABASE_IMPLEMENTATION.md) for full documentation
- Review API endpoints in `src/app/api/admin/feature-flags/`
- Explore database functions in `src/lib/feature-flags/db.ts`

## 🐳 Docker Setup (Optional)

If using Docker Compose:

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for it to be ready
sleep 5

# Run migrations
npm run db:migrate
```

## 💡 Tips

- Run `npm run db:migrate` safely in any environment - it's idempotent
- Migrations are tracked in the `schema_migrations` table
- All seed data is in the migration file, not in code
- Changes persist across server restarts automatically
