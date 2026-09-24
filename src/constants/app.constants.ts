/**
 * Application-wide constants
 * Extracting magic numbers and strings for better maintainability
 */

// Timeouts (in milliseconds)
export const DEFAULT_TOAST_DURATION = 5000;
export const DEFAULT_IDLE_TIMEOUT_MS = 2000;
export const RECONNECT_DELAY_MS = 1000;
export const MAX_TREND_POINTS = 200;
export const MAX_RETRIES = 3;

// Offline sync (deterministic, idempotent, resumable)
export const SYNC_BATCH_SIZE = 20;
/** Max delivery attempts per offline operation before it is dead-lettered. */
export const SYNC_MAX_RETRY_ATTEMPTS = 3;
/** Base delay (ms) for exponential backoff between retries. */
export const SYNC_BACKOFF_BASE_MS = 500;
/** Cap (ms) for exponential backoff so retries never spin forever. */
export const SYNC_BACKOFF_CAP_MS = 10000;
/** Retention window (ms) for acknowledged operations before GC (7 days). */
export const SYNC_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
/** Retention window (ms) for dead-lettered operations before GC (30 days). */
export const DEAD_LETTER_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
/**
 * Hard cap on retained acknowledged operations.
 *
 * Age alone does not bound the store: a device that syncs thousands of
 * operations inside the retention window keeps every one of them. The cap
 * evicts oldest-first once it is exceeded.
 */
export const SYNC_MAX_ACKED_RECORDS = 5000;
/** Hard cap on retained dead-letter records, evicted oldest-first. */
export const DEAD_LETTER_MAX_RECORDS = 500;
/** How often the background retention sweep runs (6 hours). */
export const SYNC_RETENTION_SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;
/** Retention window (ms) for persisted store slices before GC (30 days). */
export const PERSISTED_STATE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
/** Background sync tag used by the service worker to trigger a drain. */
export const SYNC_BACKGROUND_TAG = 'teachlink-offline-sync';

export const SYNC_CONFLICT_STATES = {
  PENDING: 'pending',
  CONFLICTED: 'conflicted',
  RESOLVED: 'resolved',
} as const;

// API Timeouts
export const API_TIMEOUT_DEFAULT = 10000;
export const API_TIMEOUT_UPLOAD = 60000;
export const API_TIMEOUT_DOWNLOAD = 60000;
export const API_TIMEOUT_SEARCH = 15000;
export const API_CACHE_TTL_DEFAULT = 300000; // 5 minutes
export const API_CACHE_MAX_ENTRIES_DEFAULT = 100;
export const API_CACHE_MAX_SIZE_DEFAULT = 100;

// API URLs & Endpoints
export const DEFAULT_SOCKET_URL = 'http://localhost:3001';

// Realtime connection supervisor (see src/lib/realtime/connectionSupervisor.ts)
export const REALTIME_RECONNECT_BASE_DELAY_MS = 1000;
export const REALTIME_RECONNECT_MAX_DELAY_MS = 30000;
export const REALTIME_RECONNECT_MAX_ATTEMPTS = 5;
/** Jitter factor for reconnect backoff. 1 = full jitter (random 0..2x), 0 = deterministic. */
export const REALTIME_RECONNECT_JITTER = 1;
export const REALTIME_HEARTBEAT_INTERVAL_MS = 30000;
export const REALTIME_HEARTBEAT_TIMEOUT_MS = 10000;
export const REALTIME_OUTBOUND_QUEUE_LIMIT = 100;
export const REALTIME_QUEUE_POLICY = 'drop-oldest' as const;
/** Message type used to signal clients (via the service worker) that realtime gave up. */
export const REALTIME_OFFLINE_EVENT = 'REALTIME_OFFLINE';

// Web3 Config
export const DEFAULT_STARKNET_NETWORK = 'goerli-alpha';
export const STARKNET_NETWORKS = {
  MAINNET: {
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    explorerUrl: 'https://starkscan.co',
  },
  TESTNET: {
    rpcUrl: 'https://starknet-testnet.public.blastapi.io',
    explorerUrl: 'https://testnet.starkscan.co',
  },
  SEPOLIA: {
    rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
    explorerUrl: 'https://sepolia.starkscan.co',
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  PERF_TRENDS: 'teachlink:perf:trends',
  AUTH_TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
};

/**
 * How long before an access token's `exp` the token manager treats it as due
 * for a silent refresh. A generous skew keeps long-lived sockets and queued
 * offline operations from ever carrying a token that lapses mid-flight.
 */
export const AUTH_REFRESH_SKEW_MS = 60_000;

/** Default endpoint used to exchange a refresh token for a new access token. */
export const AUTH_REFRESH_ENDPOINT = '/api/auth/refresh';

/**
 * Domains permitted in sanitized HTML links and sanitizeUrl().
 * Subdomains are automatically permitted (e.g. www.youtube.com matches youtube.com).
 * Add entries here to extend the allowlist — one bare hostname per entry, no leading dot.
 */
export const ALLOWED_LINK_DOMAINS = [
  'teachlink.com',
  'youtube.com',
  'youtube-nocookie.com',
  'vimeo.com',
  'github.com',
  'loom.com',
];
