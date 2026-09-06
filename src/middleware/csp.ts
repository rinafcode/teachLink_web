import { type NextResponse, type NextRequest } from 'next/server';

/** Request header the middleware uses to hand the per-request nonce to the app. */
export const CSP_NONCE_REQUEST_HEADER = 'x-csp-nonce';

/** Response header exposing the nonce to the document renderer. */
export const CSP_NONCE_RESPONSE_HEADER = 'x-nonce';

export const CSP_HEADER = 'Content-Security-Policy';

/** 128 bits of entropy, the minimum the CSP spec recommends for a nonce. */
const NONCE_BYTES = 16;

/** Sources that would re-open the inline-execution hole the nonce exists to close. */
const UNSAFE_SOURCES = ["'unsafe-inline'", "'unsafe-eval'"];

function toBase64(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');

  return typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}

/**
 * Fresh, cryptographically random base64 nonce. A new value is required on every
 * response — a predictable or reused nonce is no better than `'unsafe-inline'`.
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(NONCE_BYTES);
  crypto.getRandomValues(bytes);

  return toBase64(bytes);
}

/** The nonce the middleware attached to this request, if any. */
export function getRequestNonce(request: NextRequest): string | undefined {
  return request.headers.get(CSP_NONCE_REQUEST_HEADER) ?? undefined;
}

/**
 * Attach the nonce to the request headers so the rendered document can reuse it
 * instead of falling back to inline script. Next.js reads the nonce out of the
 * request's `Content-Security-Policy` header and stamps it onto the scripts it
 * injects; `x-csp-nonce` is the app-facing alias for anything rendering its own
 * `<script>` or `<style>`. The returned headers must be forwarded with
 * `NextResponse.next({ request: { headers } })` to reach the app.
 */
export function attachCspRequestHeaders(request: NextRequest, nonce: string): Headers {
  request.headers.set(CSP_NONCE_REQUEST_HEADER, nonce);
  request.headers.set(CSP_HEADER, buildCspHeader({ nonce, strict: true }));

  return request.headers;
}

/** True when a policy still permits inline or eval'd scripts. */
export function containsUnsafeSources(header: string): boolean {
  return UNSAFE_SOURCES.some((source) => header.includes(source));
}

export interface CspOptions {
  /** The per-request nonce to allow trusted inline scripts. */
  nonce: string;
  /**
   * Strict-mode: inline and eval'd script are refused outright. Defaults to
   * `true`; `false` relaxes `script-src` with `'unsafe-eval'` for the dev
   * bundler only — `'unsafe-inline'` is never emitted in either mode.
   */
  strict?: boolean;
  /** Path CSP violations are posted to. */
  reportUri?: string;
  /** `Report-To` group receiving violations. */
  reportTo?: string;
}

export const DEFAULT_CSP_REPORT_URI = '/api/security/reporting';
export const DEFAULT_CSP_REPORT_GROUP = 'security';

export function buildCspHeader(options: CspOptions): string {
  const {
    nonce,
    strict = true,
    reportUri = DEFAULT_CSP_REPORT_URI,
    reportTo = DEFAULT_CSP_REPORT_GROUP,
  } = options;

  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': `'self' 'nonce-${nonce}'${strict ? '' : " 'unsafe-eval'"}`,
    'style-src': `'self' 'nonce-${nonce}'`,
    'img-src':
      "'self' data: blob: https://images.unsplash.com https://thumbs.dreamstime.com https://static.vecteezy.com",
    'font-src': "'self' data:",
    'connect-src': "'self' wss: https:",
    'media-src': "'self' blob:",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
    'worker-src': "'self' blob:",
    'manifest-src': "'self'",
    'upgrade-insecure-requests': '',
    'report-uri': reportUri,
    'report-to': reportTo,
  };

  const header = Object.entries(directives)
    .map(([directive, value]) => (value ? `${directive} ${value}` : directive))
    .join('; ');

  if (strict && containsUnsafeSources(header)) {
    throw new Error('Strict CSP must not contain unsafe-inline or unsafe-eval sources');
  }

  return header;
}

/**
 * Apply the nonce-based policy to a response. The nonce is taken from the
 * argument, then the request header the middleware set, and is only generated
 * here as a last resort so the document and the policy cannot disagree.
 */
export function applyCspHeaders(
  response: NextResponse,
  request: NextRequest,
  nonce?: string,
): NextResponse {
  const cspNonce = nonce ?? getRequestNonce(request) ?? generateNonce();

  response.headers.set(CSP_HEADER, buildCspHeader({ nonce: cspNonce, strict: true }));
  response.headers.set(CSP_NONCE_RESPONSE_HEADER, cspNonce);

  return response;
}
