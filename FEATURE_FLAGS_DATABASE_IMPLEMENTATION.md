# Feature Flags Database Implementation

## Overview

Feature flags are now fully database-backed using PostgreSQL. All flag configurations and audit logs persist across server restarts, making the system production-ready for multi-instance deployments.

## Implementation Summary

### Changes Made

1. **Database Schema** (`src/lib/db/migrations/001_create_feature_flags_table.sql`)
   - Created `feature_flags` table with full schema support
   - Created `feature_flags_audit` table for change tracking
   - Added appropriate indexes for query performance
   - Seeded initial flags via migration (not runtime code)

2. **Database Functions** (`src/lib/feature-flags/db.ts`)
   - `getFlagById(id)`: Retrieve a single flag
   - `getAllFlags(sortBy?)`: Get all flags with optional sorting
   - `createFlag(flag)`: Create new flag with auto-generated ID
   - `updateFlag(id, updates)`: Partial or full update
   - `deleteFlag(id)`: Remove a flag
   - `createAuditEntry()`: Log all flag mutations
   - `getAuditLog(flagId?, limit?)`: Query audit history

3. **Type Definitions** (`src/lib/feature-flags/types.ts`)
   - Extracted types to separate file for cleaner imports
   - `FeatureFlag`, `AuditEntry`, `TargetingRule`, `RolloutStrategy`

4. **Store Refactoring** (`src/lib/feature-flags/store.ts`)
   - Removed in-memory Map storage
   - Removed runtime seeding
   - Kept evaluation logic (`evaluateFlag()`)
   - Re-exports all database functions and types

5. **API Route Updates**
   - `GET /api/admin/feature-flags`: Uses `getAllFlags()`
   - `POST /api/admin/feature-flags`: Uses `createFlag()`
   - `GET /api/admin/feature-flags/[id]`: Uses `getFlagById()`
   - `PUT /api/admin/feature-flags/[id]`: Uses `updateFlag()`
   - `DELETE /api/admin/feature-flags/[id]`: Uses `deleteFlag()`
   - `GET /api/admin/feature-flags/audit`: Uses `getAuditLog()`
   - `GET /api/admin/feature-flags/evaluate`: Uses `getFlagById()` + `evaluateFlag()`

6. **Migration Infrastructure**
   - Created `src/lib/db/migrations/` directory
   - Built migration runner script (`scripts/run-migrations.ts`)
   - Added `db:migrate` npm script
   - Migration tracking via `schema_migrations` table

## Database Schema

### `feature_flags` Table

```sql
CREATE TABLE feature_flags (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  strategy VARCHAR(50) NOT NULL DEFAULT 'all',
  percentage INTEGER NOT NULL DEFAULT 0,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT 'system'
);
```

**Indexes:**
- `idx_feature_flags_enabled` on `enabled`
- `idx_feature_flags_strategy` on `strategy`
- `idx_feature_flags_updated_at` on `updated_at DESC`
- `idx_feature_flags_tags` (GIN index) on `tags`

### `feature_flags_audit` Table

```sql
CREATE TABLE feature_flags_audit (
  id VARCHAR(255) PRIMARY KEY,
  flag_id VARCHAR(255) NOT NULL,
  flag_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  before JSONB,
  after JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_feature_flags_audit_flag_id` on `flag_id`
- `idx_feature_flags_audit_timestamp` on `timestamp DESC`
- `idx_feature_flags_audit_actor` on `actor`

## Running Migrations

### First-Time Setup

```bash
# Ensure DATABASE_URL is set in .env
export DATABASE_URL="postgresql://user:password@localhost:5432/teachlink"

# Run migrations
npm run db:migrate
```

### Manual Migration (Alternative)

```bash
psql $DATABASE_URL -f src/lib/db/migrations/001_create_feature_flags_table.sql
```

## Migration Tracking

The migration runner automatically creates a `schema_migrations` table to track which migrations have been executed. This prevents duplicate runs and allows safe re-execution.

## Seed Data

Three initial flags are seeded via migration:

1. **New Dashboard** (`flag_new_dashboard`)
   - Strategy: percentage (10%)
   - Tags: ui, dashboard
   - Enabled: false

2. **AI Tutor** (`flag_ai_tutor`)
   - Strategy: targeting (plan = 'pro')
   - Tags: ai, beta
   - Enabled: false

3. **Video Speed Controls** (`flag_video_speed`)
   - Strategy: all
   - Tags: video, ux
   - Enabled: true

## API Compatibility

All existing API endpoints maintain backward compatibility:

- Request/response formats unchanged
- Error handling enhanced with try-catch for database operations
- Rate limiting and audit logging preserved

## Testing

### Manual Testing Steps

1. **Start the database** (if using Docker):
   ```bash
   docker-compose up -d postgres
   ```

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Test flag persistence**:
   ```bash
   # Create a flag via API
   curl -X POST http://localhost:3000/api/admin/feature-flags \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Flag","description":"Testing persistence"}'

   # Restart the server
   npm run dev

   # Verify flag still exists
   curl http://localhost:3000/api/admin/feature-flags
   ```

4. **Test flag mutations**:
   ```bash
   # Update flag
   curl -X PUT http://localhost:3000/api/admin/feature-flags/flag_test_xyz \
     -H "Content-Type: application/json" \
     -d '{"enabled":true}'

   # Verify audit log
   curl http://localhost:3000/api/admin/feature-flags/audit
   ```

## Production Deployment

### Pre-Deployment Checklist

- [ ] `DATABASE_URL` environment variable configured
- [ ] Database connection pool settings reviewed (see `src/lib/db/pool.ts`)
- [ ] SSL enabled for production database connections
- [ ] Migrations executed successfully
- [ ] Seed flags verified

### Deployment Steps

1. **Run migrations** on production database:
   ```bash
   NODE_ENV=production npm run db:migrate
   ```

2. **Verify schema**:
   ```sql
   \dt feature_flags*
   SELECT COUNT(*) FROM feature_flags;
   SELECT COUNT(*) FROM feature_flags_audit;
   ```

3. **Deploy application** as normal

### Monitoring

Monitor these database metrics:
- Query performance on flag lookups
- Audit log growth rate
- Connection pool utilization
- Index usage statistics

## Performance Considerations

### Query Optimization

- All common queries are indexed
- `getAllFlags()` uses sorting at database level
- JSONB fields (rules) use native PostgreSQL operators
- GIN index on tags array for fast tag-based queries

### Connection Pooling

Configured in `src/lib/db/pool.ts`:
- Default max connections: 20
- Connection timeout: 5s
- Idle timeout: 30s

Adjust via environment variables:
- `DB_POOL_MAX`
- `DB_CONNECTION_TIMEOUT`
- `DB_IDLE_TIMEOUT`

## Rollback Plan

If issues occur, rollback steps:

1. **Revert to in-memory store** (emergency only):
   - Restore previous `store.ts` from git
   - Restore previous route handlers

2. **Database rollback**:
   ```sql
   DROP TABLE IF EXISTS feature_flags_audit;
   DROP TABLE IF EXISTS feature_flags;
   DROP TABLE IF EXISTS schema_migrations;
   ```

## Future Enhancements

Potential improvements:
- Database connection retry logic with exponential backoff
- Read replicas for high-traffic deployments
- Caching layer (Redis) for frequently accessed flags
- Bulk flag operations endpoints
- Flag versioning/history beyond audit log
- Scheduled flag toggles (time-based activation)

## Acceptance Criteria Met

✅ Feature flags survive server restarts  
✅ Creating a flag via API persists to database  
✅ Seed flags applied via migration, not runtime code  
✅ Update/delete operations immediately persisted  
✅ Admin UI reflects true persisted state  
✅ Audit log tracks all mutations  

## Files Changed

### Created
- `src/lib/feature-flags/db.ts`
- `src/lib/feature-flags/types.ts`
- `src/lib/db/migrations/001_create_feature_flags_table.sql`
- `src/lib/db/migrations/README.md`
- `scripts/run-migrations.ts`
- `FEATURE_FLAGS_DATABASE_IMPLEMENTATION.md`

### Modified
- `src/lib/feature-flags/store.ts`
- `src/app/api/admin/feature-flags/route.ts`
- `src/app/api/admin/feature-flags/[id]/route.ts`
- `src/app/api/admin/feature-flags/audit/route.ts`
- `src/app/api/admin/feature-flags/evaluate/route.ts`
- `package.json` (added `db:migrate` script)

## Support

For issues or questions:
1. Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
2. Verify migrations: `psql $DATABASE_URL -c "SELECT * FROM schema_migrations"`
3. Check application logs for database errors
4. Review `src/lib/db/pool.ts` configuration
