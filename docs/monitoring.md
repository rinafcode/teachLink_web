# Monitoring & Error Tracking

This document covers the two monitoring systems in TeachLink:

1. **System Health Dashboard** — real-time metrics for push notifications
2. **Error Tracking** — structured error capture, breadcrumbs, and reporting

---

## 1. System Health Dashboard

### Quick Start

1. Run `npm install` then `npm run dev`
2. Open `http://localhost:3000/system-health`
3. Click "Enable Notifications" and allow permission
4. Send a test message

### Features

- **System Health**: Real memory, CPU, uptime from Node.js
- **Notification Metrics**: Sent, Delivered, Clicked, Failed counts
- **Delivery Success Rate**: Visual progress bar
- **Event Logs**: Complete history with filters and export
- **Dark Mode**: Toggle light/dark themes
- **Auto-Refresh**: Updates every 5 seconds

### API Endpoints

- `GET /api/notifications/metrics` - System metrics
- `GET/POST/DELETE /api/notifications/track` - Event tracking
- `POST /api/notifications/send-notification` - Send test notifications

---

## 2. Error Tracking & Structured Logging

### Overview

TeachLink uses a three-layer error tracking system:

```
┌─────────────────────────────────────────────────────────┐
│  Public API (src/lib/errors/index.ts)                    │
│  Sentry-compatible: init, captureException,             │
│  captureMessage, addBreadcrumb, setUser, getBreadcrumbs   │
├─────────────────────────────────────────────────────────┤
│  ErrorReportingService (src/services/errorReporting.ts)  │
│  Singleton: breadcrumbs, session IDs, user identity,    │
│  dispatches to structured logger + /api/errors/report    │
├─────────────────────────────────────────────────────────┤
│  Structured Logging (src/lib/logging)                    │
│  Pino-based: PII redaction, correlation IDs,             │
│  multi-transport (in-memory, HTTP)                       │
└─────────────────────────────────────────────────────────┘
```

### Architecture

1. **Public API** (`src/lib/errors/index.ts`) — Application code calls
   `captureException()`, `captureMessage()`, `addBreadcrumb()`, `setUser()`,
   and `getBreadcrumbs()`. These mirror the Sentry SDK interface for easy
   future migration to `@sentry/nextjs`.

2. **ErrorReportingService** (`src/services/errorReporting.ts`) — A singleton
   that manages breadcrumbs (max 50), session IDs, user identity, and
   dispatches error reports to the structured logging system. In production,
   reports are also sent to `/api/errors/report` for server-side persistence
   with PII redaction and rate limiting.

3. **Structured Logging** (`src/lib/logging`) — A Pino-based logger with
   automatic PII redaction (passwords, tokens, emails, etc.), correlation ID
   propagation via `AsyncLocalStorage`, and multi-transport support
   (in-memory buffer for diagnostics, optional HTTP transport for log
   aggregation).

### Configuration

Set the following environment variables in `.env.local` or your deployment
platform:

| Variable                | Description                                              | Default     |
| ----------------------- | -------------------------------------------------------- | ----------- |
| `NEXT_PUBLIC_SENTRY_DSN`| Sentry DSN (client + server). Enables remote reporting.  | `undefined` |
| `SENTRY_DSN`            | Sentry DSN (server-only). Not exposed to the browser.    | `undefined` |
| `LOG_LEVEL`             | Minimum log level to emit.                               | `info`      |
| `NEXT_PUBLIC_LOG_LEVEL` | Client-side fallback log level.                          | `info`      |
| `LOG_AGGREGATION_URL`   | Optional HTTP endpoint for log aggregation.              | `undefined` |

When no DSN is configured, errors are still captured locally via the
structured logger and stored in the in-memory transport for diagnostics.

### Initialization

Error tracking is initialized automatically via Next.js instrumentation:

- **File**: `src/instrumentation.ts`
- **Config**: `next.config.ts` → `experimental.instrumentationHook: true`

The `register()` function runs once on the server at startup. It reads the
Sentry DSN from the environment and calls `init()` from `@/lib/errors`, which:

- Configures the `ErrorReportingService` with the DSN
- Sets up global `unhandledrejection` and `error` event listeners
- Logs a startup event to the structured logger

The `onError()` hook captures errors during server component rendering.

### Usage

#### Capturing exceptions

```typescript
import { captureException } from '@/lib/errors';

try {
  // risky operation
} catch (error) {
  captureException(error, {
    userId: 'usr_123',
    tags: { feature: 'billing' },
    extra: { orderId: 'ord_456' },
  });
}
```

#### Capturing messages

```typescript
import { captureMessage } from '@/lib/errors';

captureMessage('Payment retry threshold reached', {
  tags: { feature: 'payments' },
});
```

#### Adding breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/errors';

addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to checkout',
  data: { page: '/checkout' },
  level: 'info',
});
```

#### Setting user identity

```typescript
import { setUser } from '@/lib/errors';

// Attach user to subsequent error reports
setUser({ id: 'usr_123', email: 'user@example.com' });

// Clear user identity (e.g. on logout)
setUser(null);
```

#### Using the structured logger directly

```typescript
import { createLogger } from '@/lib/logging';

const logger = createLogger('courses.enrollment');

logger.info('Enrollment process initiated', {
  context: { userId: 'usr_123', courseId: 'crs_abc' },
});

logger.error('Enrollment failed', {
  context: { userId: 'usr_123', courseId: 'crs_abc' },
  error,
});
```

### Server-Side Error Reporting Endpoint

**Endpoint**: `POST /api/errors/report`

This endpoint receives client-side error reports from the
`ErrorReportingService.sendToServer()` method. It:

- Applies rate limiting (10 requests/minute per IP via the `REPORTING` tier)
- Scrubs PII fields (email, password, token, card, ssn, phone, etc.) before
  logging
- Logs the redacted report via the structured logger
- Returns `{ ok: true }` on success

### Error Boundaries

Error boundaries are wired to the error tracking system:

- **`src/app/error.tsx`** — Page-level error boundary. Uses
  `captureException()` and `addBreadcrumb()` from `@/lib/errors`.
- **`src/app/global-error.tsx`** — Root-level error boundary. Captures
  critical errors with digest information.
- **`src/components/errors/ErrorBoundarySystem.tsx`** — Reusable error
  boundary component for client-side React trees.

### Breadcrumbs

Breadcrumbs provide context for errors by recording user actions, navigation
events, and system events leading up to an error. The system maintains up to
50 breadcrumbs per session.

Breadcrumb categories used in the codebase:

| Category               | Source                          |
| ---------------------- | ------------------------------- |
| `exception`            | `captureException()` calls      |
| `message`              | `captureMessage()` calls        |
| `user`                 | `setUser()` calls               |
| `error.tsx`            | Page error boundary             |
| `global-error`         | Root error boundary             |
| `errorBoundary`        | `ErrorBoundarySystem` component |
| `globalError`          | Global JS error handler         |
| `unhandledRejection`   | Unhandled promise rejections    |
| `userAction`           | `reportUserAction()` calls      |
| `metric`               | `reportMetric()` calls          |

### Testing

Tests for the error tracking system are in:

- `src/lib/errors/__tests__/index.test.ts` — Public API tests
- `src/app/api/errors/report/__tests__/route.test.ts` — API endpoint tests

Run tests with:

```bash
pnpm test -- src/lib/errors
pnpm test -- src/app/api/errors
```

### Migration to Sentry

The public API in `src/lib/errors/index.ts` is designed to be a drop-in
replacement for the Sentry SDK. To migrate to `@sentry/nextjs`:

1. Install the SDK: `pnpm add @sentry/nextjs`
2. Replace the function bodies in `src/lib/errors/index.ts` with the
   corresponding Sentry SDK calls (`Sentry.init()`, `Sentry.captureException()`,
   etc.)
3. Remove the `ErrorReportingService` delegation layer
4. The `init()` function already accepts a DSN, which is what
   `Sentry.init()` expects

### PII Redaction Policy

The logging system automatically redacts sensitive fields from all log
records and error reports:

- `password`, `pwd`, `credentials`
- `secret`, `token`, `key`
- `authorization`, `auth`, `bearer`
- `email`, `phone`, `ssn`, `creditcard`, `card`, `cvv`

Bearer tokens inside string messages are also scanned and masked:

- Input: `"Received token: Bearer eyJhbGciOiJ..."`
- Output: `"Received token: Bearer [REDACTED]"`
