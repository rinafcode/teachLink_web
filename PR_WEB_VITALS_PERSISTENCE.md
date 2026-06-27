## Description

Persists incoming Web Vitals metrics to a new `web_vitals` database table, exposes aggregated data via a GET endpoint, and adds poor-rate alerting when a metric exceeds the 5% threshold.

Changes:

- Created `src/lib/db/migrations/001_create_web_vitals.sql` (table DDL with indexes on name, page_url, created_at, rating)
- Created `src/lib/db/migrate.ts` — migration runner that tracks applied migrations in a `_migrations` table
- Modified `src/app/api/performance/vitals/route.ts`:
  - Changed runtime from `edge` → `nodejs` (required for `pg` access)
  - **POST**: validates incoming metrics, inserts a row into `web_vitals`, keeps existing console alerts, and fires an additional alert if poor-rate exceeds 5% over the last 500 sessions
  - **GET**: new handler returning aggregated metrics (`avg_value`, `poor_rate_pct`) grouped by `name` and `page_url`, with a configurable `?range=7d|30d|90d|all` query parameter
- Added `migrate` script to `package.json`

## Related Issue

Closes #764

## Type of Change

- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist

- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] No console errors
- [ ] Uses Lucide icons consistently
- [ ] Responsive design implemented
- [ ] Starknet best practices followed
