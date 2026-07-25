// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Redirect Management Middleware
 * Integrates redirect management into Next.js middleware
 */

import { NextResponse, type NextRequest } from 'next/server';
import { findRedirectRule, logRedirect } from '@/lib/redirectManagement';
import type { RedirectContext } from '@/lib/redirectManagement';
import { createLogger } from '@/lib/logging';

const logger = createLogger('redirect-management');

/**
 * Middleware handler for redirects
 * Should be called early in the middleware chain
 */
export function handleRedirects(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;

  // Extract locale from pathname or cookie
  const localeCookie = request.cookies.get('i18n:language')?.value;
  const locale = localeCookie || 'en';

  // Parse hash from request (if available)
  const hash = '';

  // Create redirect context
  const context: RedirectContext = {
    pathname,
    searchParams: new URLSearchParams(search),
    locale,
    hash,
  };

  // Find matching redirect rule
  const match = findRedirectRule(context);

  if (match) {
    // Log the redirect for analytics
    logRedirect({
      timestamp: Date.now(),
      from: pathname,
      to: match.destination,
      locale,
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || undefined,
      statusCode: match.rule.status || 308,
    }).catch((err) => {
      logger.error('[Redirect Log Error]', { error: err });
    });

    // Perform the redirect
    return NextResponse.redirect(new URL(match.destination, request.url), {
      status: match.rule.status || 308,
    });
  }

  return null;
}

/**
 * Extract locale from request (cookie or pathname)
 */
export function extractLocale(request: NextRequest): string {
  const { pathname } = request.nextUrl;

  // Check cookie first
  const localeCookie = request.cookies.get('i18n:language')?.value;
  if (localeCookie) return localeCookie;

  // Check pathname pattern (e.g., /en/page, /es/page)
  const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  if (localeMatch) return localeMatch[1];

  return 'en';
}
