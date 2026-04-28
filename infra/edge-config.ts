// ── Edge Deployment Configuration (#276) ─────────────────────────────────────
// Centralizes edge runtime env vars, CDN caching strategy, and cold-start
// optimization settings for Vercel Edge / Cloudflare Workers deployments.

// ── Environment variables ─────────────────────────────────────────────────────
export const EDGE_REGION = process.env.EDGE_REGION ?? 'auto';
export const EDGE_CACHE_TTL = parseInt(process.env.EDGE_CACHE_TTL ?? '60', 10);
export const EDGE_LOG_LEVEL = process.env.EDGE_LOG_LEVEL ?? 'info';
export const EDGE_ENABLE_LOGGING =
  process.env.EDGE_ENABLE_LOGGING !== 'false';

// ── CDN caching strategy ──────────────────────────────────────────────────────
// s-maxage controls edge/CDN cache lifetime; stale-while-revalidate allows
// serving stale content while the edge node revalidates in the background.
export const CDN_CACHE_HEADERS = {
  // Public read routes: cache at the edge for EDGE_CACHE_TTL seconds
  public: `public, s-maxage=${EDGE_CACHE_TTL}, stale-while-revalidate=30`,
  // Mutation / auth routes: must not be cached at the edge
  private: 'private, no-store, no-cache',
} as const;

// ── Cold-start optimization ───────────────────────────────────────────────────
// Keep module-level state minimal. Heavy initialisation should be deferred
// inside request handlers so the edge runtime can load the module quickly.
export const COLD_START_CONFIG = {
  // Maximum response time (ms) before the edge function is considered unhealthy
  timeoutMs: parseInt(process.env.EDGE_TIMEOUT_MS ?? '5000', 10),
  // Lightweight keep-alive ping path used by the platform health checker
  keepAlivePath: '/api/health',
} as const;

// ── Edge-specific logger ──────────────────────────────────────────────────────
// Uses console.* so logs surface in Vercel / Cloudflare log drains without
// any additional dependency.
export function edgeLog(
  level: 'info' | 'warn' | 'error',
  route: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (!EDGE_ENABLE_LOGGING) return;

  const entry = {
    level,
    route,
    message,
    region: EDGE_REGION,
    ts: new Date().toISOString(),
    ...meta,
  };

  if (level === 'error') {
    console.error('[edge]', JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn('[edge]', JSON.stringify(entry));
  } else {
    console.log('[edge]', JSON.stringify(entry));
  }
}
