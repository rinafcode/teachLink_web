# Feature Flags Database Migration - Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup ✓
- [ ] PostgreSQL 12+ database is running
- [ ] `DATABASE_URL` environment variable is configured
- [ ] Database credentials have appropriate permissions (CREATE TABLE, INSERT, UPDATE, DELETE, SELECT)
- [ ] Database connection is tested: `psql $DATABASE_URL -c "SELECT 1"`
- [ ] SSL is configured for production databases

### 2. Code Review ✓
- [ ] All modified files have been reviewed
- [ ] Type errors resolved (run `npm run type-check`)
- [ ] Linting passes (run `npm run lint`)
- [ ] No merge conflicts

### 3. Testing ✓
- [ ] Unit tests pass: `npm test src/lib/feature-flags/__tests__/db.test.ts`
- [ ] Integration tests pass: `npm test src/lib/feature-flags/__tests__/integration.test.ts`
- [ ] Manual API testing completed (see below)
- [ ] Edge runtime compatibility verified

### 4. Documentation ✓
- [ ] `FEATURE_FLAGS_DATABASE_IMPLEMENTATION.md` reviewed
- [ ] `QUICKSTART.md` followed successfully
- [ ] Team members briefed on changes
- [ ] Runbook updated with new procedures

## Deployment Steps

### Step 1: Backup (Production Only)

```bash
# Backup existing database (if applicable)
pg_dump $DATABASE_URL > backup_before_feature_flags_$(date +%Y%m%d_%H%M%S).sql

# Or if you have a backup service, trigger a backup
# cloud-backup create --name "before-feature-flags-migration"
```

### Step 2: Run Database Migrations

```bash
# Development
npm run db:migrate

# Production (ensure you set the correct DATABASE_URL)
NODE_ENV=production npm run db:migrate
```

**Expected Output:**
```
🔄 Starting database migrations...

▶️  Running 001_create_feature_flags_table.sql...
✅ Successfully executed 001_create_feature_flags_table.sql

✅ Successfully ran 1 migration(s)!
```

### Step 3: Verify Database Schema

```bash
psql $DATABASE_URL
```

Run these verification queries:

```sql
-- Check tables exist
\dt feature_flags*

-- Expected output:
--  Schema |         Name          | Type  |  Owner
-- --------+-----------------------+-------+---------
--  public | feature_flags         | table | user
--  public | feature_flags_audit   | table | user

-- Verify seed data
SELECT id, name, enabled, strategy FROM feature_flags;

-- Expected 3 rows:
-- flag_new_dashboard
-- flag_ai_tutor
-- flag_video_speed

-- Check indexes
\di feature_flags*

-- Expected indexes on enabled, strategy, updated_at, tags

-- Verify migration tracking
SELECT * FROM schema_migrations;

-- Expected 1 row with filename: 001_create_feature_flags_table.sql

\q
```

### Step 4: Deploy Application

```bash
# Build
npm run build

# Deploy based on your platform:

# Vercel
# vercel --prod

# Docker
# docker build -t teachlink:latest .
# docker push registry/teachlink:latest

# Kubernetes
# kubectl apply -f k8s/

# Or start production server
# npm run start
```

### Step 5: Smoke Test

Run these curl commands to verify the API:

```bash
# Set your API URL
API_URL=http://localhost:3000  # or your production URL

# 1. List all flags (should show 3 seed flags)
curl "$API_URL/api/admin/feature-flags"

# 2. Get specific flag
curl "$API_URL/api/admin/feature-flags/flag_new_dashboard"

# 3. Create a new flag
curl -X POST "$API_URL/api/admin/feature-flags" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deployment Test Flag",
    "description": "Created during deployment verification",
    "strategy": "all",
    "tags": ["deployment", "test"]
  }'

# Save the returned flag ID, then:

# 4. Update the flag
curl -X PUT "$API_URL/api/admin/feature-flags/[FLAG_ID]" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# 5. Evaluate the flag
curl "$API_URL/api/admin/feature-flags/evaluate?id=[FLAG_ID]&userId=test-user"

# 6. Check audit log
curl "$API_URL/api/admin/feature-flags/audit?flagId=[FLAG_ID]"

# 7. Clean up test flag
curl -X DELETE "$API_URL/api/admin/feature-flags/[FLAG_ID]"
```

### Step 6: Restart Verification

**Critical Test**: Verify persistence across restarts

```bash
# 1. Create a test flag
TEST_RESPONSE=$(curl -X POST "$API_URL/api/admin/feature-flags" \
  -H "Content-Type: application/json" \
  -d '{"name":"Restart Test","description":"Testing persistence"}')

echo $TEST_RESPONSE
# Note the ID

# 2. Restart the application server
# (restart method depends on your deployment)

# 3. Verify the flag still exists
curl "$API_URL/api/admin/feature-flags"
# Should include "Restart Test" flag

# 4. Clean up
curl -X DELETE "$API_URL/api/admin/feature-flags/[TEST_FLAG_ID]"
```

### Step 7: Monitor

Watch for errors in the first 15 minutes:

```bash
# Application logs
tail -f /var/log/app.log

# Or Docker logs
# docker logs -f container-name

# Or Kubernetes logs
# kubectl logs -f deployment/teachlink

# Watch for these patterns:
# - "[DB Pool] New client connected" (good)
# - "[DB Query]" (normal activity)
# - "error" or "ECONNREFUSED" (bad - connection issues)
# - SQL syntax errors (bad - migration issues)
```

### Step 8: Performance Check

```bash
# Check database connection pool
curl "$API_URL/api/health/db" || echo "Create health endpoint if needed"

# Monitor query times in logs
# Should be < 50ms for flag operations

# Check database load
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## Post-Deployment Verification

### Functional Tests ✓

- [ ] List flags endpoint returns correct data
- [ ] Create flag persists to database
- [ ] Update flag reflects changes immediately
- [ ] Delete flag removes from database
- [ ] Evaluate flag returns correct boolean
- [ ] Audit log records all changes
- [ ] Flags survive application restart

### Performance Tests ✓

- [ ] Flag retrieval < 50ms (p95)
- [ ] Flag creation < 100ms (p95)
- [ ] Database connection pool stable
- [ ] No connection leaks after 1 hour

### Security Tests ✓

- [ ] SQL injection attempts fail safely
- [ ] Rate limiting still active
- [ ] Authentication/authorization unchanged
- [ ] Audit log captures actor correctly

## Rollback Plan

If issues are discovered:

### Quick Rollback (Application Only)

```bash
# 1. Revert to previous deployment
git revert HEAD
npm run build
# Deploy previous version

# 2. Application will fail to start without DB
# Proceed to full rollback
```

### Full Rollback (Application + Database)

```bash
# 1. Restore application code
git checkout [previous-commit]
npm run build
# Deploy

# 2. Remove database tables
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS feature_flags_audit;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS schema_migrations;
EOF

# 3. Restore from backup (if needed)
psql $DATABASE_URL < backup_before_feature_flags_*.sql
```

## Monitoring Dashboards

Set up alerts for:

- [ ] Database connection failures (alert threshold: > 5 errors/min)
- [ ] Query timeout errors (alert threshold: > 10 errors/min)
- [ ] API endpoint errors (alert threshold: > 5% error rate)
- [ ] Database connection pool exhaustion (alert threshold: > 90% utilization)
- [ ] Slow queries (alert threshold: > 1 second)

## Success Criteria

Deployment is successful when:

✅ All smoke tests pass  
✅ Zero critical errors in logs  
✅ Flag persistence verified after restart  
✅ API response times within SLA  
✅ No database connection issues  
✅ Audit log capturing all operations  
✅ Team can create/modify flags via admin UI  

## Communication Plan

### Pre-Deployment
- [ ] Notify team 24 hours before deployment
- [ ] Schedule deployment during low-traffic window
- [ ] Prepare rollback instructions

### During Deployment
- [ ] Post status updates in team chat
- [ ] Monitor error rates in real-time
- [ ] Have DBA on standby (if applicable)

### Post-Deployment
- [ ] Confirm success in team chat
- [ ] Update status page (if applicable)
- [ ] Document any issues encountered
- [ ] Schedule retrospective if needed

## Troubleshooting

### Issue: Migration fails with "connection refused"

**Solution:**
```bash
# Check database is running
pg_isready -d $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check environment variable
echo $DATABASE_URL
```

### Issue: Migration fails with "permission denied"

**Solution:**
```bash
# Grant permissions to user
psql $DATABASE_URL -c "GRANT ALL PRIVILEGES ON DATABASE teachlink TO your_user;"
```

### Issue: "Table already exists" error

**Solution:**
```bash
# Check what exists
psql $DATABASE_URL -c "\dt feature_flags*"

# If incomplete, clean up and re-run
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS feature_flags_audit;
DROP TABLE IF EXISTS feature_flags;
DELETE FROM schema_migrations WHERE filename = '001_create_feature_flags_table.sql';
EOF

npm run db:migrate
```

### Issue: Application can't connect after deployment

**Solution:**
```bash
# Verify DATABASE_URL is set in production environment
# Check SSL settings if in production
# Verify firewall rules allow connection
# Check connection pool configuration
```

## Team Sign-Off

- [ ] Lead Developer reviewed and approved
- [ ] DevOps/SRE reviewed infrastructure changes
- [ ] QA verified test results
- [ ] Product Manager acknowledged feature availability
- [ ] DBA (if applicable) reviewed schema changes

---

**Deployment Date**: __________  
**Deployed By**: __________  
**Deployment Time**: __________  
**Status**: [ ] Success [ ] Rolled Back [ ] Partial  
**Notes**: 

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________
