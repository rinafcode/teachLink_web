**Canary Release for Tip Receiving**

Summary
- **Purpose:** Enable percentage-based canary rollout for the Tip Receiving feature.
- **Mechanism:** Server-side feature flag evaluated per-request with deterministic user bucketing.

Configuration
- Set the rollout percentage via environment variable `TIP_RECEIVING_CANARY_PERCENT` (0-100).
- `NEXT_PUBLIC_TIP_RECEIVING_CANARY_PERCENT` is also respected for environments that surface public envs.

Rollout behavior
- Server evaluates the flag for each incoming request to `/api/tips`.
- A stable identifier is used for bucketing in this order:
  - `user-id` cookie
  - `x-user-id` request header
  - `anon-user-id` cookie (generated and set when missing)
- Deterministic DJB2 hash maps identifier into a 1..100 bucket; users in bucket <= percent are routed to canary.

Rollback
- To rollback, set `TIP_RECEIVING_CANARY_PERCENT=0` and reload configuration — no code change required.

Observability
- The server emits structured log lines for evaluation decisions:
  - event: `tip_canary_evaluation`
  - percent, bucket, enabled
- Integrate these logs with your metrics pipeline to produce counts of canary vs stable users.

Security
- The decision is done server-side — clients cannot flip the flag.
- The implementation avoids logging raw user identifiers; only bucket and percent are logged.

Testing
- Unit tests cover hashing, percent boundaries, deterministic bucketing and anon-id generation.
- Integration tests exercise the `/api/tips` route with canary enabled and disabled.

Operational notes
- The canary flag reads environment variables at runtime — ensure your deployment system can change env vars without a full redeploy when possible.
- For accurate bucketing of anonymous users, the `anon-user-id` cookie is set on first use.
