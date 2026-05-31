# Logging Service & Standards

This directory contains the standardized, structured, context-aware logging system. It is built on top of [Pino](https://getpino.io/) to ensure high performance and structured JSON formatting.

## Features

1. **Structured Logging**: All logs are emitted as clean, indexable JSON records.
2. **Standard Log Levels**: Explicitly defined `debug`, `info`, `warn`, and `error` methods.
3. **Correlation ID Auto-Propagation**: Seamless propagation of transaction/request correlation IDs through asynchronous boundaries using Node.js's native `AsyncLocalStorage`.
4. **Sensitive Data Redaction (PII/Secrets)**: Bulletproof automated sanitization of sensitive keywords (e.g. passwords, API keys, tokens, emails, authorization headers) from log messages, base context, payloads, and error outputs before any print or transport writes occur.
5. **Multi-Transport support**: Writes logs locally to standard stream outputs via Pino, keeps a transient buffer in-memory for testing/debugging (`InMemoryLogTransport`), and pushes logs upstream to central logging collectors if configured (`HttpLogTransport`).

---

## Log Levels & Standards

Use the appropriate log level depending on the situation:

| Level | Purpose | Example |
|---|---|---|
| `debug` | Verbose diagnostic information during development or troubleshooting. Disabled in production. | `logger.debug('Parsing payload cache', { context: { size } })` |
| `info` | Normal operational events tracking milestone actions in the app lifecycle. | `logger.info('User successfully enrolled in course', { context: { userId, courseId } })` |
| `warn` | Non-fatal anomalies or degradation of non-core functionality. Needs investigation but doesn't halt operation. | `logger.warn('Stripe checkout session creation delayed', { context: { attempt: 2 } })` |
| `error` | Operations that failed, threw uncaught errors, or caused a crash/partial failure. | `logger.error('Failed to execute database migration', { error: err })` |

---

## Logger Configuration

The logger is configured using the following environment variables:

| Variable | Description | Default | Values |
|---|---|---|---|
| `LOG_LEVEL` | Minimum level of log records to emit. | `info` | `debug`, `info`, `warn`, `error` |
| `NEXT_PUBLIC_LOG_LEVEL` | Client-side fallback log level. | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_AGGREGATION_URL` | Optional API endpoint to send JSON logs to via POST requests. | `undefined` | Absolute HTTP URL |

---

## Usage Guide

### 1. Basic Usage

Import the global logger instance or create a scoped logger for a component:

```typescript
import { createLogger } from '@/lib/logging';

const log = createLogger('courses.enrollment');

// Basic string log
log.info('Enrollment process initiated');

// Log with context payload and error
try {
  // logic...
} catch (error) {
  log.error('Enrollment operation failed', {
    context: { userId: 'usr_123', courseId: 'crs_abc' },
    error,
  });
}
```

### 2. Automatic Correlation & AsyncContext Propagation

The logger utilizes `AsyncLocalStorage` to tie request tracking metadata together. When wrapping request/job executions in `runWithLogContext`, any logger call executed anywhere inside that thread (even deep in helper functions or async callbacks) will automatically carry the correct `requestId` and `correlationId`.

#### Middleware integration:
```typescript
import { runWithLogContext } from '@/lib/logging';

export async function handleUserJob(jobId: string, correlationId: string) {
  return await runWithLogContext({ requestId: jobId, correlationId }, async () => {
    // Both of these logs automatically carry the correlationId & requestId
    logger.info('Processing task step 1');
    
    await performSubtask();
  });
}

async function performSubtask() {
  // No need to manually pass requestId or correlationId down!
  logger.info('Subtask execution in progress');
}
```

### 3. Sensitive Data Redaction Policy

To prevent compliance risks and security issues, the logging service automatically filters out sensitive information. Any log message or payload context property containing keys resembling credentials, keys, or personal identifiers will have their values replaced with `[REDACTED]`.

Redacted keys include:
- `password`, `pwd`, `credentials`
- `secret`, `token`, `key`
- `authorization`, `auth`, `bearer`
- `email`, `phone`, `ssn`, `creditcard`, `card`, `cvv`

Bearer tokens inside string messages are also scanned and masked automatically:
- Message: `"Received token: Bearer eyJhbGciOiJ..."`
- Redacted output: `"Received token: Bearer [REDACTED]"`
