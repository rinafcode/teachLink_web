import { STORAGE_KEYS } from '@/constants/app.constants';
import { getAuthConfig } from '@/config/environment';
import { createCounterMetric } from '@/lib/logging/performance';

/**
 * Single source of truth for the authentication token lifecycle.
 *
 * Every consumer — the REST client, WebSocket connections, GraphQL
 * subscriptions and the offline replay queue — obtains its access token from
 * here via {@link TokenManager.getValidAccessToken}, so that:
 *
 *  - A refresh that becomes necessary under concurrent load happens **once**
 *    (single-flight): callers share the same in-flight promise instead of each
 *    firing their own `/auth/refresh` request (no thundering herd).
 *  - The access token is refreshed silently a configurable skew before it
 *    expires, so long-lived sockets and queued offline operations never carry a
 *    token that is about to lapse.
 *  - Rotation and revocation are broadcast (`token:rotated` / `token:revoked` /
 *    `auth:logout`) so sockets can re-authenticate or disconnect and the offline
 *    queue can stop draining, rather than each consumer discovering the change
 *    independently when a request happens to fail.
 */

export type AuthEvent = 'token:rotated' | 'token:revoked' | 'auth:logout';

export interface AuthEventPayloads {
  'token:rotated': { accessToken: string };
  'token:revoked': { reason: string };
  'auth:logout': { reason: string };
}

export type AuthEventListener<E extends AuthEvent> = (payload: AuthEventPayloads[E]) => void;

export interface TokenPair {
  accessToken: string;
  refreshToken?: string | null;
}

interface RefreshResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
}

type MetricSink = (name: string, tags?: Record<string, string | number | boolean>) => void;

type MinimalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface TokenManagerOptions {
  /** Clock, injectable for tests. Defaults to `Date.now`. */
  now?: () => number;
  /** `fetch` implementation, injectable for tests. */
  fetchImpl?: typeof fetch;
  /** Storage backing tokens; `null` disables persistence. */
  storage?: MinimalStorage | null;
  /** Endpoint used to exchange a refresh token for a new access token. */
  refreshEndpoint?: string;
  /** How long before `exp` a token is considered due for refresh (ms). */
  refreshSkewMs?: number;
  /** When true, a background timer refreshes proactively before `exp`. */
  scheduleRefresh?: boolean;
  /** Metric sink; defaults to the app performance recorder. */
  recordMetric?: MetricSink;
}

function defaultStorage(): MinimalStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  if (typeof atob === 'function') return atob(padded);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('binary');
  }
  return '';
}

/**
 * Read the `exp` claim (as epoch milliseconds) from a JWT without verifying its
 * signature. Verification is the server's job; the client only needs `exp` to
 * decide when to refresh. Returns `null` for malformed tokens.
 */
export function readTokenExpiryMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number };
    if (typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAtMs: number | null = null;

  private refreshInFlight: Promise<string> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private hydrated = false;

  private readonly now: () => number;
  private readonly fetchImpl: typeof fetch;
  private readonly storage: MinimalStorage | null;
  private readonly refreshEndpoint: string;
  private readonly refreshSkewMs: number;
  private readonly scheduleRefresh: boolean;
  private readonly recordMetric: MetricSink;

  private readonly listeners: {
    [E in AuthEvent]: Set<AuthEventListener<E>>;
  } = {
    'token:rotated': new Set(),
    'token:revoked': new Set(),
    'auth:logout': new Set(),
  };

  constructor(options: TokenManagerOptions = {}) {
    const config = getAuthConfig();
    this.now = options.now ?? (() => Date.now());
    this.fetchImpl =
      options.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefinedFetch);
    this.storage = options.storage === undefined ? defaultStorage() : options.storage;
    this.refreshEndpoint = options.refreshEndpoint ?? config.refreshEndpoint;
    this.refreshSkewMs = options.refreshSkewMs ?? config.refreshSkewMs;
    this.scheduleRefresh = options.scheduleRefresh ?? true;
    this.recordMetric =
      options.recordMetric ??
      ((name, tags) => {
        createCounterMetric(name, 1, tags);
      });
  }

  // -- Event bus -------------------------------------------------------------

  on<E extends AuthEvent>(event: E, listener: AuthEventListener<E>): () => void {
    this.listeners[event].add(listener);
    return () => this.off(event, listener);
  }

  off<E extends AuthEvent>(event: E, listener: AuthEventListener<E>): void {
    this.listeners[event].delete(listener);
  }

  private emit<E extends AuthEvent>(event: E, payload: AuthEventPayloads[E]): void {
    for (const listener of this.listeners[event]) {
      try {
        listener(payload);
      } catch {
        // A misbehaving listener must not break token management.
      }
    }
  }

  // -- Hydration & persistence ----------------------------------------------

  private hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    if (!this.storage) return;
    const access = this.storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const refresh = this.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (access) {
      this.accessToken = access;
      this.expiresAtMs = readTokenExpiryMs(access);
    }
    if (refresh) this.refreshToken = refresh;
    this.rescheduleRefresh();
  }

  private persist(): void {
    if (!this.storage) return;
    if (this.accessToken) {
      this.storage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
    } else {
      this.storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    if (this.refreshToken) {
      this.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.refreshToken);
    } else {
      this.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  }

  // -- Public token API ------------------------------------------------------

  /** Set the token pair after a login or an external refresh. */
  setTokens(tokens: TokenPair): void {
    this.hydrate();
    this.accessToken = tokens.accessToken;
    if (tokens.refreshToken !== undefined) {
      this.refreshToken = tokens.refreshToken;
    }
    this.expiresAtMs = readTokenExpiryMs(tokens.accessToken);
    this.persist();
    this.rescheduleRefresh();
  }

  /** The currently cached access token, without triggering a refresh. */
  getAccessTokenSync(): string | null {
    this.hydrate();
    return this.accessToken;
  }

  /** True when there is no token, or it is within the refresh skew of expiry. */
  private isExpiringSoon(): boolean {
    if (!this.accessToken) return true;
    if (this.expiresAtMs === null) return false; // opaque token — trust until 401
    return this.expiresAtMs - this.now() <= this.refreshSkewMs;
  }

  /**
   * Return a valid access token, refreshing first if the current one is missing
   * or about to expire. Concurrent callers share a single refresh.
   */
  async getValidAccessToken(): Promise<string | null> {
    this.hydrate();
    if (!this.isExpiringSoon()) return this.accessToken;
    if (!this.refreshToken) return this.accessToken;
    try {
      return await this.refresh();
    } catch {
      return null;
    }
  }

  /**
   * Force a token refresh. All concurrent callers receive the same in-flight
   * promise (single-flight), so only one network request is made.
   */
  refresh(): Promise<string> {
    this.hydrate();
    if (this.refreshInFlight) return this.refreshInFlight;

    const inFlight = this.performRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    this.refreshInFlight = inFlight;
    return inFlight;
  }

  private async performRefresh(): Promise<string> {
    if (!this.refreshToken) {
      this.forceLogout('missing_refresh_token');
      throw new Error('No refresh token available');
    }

    let response: Response;
    try {
      response = await this.fetchImpl(this.refreshEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } catch (error) {
      this.recordMetric('auth.refresh_failure', { reason: 'network' });
      throw error instanceof Error ? error : new Error('Refresh request failed');
    }

    if (!response.ok) {
      this.recordMetric('auth.refresh_failure', { status: response.status });
      // 401/403 on refresh means the refresh token itself is dead → hard logout.
      if (response.status === 401 || response.status === 403) {
        this.forceLogout('refresh_rejected');
      }
      throw new Error(`Refresh failed with status ${response.status}`);
    }

    const data = (await response.json().catch(() => ({}))) as RefreshResponse;
    const newAccess = data.accessToken ?? data.token;
    if (!newAccess) {
      this.recordMetric('auth.refresh_failure', { reason: 'no_token_in_response' });
      throw new Error('Refresh response did not include an access token');
    }

    const previousAccess = this.accessToken;
    this.accessToken = newAccess;
    if (data.refreshToken) this.refreshToken = data.refreshToken;
    this.expiresAtMs = readTokenExpiryMs(newAccess);
    this.persist();
    this.rescheduleRefresh();

    this.recordMetric('auth.refresh_success');
    if (previousAccess !== newAccess) {
      this.recordMetric('auth.token_rotated');
      this.emit('token:rotated', { accessToken: newAccess });
    }
    return newAccess;
  }

  /**
   * Clear all tokens and broadcast logout. Consumers should disconnect sockets
   * and stop draining the offline queue in response.
   */
  forceLogout(reason = 'manual'): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAtMs = null;
    this.clearTimer();
    this.persist();
    this.recordMetric('auth.forced_logout', { reason });
    this.emit('token:revoked', { reason });
    this.emit('auth:logout', { reason });
  }

  // -- Proactive refresh scheduling -----------------------------------------

  private clearTimer(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private rescheduleRefresh(): void {
    this.clearTimer();
    if (!this.scheduleRefresh) return;
    if (typeof setTimeout === 'undefined') return;
    if (!this.accessToken || this.expiresAtMs === null || !this.refreshToken) {
      return;
    }
    const fireInMs = Math.max(0, this.expiresAtMs - this.now() - this.refreshSkewMs);
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.refresh().catch(() => {
        // Swallowed: a failed proactive refresh surfaces on the next request.
      });
    }, fireInMs);
  }

  /** Testing/teardown helper: cancel the background refresh timer. */
  dispose(): void {
    this.clearTimer();
  }
}

function undefinedFetch(): Promise<Response> {
  return Promise.reject(new Error('No fetch implementation available'));
}

/**
 * Process-wide singleton used by the REST client, sockets and the offline
 * queue. Tests instantiate their own {@link TokenManager} with injected
 * dependencies instead of using this instance.
 */
export const tokenManager = new TokenManager();
