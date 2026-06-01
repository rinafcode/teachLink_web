/**
 * Redirect Management System
 * Handles URL redirects with support for legacy URLs, query parameter preservation,
 * and locale-aware redirects
 */

import type { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Redirect rule configuration
 */
export interface RedirectRule {
  /**
   * Source URL pattern (supports wildcards)
   * Examples: '/privacy-policy', '/old-privacy', '/privacy-*'
   */
  from: string;

  /**
   * Destination URL pattern (supports :param syntax)
   * Examples: '/privacy', '/legal/privacy'
   */
  to: string;

  /**
   * HTTP status code for the redirect (default: 308 Permanent Redirect)
   */
  status?: number;

  /**
   * Whether to preserve query parameters (default: true)
   */
  preserveQuery?: boolean;

  /**
   * Whether to preserve hash (default: false)
   */
  preserveHash?: boolean;

  /**
   * Locale-specific redirects (if provided, only applies for these locales)
   * If undefined, applies to all locales
   */
  locales?: string[];

  /**
   * Whether this is a legacy rule (for migration tracking)
   */
  isLegacy?: boolean;
}

/**
 * Redirect context for rule evaluation
 */
export interface RedirectContext {
  pathname: string;
  searchParams?: ReadonlyURLSearchParams | Record<string, string | string[]>;
  locale?: string;
  hash?: string;
}

/**
 * Privacy Policy specific redirect rules
 */
export const PRIVACY_POLICY_REDIRECTS: RedirectRule[] = [
  // Legacy URL patterns
  {
    from: '/privacy-policy',
    to: '/privacy',
    status: 308,
    preserveQuery: true,
    preserveHash: true,
    isLegacy: true,
  },
  {
    from: '/privacy-notice',
    to: '/privacy',
    status: 308,
    preserveQuery: true,
    isLegacy: true,
  },
  {
    from: '/policies/privacy',
    to: '/privacy',
    status: 308,
    preserveQuery: true,
    isLegacy: true,
  },
  {
    from: '/legal/privacy',
    to: '/privacy',
    status: 308,
    preserveQuery: true,
    isLegacy: true,
  },
  {
    from: '/legal/privacy-policy',
    to: '/privacy',
    status: 308,
    preserveQuery: true,
    isLegacy: true,
  },
];

/**
 * Global redirect rules (for other pages)
 */
export const GLOBAL_REDIRECTS: RedirectRule[] = [
  {
    from: '/terms-of-service',
    to: '/terms',
    status: 308,
    preserveQuery: true,
    isLegacy: true,
  },
  {
    from: '/tos',
    to: '/terms',
    status: 308,
    preserveQuery: true,
    isLegacy: true,
  },
];

/**
 * All redirect rules combined
 */
export const ALL_REDIRECTS: RedirectRule[] = [...PRIVACY_POLICY_REDIRECTS, ...GLOBAL_REDIRECTS];

/**
 * Check if a path matches a pattern (supports wildcards)
 */
function matchesPattern(pattern: string, pathname: string): boolean {
  // Exact match
  if (pattern === pathname) return true;

  // Wildcard match (e.g., '/privacy-*' matches '/privacy-policy')
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\//g, '\\/')
      .replace(/\*/g, '[^/?]*')
      .replace(/^\\\//gm, '^/');
    const regex = new RegExp(`^${regexPattern}(/.*)?$`);
    return regex.test(pathname);
  }

  return false;
}

/**
 * Extract path and hash from a URL string
 */
function parsePath(url: string): { pathname: string; hash: string } {
  const [pathname, hash] = url.split('#');
  return { pathname, hash: hash ? `#${hash}` : '' };
}

/**
 * Build destination URL with parameters
 */
function buildDestinationUrl(
  rule: RedirectRule,
  context: RedirectContext,
): string {
  let destination = rule.to;
  
  // Preserve hash if configured
  if (rule.preserveHash && context.hash) {
    destination += context.hash;
  }

  // Preserve query parameters if configured
  if (rule.preserveQuery && context.searchParams) {
    const params = new URLSearchParams();
    
    if (context.searchParams instanceof URLSearchParams) {
      context.searchParams.forEach((value, key) => {
        params.append(key, value);
      });
    } else if (typeof context.searchParams === 'object') {
      Object.entries(context.searchParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      });
    }

    const queryString = params.toString();
    if (queryString) {
      destination += `?${queryString}`;
    }
  }

  return destination;
}

/**
 * Find a matching redirect rule for the given context
 */
export function findRedirectRule(
  context: RedirectContext,
  rules: RedirectRule[] = ALL_REDIRECTS,
): { rule: RedirectRule; destination: string } | null {
  for (const rule of rules) {
    // Check if pattern matches
    if (!matchesPattern(rule.from, context.pathname)) {
      continue;
    }

    // Check locale restriction if specified
    if (rule.locales && context.locale && !rule.locales.includes(context.locale)) {
      continue;
    }

    // Build destination URL
    const destination = buildDestinationUrl(rule, context);

    return { rule, destination };
  }

  return null;
}

/**
 * Check if a pathname should be redirected
 */
export function shouldRedirect(
  pathname: string,
  rules: RedirectRule[] = ALL_REDIRECTS,
): boolean {
  return rules.some(rule => matchesPattern(rule.from, pathname));
}

/**
 * Get all redirect rules for a specific locale
 */
export function getRedirectsForLocale(
  locale: string,
  rules: RedirectRule[] = ALL_REDIRECTS,
): RedirectRule[] {
  return rules.filter(rule => !rule.locales || rule.locales.includes(locale));
}

/**
 * Get legacy redirect rules (for migration tracking)
 */
export function getLegacyRedirects(
  rules: RedirectRule[] = ALL_REDIRECTS,
): RedirectRule[] {
  return rules.filter(rule => rule.isLegacy);
}

/**
 * Create a redirect tracking log entry
 */
export interface RedirectLog {
  timestamp: number;
  from: string;
  to: string;
  locale?: string;
  userAgent?: string;
  referrer?: string;
  statusCode: number;
}

/**
 * Log a redirect for analytics/monitoring
 * This is for server-side logging
 */
export async function logRedirect(entry: RedirectLog): Promise<void> {
  // This would be implemented to send logs to your analytics service
  // For now, it's a no-op that can be extended
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Redirect Log]', {
      from: entry.from,
      to: entry.to,
      locale: entry.locale,
      statusCode: entry.statusCode,
    });
  }
}
