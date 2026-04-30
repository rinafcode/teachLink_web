# API Versioning Policy

## Overview

This project uses URL-based API versioning to protect clients from breaking changes.

- Stable API paths continue to be served at `/api/v1/*`
- Legacy paths under `/api/*` remain supported through a compatibility layer
- Older `/api/*` requests are rewritten to `/api/v1/*` and receive deprecation headers

## Versioning strategy

- New API routes are published under `/api/v1/`
- Future versions should be added under `/api/v2/`, `/api/v3/`, etc.
- Path-based versioning is the primary version selection mechanism
- API clients should prefer explicit `/api/v1/...` paths when available

## Compatibility layer

The middleware rewrites legacy API requests from `/api/*` to `/api/v1/*`.
This ensures:

- existing clients continue working without immediate changes
- clients receive a deprecation warning via response headers
- the application can evolve without breaking older callers

## Deprecation warnings

Legacy requests receive the following headers:

- `X-Api-Version: v1`
- `X-Api-Deprecated: true`
- `X-Api-Deprecation-Info: ...`

Clients should log or monitor these headers and migrate to the versioned endpoint.

## Migration path

1. Update clients to call `/api/v1/...` explicitly.
2. Add `/api/v2/...` endpoints for new behavior.
3. Keep `/api/*` compatibility until all clients are migrated.
4. Remove legacy `/api/*` support only after a deprecation period and communication.

## Request handling

- `src/lib/api.ts` automatically prefixes internal API client URLs to `/api/v1/*`
- legacy URLs still work through middleware rewrite
- adding a new version requires `src/app/api/v2/*` route files and optional middleware support
