# Requirements Document

## Introduction

The current rate limiter in `src/lib/ratelimit.ts` uses a module-level in-memory `Map` as its counter store. In a multi-instance deployment (e.g., multiple Next.js server pods or Vercel edge nodes), each instance maintains independent counters, allowing a client to bypass the AUTH rate limit (5 req/min) by spreading requests across instances.

This feature replaces the single-instance in-memory store with a shared [Upstash Redis](https://upstash.com/) backend in production, while preserving the existing in-memory behavior for development and test environments. All 20+ `withRateLimit()` call sites must continue to work without modification — the change is a pure internal implementation swap.

## Glossary

- **RateLimiter**: The abstraction that performs counter reads and writes. Either `InMemoryRateLimiter` (dev/test) or `UpstashRateLimiter` (production).
- **InMemoryRateLimiter**: The existing `Map`-backed sliding window implementation used in development and test.
- **UpstashRateLimiter**: A Redis-backed sliding window implementation that uses Upstash REST API calls to maintain shared counters.
- **RateLimit_Store**: The backing storage for rate-limit counters (either the in-memory `Map` or the Upstash Redis instance).
- **Sliding_Window**: The rate-limiting algorithm that counts requests within a rolling time window and resets the counter after `windowMs` milliseconds.
- **Tier**: A named rate-limit configuration (`AUTH`, `WRITE`, `READ`) with a `limit` and `windowMs`.
- **Identifier**: A string key combining client IP and tier (e.g., `"1.2.3.4:AUTH"`) used to namespace counters in the RateLimit_Store.
- **UPSTASH_REDIS_REST_URL**: Environment variable holding the Upstash Redis REST endpoint URL.
- **UPSTASH_REDIS_REST_TOKEN**: Environment variable holding the Upstash Redis REST API token.
- **NODE_ENV**: Node.js environment variable (`"production"`, `"development"`, or `"test"`).

---

## Requirements

### Requirement 1: Shared Counter Backend in Production

**User Story:** As a platform operator, I want rate-limit counters to be stored in a shared Redis backend in production, so that rate limits are enforced consistently across all server instances and edge nodes.

#### Acceptance Criteria

1. WHEN `NODE_ENV` is `"production"` AND `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, THE `RateLimiter` SHALL use the `UpstashRateLimiter` as its `RateLimit_Store`.
2. WHEN the `UpstashRateLimiter` is active, THE `RateLimiter` SHALL increment and read counters via the Upstash Redis REST API for every call to `slidingWindowRateLimit`.
3. WHEN two separate server instances call `slidingWindowRateLimit` with the same `Identifier`, THE `UpstashRateLimiter` SHALL reflect a combined request count that is the sum of both instances' requests within the same `Sliding_Window`.
4. WHEN a client's combined request count across all instances reaches the configured `limit` for a `Tier`, THE `RateLimiter` SHALL return `success: false` for subsequent requests within the same `Sliding_Window`.

---

### Requirement 2: In-Memory Fallback for Development and Test

**User Story:** As a developer, I want the rate limiter to work without Redis configured in development and test, so that local development and CI test runs are not blocked by external service dependencies.

#### Acceptance Criteria

1. WHEN `NODE_ENV` is `"development"` OR `NODE_ENV` is `"test"`, THE `RateLimiter` SHALL use the `InMemoryRateLimiter` as its `RateLimit_Store`, regardless of whether Upstash environment variables are set.
2. WHEN `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is absent AND `NODE_ENV` is `"production"`, THE `RateLimiter` SHALL fall back to the `InMemoryRateLimiter` and log a warning at startup indicating that distributed rate limiting is disabled.
3. WHILE the `InMemoryRateLimiter` is active, THE `RateLimiter` SHALL preserve all existing `Sliding_Window` semantics: allowing requests up to `limit`, blocking further requests until `windowMs` elapses, and returning correct `remaining` and `reset` values. THE `remaining` value SHALL reflect `limit - count` and MAY exceed the configured `limit` in edge cases where the `limit` is dynamically reduced after counters are initialized.

---

### Requirement 3: Backward-Compatible Public API

**User Story:** As a developer maintaining route handlers, I want the `withRateLimit()` function signature and return shape to remain unchanged, so that no call sites require modification after the refactor.

#### Acceptance Criteria

1. THE `RateLimiter` SHALL export `withRateLimit(request, tier)` with the same signature: accepting a `Request` and a `RateLimitTier`, returning `{ addHeaders, rateLimitResponse }`.
2. THE `RateLimiter` SHALL export `slidingWindowRateLimit(identifier, config)` with the same signature: accepting a `string` and `RateLimitConfig`, returning `RateLimitResult`.
3. THE `RateLimiter` SHALL export `RATE_LIMIT_TIERS`, `RateLimitTier`, `RateLimitConfig`, `RateLimitResult`, `RateLimitInfo`, and `createRateLimitResponse` with unchanged types and values.
4. WHEN `withRateLimit` is called from any existing route handler, THE `RateLimiter` SHALL return a `rateLimitResponse` of `null` for allowed requests and a `NextResponse` with status `429` for blocked requests, identical to the current behavior. THE `RateLimiter` SHALL never return a non-null `rateLimitResponse` for a request that was allowed by the `RateLimit_Store`.

---

### Requirement 4: Sliding Window Algorithm Correctness

**User Story:** As a platform operator, I want the sliding window algorithm to behave identically whether backed by in-memory or Upstash storage, so that rate-limit decisions are consistent and predictable.

#### Acceptance Criteria

1. WHEN a new `Identifier` is first seen within a `Sliding_Window`, THE `RateLimiter` SHALL initialize a counter at `1` and set `resetAt` to `now + windowMs`.
2. WHEN an existing `Identifier`'s counter is below `limit`, THE `RateLimiter` SHALL increment the counter by `1` and return `success: true` with `remaining` equal to `limit - count`.
3. WHEN an existing `Identifier`'s counter equals or exceeds `limit`, THE `RateLimiter` SHALL return `success: false` with `remaining` equal to `0` and `retryAfter` equal to the ceiling of `(resetAt - now) / 1000` seconds.
4. WHEN the current time exceeds `resetAt` for an `Identifier`, THE `RateLimiter` SHALL reset the counter to `1` and set a new `resetAt` to `now + windowMs`, treating the request as the first in a new window.
5. FOR ALL valid `(identifier, config)` pairs, the sequence `[allow × limit, block × 1, advance time by windowMs, allow × 1]` SHALL hold for both `InMemoryRateLimiter` and `UpstashRateLimiter` implementations.

---

### Requirement 5: AUTH Tier Bypass Prevention

**User Story:** As a security engineer, I want the AUTH rate limit (5 req/min) to be enforced globally, so that an attacker cannot bypass it by distributing requests across multiple server instances.

#### Acceptance Criteria

1. WHEN `NODE_ENV` is `"production"` AND Upstash credentials are configured, THE `UpstashRateLimiter` SHALL enforce the `AUTH` tier limit of `5` requests per `60,000 ms` window as a single shared counter across all instances.
2. WHEN the shared request count across all instances reaches exactly the `AUTH` tier `limit` of `5` within the same `Sliding_Window`, THE `UpstashRateLimiter` SHALL block the request that reaches the limit and all subsequent requests with `success: false`, without permitting an additional request beyond the limit.
3. IF the Upstash REST API call fails during an AUTH tier check, THEN THE `RateLimiter` SHALL fail open (allow the request) and log the error, to prevent service disruption due to Redis unavailability.

---

### Requirement 6: Upstash Package and Environment Configuration

**User Story:** As a developer onboarding to the project, I want all required packages installed and environment variables documented, so that I can configure distributed rate limiting without guessing at dependencies or config keys.

#### Acceptance Criteria

1. THE project SHALL declare `@upstash/ratelimit` and `@upstash/redis` as production dependencies in `package.json`.
2. THE `.env.example` file SHALL document `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` with placeholder values and a comment explaining their purpose.
3. WHEN `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` contains an invalid value at startup in production, THE `RateLimiter` SHALL log a descriptive error, fall back to `InMemoryRateLimiter` immediately, and prevent any attempt to initialize the `UpstashRateLimiter` for the remainder of the process lifetime.

---

### Requirement 7: Existing Tests Pass with In-Memory Backend

**User Story:** As a developer, I want the existing rate-limit test suite in `src/app/api/tutorials/__tests__/ratelimit.test.ts` to continue passing after the refactor, so that the behavioral contract of `slidingWindowRateLimit` and `withRateLimit` is preserved.

#### Acceptance Criteria

1. WHEN the test suite runs with `NODE_ENV` set to `"test"`, THE `RateLimiter` SHALL use the `InMemoryRateLimiter` so that no Upstash credentials or network calls are required.
2. THE `InMemoryRateLimiter` SHALL pass all existing test cases for `slidingWindowRateLimit`, including: allowing requests within the limit, blocking requests that exceed the limit, resetting the window after `windowMs` elapses, and returning correct `remaining` counts.
3. THE `InMemoryRateLimiter` SHALL pass all existing test cases for `withRateLimit`, including: `READ` and `WRITE` tier enforcement, independent tracking per IP and tier, and `addHeaders` injecting correct `X-RateLimit-*` headers.
4. WHEN `vi.useFakeTimers()` is active in a test, THE `InMemoryRateLimiter` SHOULD respect the mocked `Date.now()` value so that time-advance tests (`vi.advanceTimersByTime`) behave as expected. IF the limiter uses real time, time-advance tests SHALL still pass by relying on sufficiently long real time elapsed or by configuring real window durations.
