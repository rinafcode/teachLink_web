# Implementation Plan

## Overview

Refactor `src/lib/ratelimit.ts` to support a shared Upstash Redis backend in production while keeping the existing in-memory behaviour in dev/test. The work proceeds in eight ordered steps: install dependencies, document configuration, extract the in-memory store, add the Upstash store, wire up the factory and the new async function, migrate all 25 call sites, verify existing tests, and add new distributed tests.

## Tasks

- [ ] 1. Install Upstash packages
     Add `@upstash/ratelimit@^1.2.0` and `@upstash/redis@^1.34.0` to the `dependencies` section of `package.json`, then run `pnpm install` to lock the versions. These packages provide the SlidingWindow algorithm and the HTTP-based Redis client needed by `UpstashStore`.
     **Acceptance**: `pnpm install` completes without errors; both packages appear in `package.json` dependencies and in `pnpm-lock.yaml` at the pinned minor versions.
     **Files**: `package.json`

- [ ] 2. Document env vars in .env.example
     Add a `# Rate Limiting (Distributed)` section near the bottom of `.env.example` with two entries: `UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>.upstash.io` and `UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>`, each preceded by a comment explaining its purpose. Do not add real credentials.
     **Acceptance**: `.env.example` contains the new section with both placeholder vars and explanatory comments; existing entries are unchanged.
     **Files**: `.env.example`

- [ ] 3. Define IRateLimiterStore interface and InMemoryStore
     In `src/lib/ratelimit.ts`, introduce the `IRateLimiterStore` interface with a single method `check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>`. Extract the existing per-IP `Map` tracking logic into a new `InMemoryStore` class that implements this interface (the store remains synchronous internally but wraps results in `Promise.resolve`). Keep all existing exports — `withRateLimit`, `getClientIP`, `createRateLimitResponse`, `RATE_LIMIT_TIERS` — fully intact and behaviourally identical. Export `resetStoreForTesting()` which clears the in-memory map; this replaces any ad-hoc reset pattern in tests.
     **Acceptance**: `pnpm test -- src/app/api/tutorials/__tests__/ratelimit.test.ts` passes without modification; TypeScript compiles with no new errors; `InMemoryStore` and `IRateLimiterStore` are exported from the module.
     **Files**: `src/lib/ratelimit.ts`

- [ ] 4. Implement UpstashStore
     Add an `UpstashStore` class to `src/lib/ratelimit.ts` that implements `IRateLimiterStore`. Internally it creates a `@upstash/redis` `Redis` client from `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. It caches one `@upstash/ratelimit` `Ratelimit` instance per `(limit, windowMs)` pair using a `Map<string, Ratelimit>` keyed on `"${limit}:${windowMs}"`, so instances are reused across requests. The `check()` method calls `ratelimit.limit(identifier)`, maps the result to `RateLimitResult`, and wraps the entire call in a `try/catch`: on any error it calls `console.error` with the error and returns `{ success: true, limit: config.limit, remaining: config.limit, reset: Date.now() + config.windowMs }` (fail-open).
     **Acceptance**: Unit tests (added in task 8) confirm that a simulated Redis error causes `check()` to return `success: true`; TypeScript compiles cleanly.
     **Files**: `src/lib/ratelimit.ts`

- [ ] 5. Implement createStore() factory and withRateLimitAsync()
     Add a `createStore()` function that runs at module initialisation (not per-request). It reads `process.env.NODE_ENV`, `process.env.UPSTASH_REDIS_REST_URL`, and `process.env.UPSTASH_REDIS_REST_TOKEN`. If `NODE_ENV === 'production'` and both env vars are present, it returns a new `UpstashStore`; otherwise it returns a new `InMemoryStore`. If `NODE_ENV === 'production'` but either env var is missing, it also emits `console.warn('Distributed rate limiting is disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. Falling back to in-memory store.')` before returning `InMemoryStore`. Assign the result to a module-level `const activeStore`. Then add `export async function withRateLimitAsync(request: Request, tier: RateLimitTier)` which resolves the client IP, calls `activeStore.check(ip, RATE_LIMIT_TIERS[tier])`, and returns the same `{ addHeaders, rateLimitResponse }` shape as `withRateLimit`.
     **Acceptance**: Calling `withRateLimitAsync` in a test with `NODE_ENV=test` returns an `InMemoryStore`-backed result; TypeScript compiles cleanly; the `console.warn` fires when env vars are absent in production mode.
     **Files**: `src/lib/ratelimit.ts`

- [ ] 6. Migrate route call sites to withRateLimitAsync()
     Update every route file listed below to: (1) add `withRateLimitAsync` to the existing `@/lib/ratelimit` import, (2) replace each `withRateLimit(request, tier)` call with `await withRateLimitAsync(request, tier)`, and (3) ensure the handler function is `async` (most already are). The synchronous `withRateLimit` import may be removed from each file once all call sites in that file are migrated.

  Files to migrate:

  - `src/app/api/user/progress/route.ts`
  - `src/app/api/user/settings/route.ts`
  - `src/app/api/video-analytics/route.ts`
  - `src/app/api/admin/feature-flags/[id]/route.ts`
  - `src/app/api/admin/feature-flags/route.ts`
  - `src/app/api/admin/feature-flags/evaluate/route.ts`
  - `src/app/api/admin/feature-flags/audit/route.ts`
  - `src/app/api/admin/audit/route.ts`
  - `src/app/api/tutorials/route.ts`
  - `src/app/api/tutorials/[id]/route.ts`
  - `src/app/api/tutorials/[id]/progress/route.ts`
  - `src/app/api/referral/validate/route.ts`
  - `src/app/api/v1/tickets/route.ts`
  - `src/app/api/v1/tickets/[id]/route.ts`
  - `src/app/api/v1/consent/route.ts`
  - `src/app/api/notes/route.ts`
  - `src/app/api/bookmarks/route.ts`
  - `src/app/api/courses/route.ts`
  - `src/app/api/courses/[id]/route.ts`
  - `src/app/api/courses/[id]/lessons/route.ts`
  - `src/app/api/lessons/[id]/progress/route.ts`
  - `src/app/api/auth/discord/route.ts`
  - `src/app/api/auth/discord/callback/route.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/signup/route.ts`

  **Acceptance**: TypeScript compiles with no errors across all migrated files; no remaining `withRateLimit(` call (without the `Async` suffix) exists in any of the above files; `pnpm build` succeeds.
  **Files**: All 25 route files listed above.

- [ ] 7. Verify existing tests pass
     Run the existing rate limit test suite without modifying any test file. This confirms that the `withRateLimit` synchronous path and `InMemoryStore` extraction did not regress any existing behaviour.
     **Acceptance**: `pnpm test -- src/app/api/tutorials/__tests__/ratelimit.test.ts` exits with code 0 and all test cases pass.
     **Files**: _(no changes — read-only verification step)_

- [ ] 8. Add tests for withRateLimitAsync and UpstashStore
     Create `src/lib/__tests__/ratelimit-distributed.test.ts` with the following test cases:
  1. **InMemoryStore fallback in dev/test** — with `NODE_ENV=test`, `withRateLimitAsync` resolves without error and returns `rateLimitResponse: null` under the limit.
  1. **UpstashStore used in production** — mock `process.env.NODE_ENV='production'` and both Upstash env vars; spy on `UpstashStore.prototype.check` and verify it is called by `withRateLimitAsync`.
  1. **Fail-open on Redis error** — mock `UpstashStore.prototype.check` to throw; verify `withRateLimitAsync` still returns `rateLimitResponse: null` (request is allowed through).
  1. **console.warn on missing prod env vars** — set `NODE_ENV=production` and omit the Upstash vars; spy on `console.warn` and verify the warning message is emitted at module init.
  1. **resetStoreForTesting() clears state** — exhaust the in-memory limit for an IP, call `resetStoreForTesting()`, then confirm the next request is allowed.
     **Acceptance**: `pnpm test -- src/lib/__tests__/ratelimit-distributed.test.ts` exits with code 0 and all five test cases pass.
     **Files**: `src/lib/__tests__/ratelimit-distributed.test.ts`

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1. Install Upstash packages", "2. Document env vars in .env.example"]
    },
    {
      "wave": 2,
      "tasks": ["3. Define IRateLimiterStore interface and InMemoryStore"]
    },
    {
      "wave": 3,
      "tasks": ["4. Implement UpstashStore"]
    },
    {
      "wave": 4,
      "tasks": ["5. Implement createStore() factory and withRateLimitAsync()"]
    },
    {
      "wave": 5,
      "tasks": [
        "6. Migrate route call sites to withRateLimitAsync()",
        "7. Verify existing tests pass",
        "8. Add tests for withRateLimitAsync and UpstashStore"
      ]
    }
  ]
}
```

## Notes

- `withRateLimit()` must remain synchronous and unchanged throughout — it is the safety net for any call site not yet migrated and is relied upon by existing tests.
- The `UpstashStore` is never instantiated in test or dev environments; the `createStore()` factory guarantees this. Tests that need to exercise `UpstashStore` directly must mock it.
- Task 6 lists 25 files discovered via grep at spec-authoring time. Run `grep -r 'withRateLimit(' src/app/api --include='*.ts' -l` before starting that task to catch any new files added since.
- The fail-open contract (`success: true` on any Redis error) is a deliberate trade-off: availability over strict rate enforcement. Document this in a code comment above `UpstashStore.check()`.
- `resetStoreForTesting()` should only be called from test code. Consider adding a runtime guard (`if (process.env.NODE_ENV === 'production') throw new Error(...)`) to prevent accidental misuse.
