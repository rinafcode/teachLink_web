# Distributed Rate Limiting — Technical Design

## 1. Overview

The current rate limiter (`src/lib/ratelimit.ts`) uses an in-process `Map` for state. This works fine for a single server but breaks in distributed deployments: each instance maintains its own counter, so a client can exceed the intended limit by hitting different pods.

The solution uses a **strategy pattern**: introduce an `IRateLimiterStore` interface with two implementations — `InMemoryStore` (the existing Map logic, unchanged) and `UpstashStore` (backed by Upstash Redis using the `@upstash/ratelimit` SDK). A `createStore()` factory selects the right implementation at module load time based on environment variables.

To maintain full backward compatibility with the 20+ existing call sites, `withRateLimit` stays synchronous and in-memory-backed. A new `withRateLimitAsync` function provides the distributed-capable, async-first API that route handlers can be incrementally migrated to.

---

## 2. Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ratelimit.ts                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              IRateLimiterStore (interface)            │   │
│  │  check(identifier, config): Promise<RateLimitResult> │   │
│  └──────────────┬──────────────────────┬────────────────┘   │
│                 │                      │                     │
│  ┌──────────────▼──────┐  ┌────────────▼──────────────┐     │
│  │   InMemoryStore     │  │       UpstashStore         │     │
│  │  (synchronous Map)  │  │  (@upstash/ratelimit SDK)  │     │
│  │  used in dev/test   │  │  used in production when   │     │
│  │  + prod fallback    │  │  env vars are present      │     │
│  └─────────────────────┘  └───────────────────────────-┘     │
│                 ▲                      ▲                     │
│                 └──────────┬───────────┘                     │
│                    ┌───────▼────────┐                        │
│                    │ createStore()  │ ← reads env vars once  │
│                    │   factory      │   at module init       │
│                    └───────┬────────┘                        │
│                            │                                 │
│              const store = createStore()  (module-level)    │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────────┐  │
│  │  slidingWindowRateLimit(identifier, config)            │  │
│  │  → delegates to store.check() (sync path via InMemory) │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  withRateLimit(request, tier)        ← UNCHANGED     │   │
│  │  synchronous | InMemoryStore only | 20+ call sites   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  withRateLimitAsync(request, tier)   ← NEW           │   │
│  │  async | active store (Upstash in prod)              │   │
│  │  route handlers migrate to this incrementally        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Store Selection Logic (`createStore`)

```
NODE_ENV === 'test'
  → InMemoryStore (always)

NODE_ENV === 'development'
  → InMemoryStore (always)

NODE_ENV === 'production'
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN present?
    → UpstashStore
  else
    → InMemoryStore (with console.warn logged once at startup)
```

---

## 3. Key Design Decisions

### 3.1 Dual-function API (withRateLimit + withRateLimitAsync)

Making `withRateLimit` async would silently break all 20+ call sites — the function would return a `Promise` instead of `{ addHeaders, rateLimitResponse }`, so `if (rateLimitResponse)` would always be truthy and rate limiting would stop working entirely with no compile error. That's an unacceptable silent failure.

The chosen approach:

- `withRateLimit` remains **synchronous**, backed exclusively by `InMemoryStore`. No call site changes needed.
- `withRateLimitAsync` is the new **async** function backed by the active store (Upstash in production, InMemory in dev/test). Route handlers migrate to it incrementally by adding `await` and updating the import.

This allows zero-downtime rollout: deploy the new code, then migrate route handlers one by one, verify each, and eventually deprecate `withRateLimit`.

### 3.2 Store instantiated once at module init

`createStore()` is called once at the top level (`const store = createStore()`), not per request. This:

- Avoids re-reading `process.env` on every request (negligible cost, but good practice)
- Ensures Upstash `Ratelimit` instances are created once and cached
- Makes the store selection decision visible at startup (a startup log or warning can be emitted)

### 3.3 Upstash Ratelimit instance caching

The `@upstash/ratelimit` library creates a `Ratelimit` instance per (limit, windowMs) pair. Creating one per request would be wasteful. `UpstashStore` caches instances in an internal `Map<string, Ratelimit>` keyed on `"${limit}:${windowMs}"`.

```typescript
// Key: "5:60000" for AUTH, "30:60000" for WRITE, "60:60000" for READ
private cache = new Map<string, Ratelimit>();
```

### 3.4 Fail-open on Redis error

Every call in `UpstashStore.check()` is wrapped in `try/catch`. On any Redis error:

1. `console.error('[UpstashStore] Redis error, failing open:', err)` is logged
2. A permissive result is returned: `{ success: true, remaining: config.limit - 1, reset: Date.now() + config.windowMs, limit: config.limit }`

This satisfies R5: AUTH tier (5/min) is enforced globally when Redis is healthy; the system fails open (allows the request) rather than taking the service down when Redis is unavailable.

### 3.5 Sliding window algorithm consistency (R4)

- `InMemoryStore` preserves the existing `slidingWindowRateLimit` Map logic exactly — no algorithm changes.
- `UpstashStore` uses `Ratelimit.slidingWindow(limit, duration)` from `@upstash/ratelimit`, which implements the same sliding window semantics server-side in Redis.

### 3.6 Test isolation

`InMemoryStore` uses a module-level `Map`. To prevent state leakage between tests, a `resetStoreForTesting()` function is exported. Test suites call it in `beforeEach`:

```typescript
// In test files:
import { resetStoreForTesting } from '@/lib/ratelimit';
beforeEach(() => resetStoreForTesting());
```

`vi.useFakeTimers()` continues to work because `InMemoryStore` uses `Date.now()` directly, which Vitest's fake timer intercepts.

---

## 4. File Changes

| File                      | Change                | Reason                                                                                                                                       |
| ------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ratelimit.ts`    | Full rewrite          | Add `IRateLimiterStore`, `InMemoryStore`, `UpstashStore`, `createStore()` factory; add `withRateLimitAsync`; export `resetStoreForTesting()` |
| `package.json`            | Add two dependencies  | `@upstash/ratelimit` and `@upstash/redis`                                                                                                    |
| `.env.example`            | Add two env vars      | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` with documentation                                                                   |
| Route handler files (20+) | Optional, incremental | Replace `withRateLimit` → `withRateLimitAsync` + `await` as teams migrate                                                                    |

No route file changes are required for the initial delivery. Existing call sites continue to use `withRateLimit` unchanged.

---

## 5. Data Models / Interfaces

### IRateLimiterStore

```typescript
interface IRateLimiterStore {
  /**
   * Check and increment the rate limit counter for the given identifier.
   * Implementations may be synchronous (InMemory) or async (Upstash).
   */
  check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>;
}
```

### Updated withRateLimit (unchanged signature)

```typescript
// Synchronous — backed by InMemoryStore only.
// Existing 20+ call sites continue to work with zero changes.
export function withRateLimit<T extends Request>(
  request: T,
  tier: RateLimitTier,
): {
  addHeaders: <U>(response: Response | NextResponse<U>) => NextResponse<U>;
  rateLimitResponse: NextResponse | null;
};
```

### New withRateLimitAsync

```typescript
// Async — backed by the active store (Upstash in prod, InMemory in dev/test).
// Route handlers migrate to this incrementally.
export async function withRateLimitAsync<T extends Request>(
  request: T,
  tier: RateLimitTier,
): Promise<{
  addHeaders: <U>(response: Response | NextResponse<U>) => NextResponse<U>;
  rateLimitResponse: NextResponse | null;
}>;
```

### InMemoryStore (internal)

```typescript
class InMemoryStore implements IRateLimiterStore {
  private entries = new Map<string, { count: number; resetAt: number }>();

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    // Existing sliding window logic, migrated from module-level function.
    // Uses Date.now() — compatible with vi.useFakeTimers().
  }

  reset(): void {
    this.entries.clear();
  }
}
```

### UpstashStore (internal)

```typescript
class UpstashStore implements IRateLimiterStore {
  private redis: Redis;
  private cache = new Map<string, Ratelimit>();

  constructor() {
    this.redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
  }

  private getInstance(config: RateLimitConfig): Ratelimit {
    const key = `${config.limit}:${config.windowMs}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs / 1000} s`),
        }),
      );
    }
    return this.cache.get(key)!;
  }

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const ratelimit = this.getInstance(config);
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        limit: config.limit,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (err) {
      console.error('[UpstashStore] Redis error, failing open:', err);
      return {
        success: true,
        remaining: config.limit - 1,
        reset: Date.now() + config.windowMs,
        limit: config.limit,
      };
    }
  }
}
```

### createStore factory

```typescript
function createStore(): IRateLimiterStore {
  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new UpstashStore();
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[ratelimit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. ' +
        'Falling back to in-memory rate limiting — counters are NOT shared across instances.',
    );
  }

  return new InMemoryStore();
}

const store = createStore(); // executed once at module load
```

---

## 6. Environment Variables

Add the following to `.env.example`:

```dotenv
# Distributed Rate Limiting (Upstash Redis)
# When both vars are set in production, rate limit counters are shared across
# all server instances, enabling accurate global enforcement of per-tier limits.
# If either var is missing, the system falls back to per-instance in-memory counters
# and logs a warning at startup.
#
# Obtain these values from your Upstash Redis database dashboard:
# https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

These variables are read exclusively by `UpstashStore` via `Redis.fromEnv()` from `@upstash/redis`. They are never exposed to the browser (no `NEXT_PUBLIC_` prefix).

| Variable                   | Required        | Description                                       |
| -------------------------- | --------------- | ------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Production only | REST endpoint URL for your Upstash Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | Production only | Bearer token for authenticating with the REST API |

---

## 7. Backward Compatibility

### Existing call sites — zero changes required

All 20+ existing call sites follow this pattern:

```typescript
const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
if (rateLimitResponse) return rateLimitResponse;
// ... handler logic ...
return addHeaders(successResponse);
```

`withRateLimit` remains synchronous and its signature is unchanged. These call sites continue to work without modification. Rate limiting in this path uses the `InMemoryStore`, providing the same per-instance behavior as today.

### Migrating call sites to distributed limiting (incremental)

To enable distributed rate limiting for a route, change the call site from:

```typescript
// Before
const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
```

to:

```typescript
// After — route handler must already be async (Next.js route handlers always are)
const { addHeaders, rateLimitResponse } = await withRateLimitAsync(request, 'WRITE');
```

That is the only required change per call site. Because Next.js route handlers are `async` by convention, adding `await` is a one-line, safe, mechanical change.

### Migration strategy

1. Deploy the updated `ratelimit.ts` with Upstash env vars configured in production.
2. Migrate call sites in priority order: AUTH endpoints first (highest security value), then WRITE, then READ.
3. Verify each migrated endpoint with integration tests before proceeding.
4. Once all call sites are migrated, deprecate and eventually remove `withRateLimit`.

### Why not make withRateLimit async immediately?

Changing `withRateLimit` to return `Promise<...>` would cause `rateLimitResponse` to always be a resolved `Promise` object (truthy), meaning **every request would be rate-limited and blocked** — a silent, complete outage. TypeScript would not catch this without explicit `await`, and the pattern `if (rateLimitResponse)` would always pass. The dual-function approach avoids this failure mode entirely.

---

## 8. Dependencies

```jsonc
// package.json additions
{
  "dependencies": {
    "@upstash/redis": "^1.34.3", // HTTP-based Redis client for Upstash
    "@upstash/ratelimit": "^2.0.5" // Sliding window rate limiting on top of Upstash Redis
  }
}
```

Both packages use the Upstash REST API over HTTPS, making them compatible with serverless and edge environments (including Next.js API routes and middleware). No persistent TCP connections are required.
