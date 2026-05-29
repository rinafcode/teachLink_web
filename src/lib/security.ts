import { NextResponse } from 'next/server';

/**
 * Security utilities for API routes.
 * Provides input sanitization, security headers, and request validation.
 */

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/** Escape HTML special characters to prevent XSS in string outputs */
export function sanitizeString(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/** Recursively sanitize all string values in an object */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/** Apply standard security headers to a NextResponse */
export function withSecurityHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ---------------------------------------------------------------------------
// Request Validation
// ---------------------------------------------------------------------------

/** Validate that the request content-type is acceptable for JSON APIs */
export function validateContentType(request: Request): boolean {
  const method = request.method.toUpperCase();
  // GET/HEAD/DELETE typically don't have body
  if (['GET', 'HEAD', 'DELETE'].includes(method)) return true;

  const contentType = request.headers.get('content-type') || '';
  return contentType.includes('application/json');
}

/** Check for suspicious patterns in query parameters */
export function validateQuerySafety(searchParams: URLSearchParams): {
  safe: boolean;
  reason?: string;
} {
  const suspiciousPatterns = [
    /(<script|javascript:|on\w+=)/i,
    /(union\s+select|drop\s+table|insert\s+into)/i,
    /(\.\.\/)/, // path traversal
  ];

  for (const [key, value] of searchParams.entries()) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(key) || pattern.test(value)) {
        return { safe: false, reason: `Suspicious input detected in parameter: ${key}` };
      }
    }
  }

  return { safe: true };
}

/** Create a 400 Bad Request response for security violations */
export function createSecurityErrorResponse(reason: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'invalid_request',
        message: reason,
      },
    },
    { status: 400 },
  );
}
