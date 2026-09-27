# Content Security Policy

Every response carries a strict, nonce-based Content-Security-Policy. `'unsafe-inline'` is never
emitted — inline `<script>`/`<style>` only executes when it carries the nonce minted for that
request.

## Request flow

1. `src/middleware.ts` mints a nonce per request with `generateNonce()` — 16 cryptographically
   random bytes, base64 encoded. A nonce is never reused across responses.
2. `attachCspRequestHeaders()` puts the nonce on the request as `x-csp-nonce` and adds the policy as
   a `Content-Security-Policy` request header. Next.js reads the nonce out of that header and stamps
   it onto the scripts it injects.
3. The request headers are forwarded to the app with `NextResponse.next({ request: { headers } })`,
   so a server component can read the nonce:

   ```ts
   import { headers } from 'next/headers';

   const nonce = (await headers()).get('x-csp-nonce') ?? undefined;
   return <Script nonce={nonce} id="analytics" />;
   ```

4. `applySecurityHeaders()` (`src/middleware/security.ts`) emits the transport headers together with
   the CSP built from that same nonce, and `applyCspHeaders()` (`src/middleware/csp.ts`) sets the
   response policy plus the `x-nonce` response header. Both resolve the nonce from the argument, then
   the request header, so no layer can disagree about the value.

## Policy

| Directive                  | Value                                  |
| :------------------------- | :------------------------------------- |
| `default-src`              | `'self'`                               |
| `script-src`               | `'self' 'nonce-<per-request>'`         |
| `style-src`                | `'self' 'nonce-<per-request>'`         |
| `object-src`               | `'none'`                               |
| `base-uri`, `form-action`  | `'self'`                               |
| `frame-ancestors`          | `'none'`                               |
| `report-uri` / `report-to` | `/api/security/reporting` / `security` |

`buildCspHeader({ nonce, strict: false })` relaxes the policy with `'unsafe-eval'` for the dev
bundler only; `'unsafe-inline'` is not emitted in either mode, and strict mode throws if an unsafe
source ever reaches the header. `containsUnsafeSources()` is exported so a caller can assert the same
guarantee.

## Adding inline script or style

Do not add `'unsafe-inline'`. Either move the code into a module under `'self'`, or pass the
request nonce to the tag that needs it (step 3 above). Third-party embeds need their origin added to
the relevant directive in `buildCspHeader()`.

## Tests

- `src/middleware/__tests__/csp.test.ts` — nonce entropy and uniqueness, policy contents, nonce
  resolution order
- `src/middleware/__tests__/security.test.ts` — security headers, HSTS, and the CSP they carry
