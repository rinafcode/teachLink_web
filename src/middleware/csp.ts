import { type NextResponse, type NextRequest } from 'next/server';

export function generateNonce(): string {
  return crypto.randomUUID();
}

export interface CspOptions {
  /** The per-request nonce to allow trusted inline scripts. */
  nonce: string;
  /** Strict-mode: disallow anything not explicitly listed. Defaults to `true`. */
  strict?: boolean;
}

export function buildCspHeader(options: CspOptions): string {
  const { nonce, strict = true } = options;
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
    'report-uri': '/api/security/reporting',
    'report-to': 'security',
  };
  return Object.entries(directives)
    .map(([directive, value]) => (value ? `${directive} ${value}` : directive))
    .join('; ');
}

export function applyCspHeaders(
  response: NextResponse,
  _request: NextRequest,
  nonce?: string,
): NextResponse {
  const cspNonce = nonce ?? generateNonce();
  const csp = buildCspHeader({ nonce: cspNonce, strict: true });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Nonce', cspNonce);
  return response;
}