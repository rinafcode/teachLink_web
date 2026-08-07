# SMS Logging - Quick Start Guide

## For Developers

### What Changed?

SMS logs are now stored in a **PostgreSQL database** instead of an in-memory array. The in-memory buffer is now only 100 entries (down from 5,000) for fast recent queries.

### Key Points

1. **SMS logs survive server restarts** ✅
2. **Memory usage is ~98% lower** ✅  
3. **Historical queries work automatically** ✅
4. **All query methods are now async** ⚠️

---

## Setup (One-Time)

### 1. Run the Database Migration

```bash
npm run db:migrate
```

This creates the `sms_logs` table.

### 2. Optional: Configure Buffer Size

Add to your `.env` (optional - defaults shown):

```env
SMS_LOG_BUFFER_SIZE=100
SMS_LOG_FLUSH_INTERVAL_MS=30000
```

### 3. Restart Your Server

The aggregator initializes automatically via `instrumentation.ts`.

---

## Code Updates Required

### Before (Synchronous)

```typescript
import { SMSLogAggregator } from '@/lib/logging/sms-aggregator';

// ❌ This no longer works
const logs = SMSLogAggregator.queryLogs({ status: 'failed' });
const metrics = SMSLogAggregator.getMetrics();
```

### After (Async)

```typescript
import { SMSLogAggregator } from '@/lib/logging/sms-aggregator';

// ✅ Use await
const logs = await SMSLogAggregator.queryLogs({ status: 'failed' });
const metrics = await SMSLogAggregator.getMetrics();
```

---

## Common Operations

### Query Recent Logs (from buffer)

```typescript
// Get last 50 logs
const recentLogs = await SMSLogAggregator.queryLogs({ 
  limit: 50 
});
```

### Query Historical Logs (from database)

```typescript
// Get logs from last 7 days
const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
const historicalLogs = await SMSLogAggregator.queryLogs({ 
  since: weekAgo,
  limit: 1000 
});
```

### Get Failed Messages

```typescript
const failedMessages = await SMSLogAggregator.getFailedMessages(100);
```

### Get Metrics

```typescript
// Last 24 hours (default)
const metrics = await SMSLogAggregator.getMetrics();

// Custom time range (last 7 days)
const weekMetrics = await SMSLogAggregator.getMetrics(7 * 24 * 60 * 60 * 1000);
```

### Check for Anomalies

```typescript
const anomalies = await SMSLogAggregator.getAnomalies();

console.log('Slow deliveries:', anomalies.slowDeliveries.length);
console.log('High retry attempts:', anomalies.highRetryAttempts.length);
console.log('Config errors:', anomalies.configurationErrors.length);
```

### Export Logs

```typescript
// JSON export
const json = await SMSLogAggregator.exportLogs('json', { 
  since: weekAgo, 
  limit: 5000 
});

// CSV export
const csv = await SMSLogAggregator.exportLogs('csv', { 
  since: weekAgo, 
  limit: 5000 
});
```

### Clean Old Logs

```typescript
// Delete logs older than 90 days
const deletedCount = await SMSLogAggregator.clearOldLogs(90 * 24 * 60 * 60 * 1000);
console.log(`Deleted ${deletedCount} old logs`);
```

### Monitor Buffer Status

```typescript
const stats = SMSLogAggregator.getStoreStats(); // Still synchronous!

console.log(`Buffer: ${stats.bufferSize}/${stats.bufferCapacity}`);
console.log(`Utilization: ${stats.utilizationPercent.toFixed(1)}%`);
console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
```

---

## API Endpoints

All endpoints in `/api/sms/logs` work the same but now return historical data:

```bash
# Query logs
GET /api/sms/logs?action=query&status=failed&limit=100

# Get metrics
GET /api/sms/logs?action=metrics&timeRangeMs=86400000

# Get failed messages
GET /api/sms/logs?action=failed&limit=100

# Get anomalies
GET /api/sms/logs?action=anomalies

# Export logs
GET /api/sms/logs?action=export&format=csv&since=1719734400000

# Buffer stats
GET /api/sms/logs?action=store-stats

# Clear old logs
POST /api/sms/logs?action=clear-old
Content-Type: application/json

{
  "olderThanMs": 7776000000
}
```

---

## Database Queries

### Check Log Count

```sql
SELECT COUNT(*) FROM sms_logs;
```

### View Recent Logs

```sql
SELECT * FROM sms_logs 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Failed Messages by Provider

```sql
SELECT provider, COUNT(*) as failed_count
FROM sms_logs
WHERE status = 'failed' 
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

### Average Delivery Time

```sql
SELECT 
  provider,
  AVG((metrics->0->>'value')::float) as avg_delivery_ms
FROM sms_logs
WHERE metrics IS NOT NULL
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

### Storage Size

```sql
SELECT pg_size_pretty(pg_total_relation_size('sms_logs'));
```

---

## Troubleshooting

### Logs Not Appearing in Database

1. Check buffer hasn't flushed yet (happens every 30 seconds or at 80 entries)
2. Check for flush errors in logs: `grep "Failed to flush SMS logs" logs/*.log`
3. Manually trigger flush by restarting the server

### High Memory Usage

Check buffer size:
```typescript
const stats = SMSLogAggregator.getStoreStats();
console.log('Buffer size:', stats.bufferSize); // Should be ≤ 100
```

### Query Performance Issues

1. Check database indexes: `\d sms_logs` in psql
2. Limit query ranges: Use `since` parameter
3. Add pagination: Use `limit` and `offset`

### Migration Failed

```bash
# Check migration status
psql -d teachlink -c "SELECT * FROM _migrations ORDER BY id;"

# Re-run migrations
npm run db:migrate

# Or manually
psql -d teachlink -f src/lib/db/migrations/003_create_sms_logs_table.sql
```

---

## Performance Characteristics

| Operation | Time | Data Source |
|-----------|------|-------------|
| Recent logs (< 100) | < 1ms | In-memory buffer |
| Historical logs | 10-50ms | Database |
| Metrics calculation | 50-200ms | Buffer + Database |
| Export (1000 logs) | 100-500ms | Database |
| Buffer flush | < 50ms | Background |

---

## Need Help?

- **Full docs:** `SMS_LOGGING_IMPLEMENTATION.md`
- **Changelog:** `CHANGELOG_SMS_LOGGING.md`
- **Database schema:** `src/lib/db/migrations/003_create_sms_logs_table.sql`
- **Code:** `src/lib/logging/sms-aggregator.ts`
