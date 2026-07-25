# Redirect Management - Examples & Best Practices

## Quick Start Examples

### Example 1: Simple Redirect

```typescript
// In src/lib/redirectManagement.ts

export const SIMPLE_REDIRECTS: RedirectRule[] = [
  {
    from: '/old-page',
    to: '/new-page',
    // Uses defaults: status 308, preserveQuery true, preserveHash false
  },
];

// Usage:
// /old-page → /new-page
// /old-page?id=1 → /new-page?id=1
```

### Example 2: Redirect with Configuration

```typescript
export const CONFIGURED_REDIRECTS: RedirectRule[] = [
  {
    from: '/temporary-location',
    to: '/permanent-location',
    status: 302, // Temporary redirect
    preserveQuery: true, // Keep query params
    preserveHash: true, // Keep hash fragment
    isLegacy: false, // Not a legacy URL
  },
];

// Usage:
// /temporary-location#section?param=value
// → /permanent-location#section?param=value
```

### Example 3: Locale-Specific Redirect

```typescript
export const LOCALE_REDIRECTS: RedirectRule[] = [
  {
    from: '/politica-privacidad',
    to: '/es/privacy',
    locales: ['es', 'es-MX', 'es-AR'], // Only for Spanish users
    preserveQuery: true,
  },
  {
    from: '/politique-confidentialite',
    to: '/fr/privacy',
    locales: ['fr', 'fr-CA', 'fr-BE'], // Only for French users
    preserveQuery: true,
  },
];

// Usage:
// User locale: 'es' → /politica-privacidad → /es/privacy
// User locale: 'en' → /politica-privacidad → NOT REDIRECTED
```

### Example 4: Using Redirects in Middleware

```typescript
// In src/middleware.ts

import { handleRedirects } from './middleware/redirectManagement';

export function middleware(request: NextRequest) {
  // Check for redirects FIRST
  const redirectResponse = handleRedirects(request);
  if (redirectResponse) {
    return redirectResponse;
  }

  // Then continue with other middleware
  // ...
}
```

### Example 5: Testing Redirects

```typescript
// In src/lib/__tests__/redirectManagement.test.ts

import { findRedirectRule } from '../redirectManagement';

describe('Custom Redirects', () => {
  it('should redirect /old to /new', () => {
    const context = {
      pathname: '/old',
      searchParams: new URLSearchParams(),
    };

    const result = findRedirectRule(context);

    expect(result?.destination).toBe('/new');
  });

  it('should preserve query parameters', () => {
    const context = {
      pathname: '/old',
      searchParams: new URLSearchParams('id=123&filter=active'),
    };

    const result = findRedirectRule(context);

    expect(result?.destination).toContain('id=123');
    expect(result?.destination).toContain('filter=active');
  });
});
```

---

## Real-World Examples

### Example 6: E-Commerce Product Redirect

```typescript
// Redirecting legacy product pages to new categories

export const PRODUCT_REDIRECTS: RedirectRule[] = [
  {
    from: '/courses/python-basics',
    to: '/courses/programming/python-basics',
    status: 301, // Permanent (SEO improvement)
    preserveQuery: true, // Preserve sorting/filtering
    isLegacy: true,
  },
  {
    from: '/courses/web-dev',
    to: '/courses/programming/web-dev',
    status: 301,
    preserveQuery: true,
    isLegacy: true,
  },
];

// Usage:
// /courses/python-basics?sort=popular&filter=rating-4+
// → /courses/programming/python-basics?sort=popular&filter=rating-4+
```

### Example 7: Multilingual Content Redirect

```typescript
// Redirect old language-prefixed URLs to new structure

export const LANGUAGE_REDIRECTS: RedirectRule[] = [
  // Spanish old → Spanish new
  {
    from: '/es/politica-privacidad',
    to: '/privacy',
    locales: ['es'],
    preserveQuery: true,
    isLegacy: true,
  },
  // French old → French new
  {
    from: '/fr/politique-confidentialite',
    to: '/privacy',
    locales: ['fr'],
    preserveQuery: true,
    isLegacy: true,
  },
];

// Implementation:
// User in Spanish → /es/politica-privacidad
// Language cookie: es
// → Matches Spanish rule
// → Redirects to /privacy
// → Content served in Spanish (via i18n)
```

### Example 8: Handling Complex Query Strings

```typescript
// Redirecting search queries and maintaining parameters

const context = {
  pathname: '/old-search',
  searchParams: new URLSearchParams([
    ['q', 'react hooks'],
    ['category', 'react'],
    ['category', 'javascript'],
    ['difficulty', 'intermediate'],
    ['date', '2024-01-01'],
  ]),
};

const result = findRedirectRule(context, [
  {
    from: '/old-search',
    to: '/search',
    preserveQuery: true,
  },
]);

// Result destination:
// /search?q=react+hooks&category=react&category=javascript&difficulty=intermediate&date=2024-01-01

// All parameters preserved including duplicate keys
```

---

## Best Practices

### 1. Use Permanent Redirects (301/308) for SEO

```typescript
// ❌ BAD: Using 302 for permanent changes
{
  from: '/old-url',
  to: '/new-url',
  status: 302,  // Search engines keep both URLs
}

// ✅ GOOD: Using 308 for permanent changes
{
  from: '/old-url',
  to: '/new-url',
  status: 308,  // Search engines consolidate to new URL
}
```

**Why**: 308 (Permanent Redirect) tells search engines to update their indexes to the new URL, improving SEO consolidation.

### 2. Preserve Query Parameters by Default

```typescript
// ❌ BAD: Losing analytics parameters
{
  from: '/privacy-policy',
  to: '/privacy',
  preserveQuery: false,  // UTM params lost!
}

// ✅ GOOD: Maintaining marketing data
{
  from: '/privacy-policy',
  to: '/privacy',
  preserveQuery: true,  // UTM params preserved
}
```

**Why**: Preserves marketing attribution and analytics tracking through redirects.

### 3. Test All Redirect Variations

```typescript
// ❌ BAD: Only testing happy path
it('should redirect /old to /new', () => {
  const result = findRedirectRule({ pathname: '/old' });
  expect(result?.destination).toBe('/new');
});

// ✅ GOOD: Comprehensive testing
it('should redirect /old to /new with all parameters', () => {
  // Test 1: Basic redirect
  expect(findRedirectRule({ pathname: '/old' })).toBeTruthy();

  // Test 2: With query params
  expect(
    findRedirectRule({
      pathname: '/old',
      searchParams: new URLSearchParams('id=1'),
    })?.destination,
  ).toContain('?id=1');

  // Test 3: With multiple params
  // Test 4: With special characters
  // Test 5: Edge cases
});
```

**Why**: Comprehensive testing catches edge cases and prevents production issues.

### 4. Use Locale-Specific Redirects When Needed

```typescript
// ❌ BAD: Same redirect for all users
{
  from: '/es/contenido',
  to: '/content',  // But user might be English speaker
}

// ✅ GOOD: Locale-aware redirects
{
  from: '/es/contenido',
  to: '/es/content',  // Keep Spanish version
  locales: ['es', 'es-MX'],
},
{
  from: '/en/contenido',
  to: '/en/content',  // English version
  locales: ['en'],
}
```

**Why**: Ensures users stay in their language context after redirect.

### 5. Document Legacy Redirects

```typescript
// ❌ BAD: No context about redirect
{
  from: '/old-url',
  to: '/new-url',
}

// ✅ GOOD: Clear documentation
{
  from: '/old-url',
  to: '/new-url',
  status: 308,
  preserveQuery: true,
  isLegacy: true,  // Marks for analytics
  // Migrated from old URL scheme on 2024-05-29
  // See: REDIRECT_MIGRATION_PLAN.md
}
```

**Why**: Makes it easier to identify and remove redirects when no longer needed.

### 6. Avoid Redirect Chains

```typescript
// ❌ BAD: Chained redirects (slow, confusing)
/old1 → /old2 → /old3 → /new
// 3 HTTP requests! Bad for SEO and performance

// ✅ GOOD: Direct redirects
/old1 → /new
/old2 → /new
/old3 → /new
// 1 HTTP request each
```

**Why**: Reduces latency and improves SEO. Each redirect is a new HTTP request.

### 7. Monitor Redirect Performance

```typescript
// ✅ GOOD: Log and track redirects
export async function logRedirect(entry: RedirectLog): Promise<void> {
  // Send to analytics
  await analyticsService.track({
    event: 'redirect',
    from: entry.from,
    to: entry.to,
    locale: entry.locale,
    timestamp: entry.timestamp,
  });

  // Monitor performance
  if (entry.processingTime > 5) {
    logger.warn('Slow redirect detected', {
      from: entry.from,
      time: entry.processingTime,
    });
  }
}
```

**Why**: Helps identify performance issues and understand redirect usage patterns.

### 8. Use Exact Matches Over Wildcards

```typescript
// ❌ SLOWER: Wildcard matching
[
  { from: '/old-*', to: '/new' },  // Regex matching required
  { from: '/legacy-*', to: '/content' },
  // More wildcard rules...
]

// ✅ FASTER: Exact matches
[
  { from: '/old-page', to: '/new-page' },
  { from: '/old-post', to: '/new-post' },
  // Exact O(1) lookup
]
```

**Why**: O(1) lookup time for exact matches vs O(n) for wildcard patterns.

### 9. Handle Special Characters Properly

```typescript
// ❌ BAD: Unencoded special characters
const url = `/redirect?search=user@domain.com&email=test@test.com`;
// Might cause parsing errors

// ✅ GOOD: Properly encoded characters
const url = `/redirect?search=${encodeURIComponent('user@domain.com')}&email=${encodeURIComponent('test@test.com')}`;
// Safe and portable

// In your redirect rule:
{
  from: '/search',
  to: '/search-new',
  preserveQuery: true,  // URLSearchParams handles encoding
}
```

**Why**: Prevents parsing errors and maintains data integrity.

### 10. Plan for Redirect Removal

```typescript
// ✅ GOOD: Time-bound redirects
{
  from: '/old-temporary',
  to: '/new',
  expiresAt: new Date('2025-01-01'),  // Remove after date
  preserveQuery: true,
  isLegacy: true,
}

// After expiration date:
// This redirect is no longer maintained
// Can be safely removed

// Annual cleanup:
export function removeExpiredRedirects(): void {
  const now = new Date();
  const active = ALL_REDIRECTS.filter(r => !r.expiresAt || r.expiresAt > now);
  // Update ALL_REDIRECTS with active rules
}
```

**Why**: Prevents accumulation of outdated redirects over time.

---

## Common Pitfalls & Solutions

### Pitfall 1: Infinite Redirect Loops

```typescript
// ❌ BAD: Creates a loop
{
  from: '/page',
  to: '/page',  // Redirects to itself!
}

// ✅ GOOD: Prevents loops
// System automatically prevents self-redirects
// Or use different destination
{
  from: '/page',
  to: '/page-new',
}
```

### Pitfall 2: Forgetting About Mobile Users

```typescript
// ❌ BAD: Desktop-only redirect
{
  from: '/privacy-policy',
  to: '/legal/privacy',
  // Mobile users get broken page
}

// ✅ GOOD: Works for all devices
// Middleware handles all platforms transparently
{
  from: '/privacy-policy',
  to: '/privacy',
  // Works on desktop, tablet, mobile
}
```

### Pitfall 3: Not Testing Edge Cases

```typescript
// ❌ BAD: Only happy path testing
test('redirect works', () => {
  expect(findRedirectRule({ pathname: '/old' })).toBeTruthy();
});

// ✅ GOOD: Comprehensive edge case testing
test('redirect handles edge cases', () => {
  // Empty query string
  expect(findRedirectRule({ pathname: '/old', searchParams: new URLSearchParams() })).toBeTruthy();

  // Only question mark
  expect(findRedirectRule({ pathname: '/old?', searchParams: new URLSearchParams() })).toBeTruthy();

  // Special characters
  expect(
    findRedirectRule({ pathname: '/old', searchParams: new URLSearchParams('q=hello@world') }),
  ).toBeTruthy();

  // Array parameters
  expect(
    findRedirectRule({
      pathname: '/old',
      searchParams: new URLSearchParams([
        ['tag', 'a'],
        ['tag', 'b'],
      ]),
    }),
  ).toBeTruthy();
});
```

### Pitfall 4: SEO Mistakes

```typescript
// ❌ BAD: Wrong status code for SEO
{
  from: '/important-page',
  to: '/new-important-page',
  status: 302,  // Search engines keep both
}

// ✅ GOOD: Proper SEO redirect
{
  from: '/important-page',
  to: '/new-important-page',
  status: 301,  // or 308 for modern browsers
}
```

---

## Performance Optimization Tips

### 1. Rule Organization

```typescript
// ✅ GOOD: Organize by frequency
export const ALL_REDIRECTS = [
  // Most common redirects first
  { from: '/privacy-policy', to: '/privacy', ... },
  { from: '/terms-of-service', to: '/terms', ... },

  // Less common redirects later
  { from: '/obscure-old-url', to: '/new-url', ... },
];
```

### 2. Caching Strategy

```typescript
// ✅ GOOD: Cache frequently accessed redirects
const redirectCache = new Map<string, string>();

export function getCachedRedirect(pathname: string): string | null {
  if (redirectCache.has(pathname)) {
    return redirectCache.get(pathname)!;
  }

  const result = findRedirectRule({ pathname });
  if (result) {
    redirectCache.set(pathname, result.destination);
    return result.destination;
  }

  return null;
}
```

### 3. Monitoring & Profiling

```typescript
// ✅ GOOD: Track redirect performance
console.time('redirect-lookup');
const result = findRedirectRule(context);
console.timeEnd('redirect-lookup');

// Adjust middleware position if needed
// Monitor for slow redirects
```

---

## Security Considerations

### 1. Validate Redirect Destinations

```typescript
// ✅ GOOD: Only allow relative URLs
function isValidRedirectDestination(url: string): boolean {
  // Must be relative URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false;
  }

  // Must start with /
  if (!url.startsWith('/')) {
    return false;
  }

  return true;
}

// Use in rules
{
  from: '/old',
  to: isValidRedirectDestination('/new') ? '/new' : '/home',
}
```

### 2. URL Encode Query Parameters

```typescript
// ✅ GOOD: Use URLSearchParams for safe encoding
const params = new URLSearchParams();
params.append('search', 'user@example.com');
params.append('filter', '<script>alert("xss")</script>');

const safeUrl = `/search?${params.toString()}`;
// Output: /search?search=user%40example.com&filter=%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E
```

### 3. Prevent Open Redirects

```typescript
// ❌ BAD: Open redirect vulnerability
{
  from: '/redirect',
  to: request.query.url,  // User-controlled!
}

// ✅ GOOD: Whitelist only safe destinations
const SAFE_DESTINATIONS = ['/privacy', '/terms', '/home'];

{
  from: '/redirect',
  to: SAFE_DESTINATIONS.includes(request.query.url) ? request.query.url : '/home',
}
```

---

## Conclusion

These examples and best practices ensure:

- ✅ Robust redirect handling
- ✅ Good SEO outcomes
- ✅ User experience preservation
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Maintainability over time

For more information, see:

- [Redirect Management Guide](./REDIRECT_MANAGEMENT_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Migration Plan](./REDIRECT_MIGRATION_PLAN.md)
