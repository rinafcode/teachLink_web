# SMS Integration — Log Aggregation

**Issue:** #448 — SMS Integration: Log Aggregation

---

## Overview

This document describes the SMS Integration with Log Aggregation implementation for TeachLink. Every SMS send attempt — success, failure, or retry — is captured in structured logs and surfaced through a queryable aggregation layer.

---

## Architecture

```
NotificationService
       │
       ▼
   SMSService          ← event dispatch, message building
       │
       ▼
   SMSQueue            ← retry logic, delivery log store, metrics
       │
       ▼
   SMSProvider         ← Twilio / AWS SNS / Vonage
       │
       ▼
  AppLogger (pino)     ← structured log records
       │
       ├── InMemoryLogTransport   ← queryable in-process store
       └── HttpLogTransport       ← remote aggregation endpoint
                                     (LOG_AGGREGATION_URL)

SMSLogAggregator       ← metrics, anomaly detection, export
       │
       ▼
  GET /api/sms/logs    ← query, metrics, anomalies, export
  POST /api/sms/send   ← send SMS via API
```

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/sms/types.ts` | SMS types: `SMSMessage`, `SMSSendResult`, `SMSDeliveryLog`, etc. |
| `src/lib/sms/provider.ts` | Provider implementations: Twilio, AWS SNS, Vonage + factory |
| `src/lib/sms/queue.ts` | Queue with retry, exponential backoff, per-job delivery logs |
| `src/lib/sms/service.ts` | High-level service: event dispatch, message templates |
| `src/lib/sms/index.ts` | Barrel export |
| `src/lib/logging/sms-aggregator.ts` | Aggregation layer: metrics, anomaly detection, export |
| `src/app/api/sms/send/route.ts` | `POST /api/sms/send` — send SMS via HTTP |
| `src/app/api/sms/logs/route.ts` | `GET /api/sms/logs` — query logs, metrics, anomalies, export |
| `src/__tests__/sms/queue.test.ts` | Queue unit tests |
| `src/__tests__/sms/service.test.ts` | Service unit tests |
| `src/__tests__/logging/sms-aggregator.test.ts` | Aggregator unit tests |

---

## Configuration

Add these to your `.env` (see `.env.example` for all options):

```env
# Provider: twilio | sns | vonage
SMS_PROVIDER=twilio
SMS_FROM_NUMBER=+1234567890
SMS_MAX_RETRIES=3
SMS_RETRY_DELAY_MS=1500
SMS_MAX_CONCURRENT=5

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Remote log aggregation (optional — uses existing logging infra)
LOG_AGGREGATION_URL=https://your-log-aggregation-endpoint.com/logs
```

---

## What Gets Logged

Every SMS operation emits structured log records with the following context fields:

| Field | Description |
|-------|-------------|
| `jobId` | Unique queue job identifier |
| `provider` | Active SMS provider (`twilio`, `sns`, `vonage`) |
| `phoneNumber` | Recipient (E.164 format) |
| `messageId` | Provider-assigned message ID on success |
| `status` | `pending` / `sent` / `failed` / `retrying` |
| `attempt` | Current attempt number |
| `maxRetries` | Configured retry limit |
| `eventType` | SMS event type (e.g. `verification-code`) |
| `tags` | Message tags for filtering |

Performance metrics (`sms.send_duration_ms`, `sms.sent`, `sms.failed`, `sms.retry`, `sms.enqueued`) are emitted via the existing `createCounterMetric` / `measureAsync` infrastructure.

---

## API Reference

### `GET /api/sms/logs`

Query aggregated SMS logs.

| Query param | Default | Description |
|-------------|---------|-------------|
| `action` | `query` | `query` \| `metrics` \| `failed` \| `anomalies` \| `store-stats` \| `export` |
| `level` | — | Filter by log level (`info`, `warn`, `error`) |
| `provider` | — | Filter by provider |
| `eventType` | — | Filter by event type |
| `status` | — | Filter by delivery status |
| `since` | — | Unix timestamp (ms) lower bound |
| `limit` | `100` | Max records returned |
| `offset` | `0` | Pagination offset |
| `timeRangeMs` | `86400000` | Time window for `metrics` action (ms) |
| `format` | `json` | `json` \| `csv` for `export` action |

**Examples:**

```
GET /api/sms/logs?action=metrics
GET /api/sms/logs?action=failed&limit=50
GET /api/sms/logs?action=anomalies
GET /api/sms/logs?action=export&format=csv
GET /api/sms/logs?status=failed&provider=twilio
```

### `POST /api/sms/send`

Send an SMS event.

```json
{
  "eventType": "verification-code",
  "phoneNumber": { "countryCode": "1", "number": "5551234567" },
  "name": "Alice",
  "data": {
    "code": "123456",
    "expiresInMinutes": 10
  }
}
```

Supported `eventType` values: `verification-code`, `security-alert`, `course-enrollment`, `account-warning`.

---

## Usage in Code

```ts
import { smsService } from '@/lib/sms';

// Send a verification code
await smsService.sendVerificationCode({
  phoneNumber: { countryCode: '1', number: '5551234567' },
  name: 'Alice',
  code: '123456',
  expiresInMinutes: 10,
});

// Multi-channel via NotificationService
import { notificationService } from '@/services/notifications';

await notificationService.sendSecurityAlertMultiChannel(
  { email: 'alice@example.com', name: 'Alice', device: 'iPhone', timestamp: '...' },
  { phoneNumber: { countryCode: '1', number: '5551234567' }, action: 'login' },
);
```

---

## Aggregation & Monitoring

```ts
import { SMSLogAggregator } from '@/lib/logging/sms-aggregator';

// 24-hour delivery metrics
const metrics = SMSLogAggregator.getMetrics();
// { totalMessages, successRate, errorRate, averageDeliveryTimeMs, byProvider, byEventType }

// Anomaly detection
const { slowDeliveries, highRetryAttempts, configurationErrors } =
  SMSLogAggregator.getAnomalies();

// Export for external systems
const csv = SMSLogAggregator.exportLogs('csv');
const json = SMSLogAggregator.exportLogs('json');

// Maintenance
SMSLogAggregator.clearOldLogs(30 * 24 * 60 * 60 * 1000); // 30 days
```

---

## Security Considerations

- Phone numbers are stored in E.164 format and only the last 4 digits should be displayed in UI.
- Message bodies are truncated to 100 characters in delivery logs to avoid storing sensitive content (e.g. OTP codes).
- Provider credentials are read from environment variables only — never hardcoded.
- The `/api/sms/logs` and `/api/sms/send` routes should be protected by authentication middleware before production deployment.

---

## Performance Impact

- Log writes are fire-and-forget (`void Promise.resolve(transport.write(record))`), matching the existing email logging pattern — no blocking of the send path.
- The in-memory aggregator caps at 5,000 SMS log entries; the general log transport caps at 500 entries.
- `measureAsync` wraps each provider call to track `sms.send_duration_ms` without adding overhead beyond a `Date.now()` pair.
