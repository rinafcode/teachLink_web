# Feature Flags System

A production-ready, database-backed feature flag system supporting multiple rollout strategies, targeting rules, and comprehensive audit logging.

## Quick Start

### 1. Setup Database

```bash
# Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://user:password@localhost:5432/teachlink"

# Run migrations
npm run db:migrate
```

### 2. Use in Your Code

```typescript
import { getFlagById, evaluateFlag } from '@/lib/feature-flags/store';

// In API route or server component
const flag = await getFlagById('flag_new_dashboard');

if (flag && evaluateFlag(flag, { userId: user.id, plan: user.plan })) {
  // Feature is enabled for this user
  return <NewDashboard />;
}

return <OldDashboard />;
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  API Routes (/api/admin/feature-flags)                       │
│  - List, Create, Update, Delete, Evaluate                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  store.ts (Public API)                                        │
│  - Re-exports types and functions                            │
│  - evaluateFlag() logic                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  db.ts (Database Layer)                                       │
│  - CRUD operations                                            │
│  - Audit logging                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                   │
│  - feature_flags table                                        │
│  - feature_flags_audit table                                  │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/lib/feature-flags/
├── types.ts              # Type definitions
├── db.ts                 # Database operations
├── store.ts              # Public API & evaluation logic
├── README.md             # This file
└── __tests__/
    ├── db.test.ts        # Database function tests
    └── integration.test.ts  # End-to-end tests
```

## Rollout Strategies

### 1. All Users (`strategy: 'all'`)

Enable or disable for everyone.

```typescript
{
  strategy: 'all',
  enabled: true,  // On for everyone
}
```

### 2. Percentage Rollout (`strategy: 'percentage'`)

Gradually roll out to a percentage of users (0-100%).

```typescript
{
  strategy: 'percentage',
  enabled: true,
  percentage: 25,  // 25% of users
}
```

Users are bucketed deterministically based on `userId + flagId` hash.

### 3. Targeting Rules (`strategy: 'targeting'`)

Enable for users matching specific criteria.

```typescript
{
  strategy: 'targeting',
  enabled: true,
  rules: [
    { attribute: 'plan', operator: 'equals', value: 'pro' },
    { attribute: 'country', operator: 'in', value: 'US,CA,GB' },
  ]
}
```

**Operators:**
- `equals`: Exact match
- `contains`: String contains value
- `startsWith`: String starts with value
- `in`: Comma-separated list of allowed values

**Logic**: ALL rules must match (AND logic).

## API Reference

### Database Functions

```typescript
// Get single flag
const flag = await getFlagById('flag_id');

// Get all flags
const flags = await getAllFlags('updatedAt'); // or 'name'

// Create flag
const newFlag = await createFlag({
  name: 'My Feature',
  description: 'Feature description',
  enabled: false,
  strategy: 'percentage',
  percentage: 10,
  rules: [],
  tags: ['beta', 'ui'],
  createdBy: 'admin@example.com',
});

// Update flag
const updated = await updateFlag('flag_id', {
  enabled: true,
  percentage: 50,
});

// Delete flag
const success = await deleteFlag('flag_id');

// Audit log
await createAuditEntry('updated', 'admin@example.com', oldFlag, newFlag);
const entries = await getAuditLog('flag_id', 100);
```

### Evaluation

```typescript
import { evaluateFlag } from '@/lib/feature-flags/store';

const isEnabled = evaluateFlag(flag, {
  userId: 'user123',
  plan: 'pro',
  country: 'US',
  email: 'user@example.com',
});
```

## REST API Endpoints

### List Flags
```http
GET /api/admin/feature-flags
```

### Get Flag
```http
GET /api/admin/feature-flags/{id}
```

### Create Flag
```http
POST /api/admin/feature-flags
Content-Type: application/json

{
  "name": "New Feature",
  "description": "Description",
  "strategy": "percentage",
  "percentage": 10,
  "tags": ["beta"]
}
```

### Update Flag
```http
PUT /api/admin/feature-flags/{id}
Content-Type: application/json

{
  "enabled": true,
  "percentage": 50
}
```

### Delete Flag
```http
DELETE /api/admin/feature-flags/{id}
```

### Evaluate Flag
```http
GET /api/admin/feature-flags/evaluate?id={flagId}&userId={uid}&plan={plan}
```

### Audit Log
```http
GET /api/admin/feature-flags/audit?flagId={id}&limit=50
```

## Usage Examples

### Example 1: Gradual Rollout

```typescript
// Create flag at 0%
const flag = await createFlag({
  name: 'New Checkout Flow',
  enabled: true,
  strategy: 'percentage',
  percentage: 0,
  // ... other fields
});

// Ramp up gradually
await updateFlag(flag.id, { percentage: 10 });   // 10%
// Monitor metrics...
await updateFlag(flag.id, { percentage: 25 });   // 25%
await updateFlag(flag.id, { percentage: 50 });   // 50%
await updateFlag(flag.id, { percentage: 100 });  // 100%
```

### Example 2: Premium Feature

```typescript
// Create premium-only flag
const flag = await createFlag({
  name: 'AI Assistant',
  enabled: true,
  strategy: 'targeting',
  rules: [
    { attribute: 'plan', operator: 'in', value: 'pro,enterprise' },
  ],
  // ... other fields
});

// Evaluate
const canUseAI = evaluateFlag(flag, { plan: user.plan });
```

### Example 3: Beta Testing

```typescript
// Create beta tester flag
const flag = await createFlag({
  name: 'Beta Features',
  enabled: true,
  strategy: 'targeting',
  rules: [
    { attribute: 'email', operator: 'contains', value: '@company.com' },
  ],
  tags: ['internal', 'beta'],
  // ... other fields
});

// Evaluate
const isBetaTester = evaluateFlag(flag, { email: user.email });
```

## Best Practices

### 1. Naming Conventions

- Use descriptive names: "Video Speed Controls" not "Feature123"
- Prefix with category: "UI:", "API:", "Experiment:"
- Use ID prefix: `flag_` (auto-generated)

### 2. Tags

- Use tags for organization: `['ui', 'beta', 'mobile']`
- Tag by team: `['team-growth']`
- Tag by release: `['q4-2024']`

### 3. Rollout Strategy

1. Start with targeting (internal users)
2. Ramp to 1-5% (canary)
3. Monitor metrics
4. Gradually increase: 10% → 25% → 50% → 100%
5. Once at 100% for a week, remove flag from code

### 4. Cleanup

- Remove flags after 100% rollout is stable
- Archive flags older than 6 months
- Document flag removal in code review

### 5. Evaluation Context

Always provide relevant context:
```typescript
// Good
evaluateFlag(flag, {
  userId: user.id,
  plan: user.subscription.plan,
  country: user.country,
  email: user.email,
});

// Bad - missing context
evaluateFlag(flag, { userId: user.id });
```

## Testing

### Unit Tests

```bash
# Test database functions
npm test src/lib/feature-flags/__tests__/db.test.ts

# Requires DATABASE_URL to be set
```

### Integration Tests

```bash
# Test complete workflows
npm test src/lib/feature-flags/__tests__/integration.test.ts
```

### Manual Testing

```bash
# Create test flag
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Testing"}'

# Verify persistence after restart
npm run dev
curl http://localhost:3000/api/admin/feature-flags
```

## Monitoring

### Key Metrics

- Flag evaluation latency (target: < 50ms)
- Database connection pool utilization
- Flag update frequency
- Audit log growth rate

### Logs

All operations log via `edgeLog()`:
```typescript
edgeLog('info', '/api/admin/feature-flags', 'GET request received');
edgeLog('error', '/api/admin/feature-flags', 'Failed to fetch flags', { error });
```

## Troubleshooting

### Flag not persisting

**Symptom**: Flag disappears after server restart

**Solution**:
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM feature_flags"

# Verify migration ran
psql $DATABASE_URL -c "SELECT * FROM schema_migrations"

# Re-run if needed
npm run db:migrate
```

### Evaluation returning unexpected results

**Debug**:
```typescript
const flag = await getFlagById('flag_id');
console.log('Flag:', flag);

const context = { userId: 'user123', plan: 'pro' };
console.log('Context:', context);

const result = evaluateFlag(flag, context);
console.log('Result:', result);
```

### Slow flag queries

**Check**:
```sql
-- Ensure indexes exist
\di feature_flags*

-- Check query plans
EXPLAIN ANALYZE SELECT * FROM feature_flags WHERE enabled = true;
```

## Migration Guide

If migrating from old in-memory system:

1. ✅ No action needed - API is backward compatible
2. ✅ Run database migration: `npm run db:migrate`
3. ✅ Flags are seeded automatically
4. ✅ No code changes required in consuming code

## Security

- ✅ SQL injection protected (parameterized queries)
- ✅ Rate limiting on all endpoints
- ✅ Audit log tracks all mutations
- ✅ Actor captured via `x-admin-user` header

## Performance

- **Database queries**: Indexed for fast lookups
- **Connection pooling**: Max 20 connections (configurable)
- **Query caching**: Not implemented (future enhancement)

## Future Enhancements

- [ ] Redis caching layer
- [ ] Bulk operations API
- [ ] Scheduled flag changes
- [ ] A/B test experiments
- [ ] Webhook notifications
- [ ] Admin UI (web interface)

## Support

- 📖 Full docs: `../../../FEATURE_FLAGS_DATABASE_IMPLEMENTATION.md`
- 🚀 Quick start: `../db/migrations/QUICKSTART.md`
- ✅ Deployment: `../../../FEATURE_FLAGS_DEPLOYMENT_CHECKLIST.md`
- 📝 Summary: `../../../FEATURE_FLAGS_IMPLEMENTATION_SUMMARY.md`

## Contributing

When adding new features:

1. Update type definitions in `types.ts`
2. Add database functions in `db.ts`
3. Export from `store.ts`
4. Add tests in `__tests__/`
5. Update this README
6. Update main documentation

---

**Version**: 1.0.0  
**Last Updated**: 2026-06-28  
**Maintainer**: Platform Team
