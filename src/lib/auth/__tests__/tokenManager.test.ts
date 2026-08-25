import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager, readTokenExpiryMs, type TokenManagerOptions } from '../tokenManager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000_000; // fixed clock (ms)

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Build an unsigned-but-well-formed JWT whose `exp` is `expSeconds`. */
function makeJwt(expSeconds: number): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: 'user-1', exp: expSeconds }));
  return `${header}.${payload}.signature`;
}

const soonToken = () => makeJwt(Math.floor(NOW / 1000) + 1); // expires in 1s
const freshToken = () => makeJwt(Math.floor(NOW / 1000) + 3600); // 1h

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    _map: map,
  };
}

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response;
}

interface ManagerParts {
  manager: TokenManager;
  fetchImpl: ReturnType<typeof vi.fn>;
  recordMetric: ReturnType<typeof vi.fn>;
  storage: ReturnType<typeof createStorage>;
}

function build(overrides: Partial<TokenManagerOptions> = {}): ManagerParts {
  const storage = createStorage();
  const fetchImpl = vi.fn();
  const recordMetric = vi.fn();
  const manager = new TokenManager({
    now: () => NOW,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    storage,
    refreshEndpoint: '/api/auth/refresh',
    refreshSkewMs: 60_000,
    scheduleRefresh: false,
    recordMetric,
    ...overrides,
  });
  return { manager, fetchImpl, recordMetric, storage };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('readTokenExpiryMs', () => {
  it('decodes the exp claim as epoch milliseconds', () => {
    const exp = Math.floor(NOW / 1000) + 100;
    expect(readTokenExpiryMs(makeJwt(exp))).toBe(exp * 1000);
  });

  it('returns null for a malformed token', () => {
    expect(readTokenExpiryMs('not-a-jwt')).toBeNull();
    expect(readTokenExpiryMs('a.b')).toBeNull();
  });
});

describe('TokenManager.getValidAccessToken', () => {
  it('returns the current token unchanged when it is not expiring soon', async () => {
    const { manager, fetchImpl } = build();
    const token = freshToken();
    manager.setTokens({ accessToken: token, refreshToken: 'refresh-1' });

    await expect(manager.getValidAccessToken()).resolves.toBe(token);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refreshes when the token is within the skew of expiry', async () => {
    const { manager, fetchImpl } = build();
    const newToken = freshToken();
    fetchImpl.mockResolvedValue(okResponse({ accessToken: newToken }));
    manager.setTokens({ accessToken: soonToken(), refreshToken: 'refresh-1' });

    await expect(manager.getValidAccessToken()).resolves.toBe(newToken);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns the existing token (no refresh) when there is no refresh token', async () => {
    const { manager, fetchImpl } = build();
    const token = soonToken();
    manager.setTokens({ accessToken: token, refreshToken: null });

    await expect(manager.getValidAccessToken()).resolves.toBe(token);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('TokenManager single-flight refresh', () => {
  it('collapses concurrent refreshes into a single network request', async () => {
    const { manager, fetchImpl } = build();
    const newToken = freshToken();
    let resolveFetch: (r: Response) => void = () => {};
    fetchImpl.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    manager.setTokens({ accessToken: soonToken(), refreshToken: 'refresh-1' });

    const calls = Promise.all([
      manager.getValidAccessToken(),
      manager.getValidAccessToken(),
      manager.refresh(),
      manager.refresh(),
      manager.getValidAccessToken(),
    ]);

    resolveFetch(okResponse({ accessToken: newToken }));
    const results = await calls;

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    for (const r of results) expect(r).toBe(newToken);
  });

  it('allows a subsequent refresh after the in-flight one settles', async () => {
    const { manager, fetchImpl } = build();
    fetchImpl.mockResolvedValueOnce(
      okResponse({ accessToken: makeJwt(Math.floor(NOW / 1000) + 10) }),
    );
    manager.setTokens({ accessToken: soonToken(), refreshToken: 'refresh-1' });

    await manager.refresh();
    fetchImpl.mockResolvedValueOnce(okResponse({ accessToken: freshToken() }));
    await manager.refresh();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('TokenManager refresh outcomes', () => {
  it('emits token:rotated and records a metric on a successful rotation', async () => {
    const { manager, fetchImpl, recordMetric } = build();
    const newToken = freshToken();
    fetchImpl.mockResolvedValue(okResponse({ accessToken: newToken, refreshToken: 'refresh-2' }));
    manager.setTokens({ accessToken: soonToken(), refreshToken: 'refresh-1' });

    const rotated = vi.fn();
    manager.on('token:rotated', rotated);

    await manager.refresh();

    expect(rotated).toHaveBeenCalledWith({ accessToken: newToken });
    expect(recordMetric).toHaveBeenCalledWith('auth.refresh_success');
    expect(recordMetric).toHaveBeenCalledWith('auth.token_rotated');
  });

  it('forces logout and broadcasts revocation when the refresh token is rejected', async () => {
    const { manager, fetchImpl, recordMetric, storage } = build();
    fetchImpl.mockResolvedValue(errorResponse(401));
    manager.setTokens({ accessToken: soonToken(), refreshToken: 'refresh-1' });

    const revoked = vi.fn();
    const loggedOut = vi.fn();
    manager.on('token:revoked', revoked);
    manager.on('auth:logout', loggedOut);

    await expect(manager.refresh()).rejects.toThrow();

    expect(revoked).toHaveBeenCalled();
    expect(loggedOut).toHaveBeenCalled();
    expect(manager.getAccessTokenSync()).toBeNull();
    expect(storage.getItem('token')).toBeNull();
    expect(recordMetric).toHaveBeenCalledWith('auth.forced_logout', { reason: 'refresh_rejected' });
  });

  it('propagates a network error without logging out', async () => {
    const { manager, fetchImpl } = build();
    fetchImpl.mockRejectedValue(new Error('network down'));
    manager.setTokens({ accessToken: soonToken(), refreshToken: 'refresh-1' });

    const loggedOut = vi.fn();
    manager.on('auth:logout', loggedOut);

    await expect(manager.refresh()).rejects.toThrow('network down');
    expect(loggedOut).not.toHaveBeenCalled();
    // The session is still intact and can be retried.
    expect(manager.getAccessTokenSync()).not.toBeNull();
  });
});

describe('TokenManager persistence and logout', () => {
  it('persists tokens to storage and hydrates from it', () => {
    const storage = createStorage();
    const first = new TokenManager({ storage, scheduleRefresh: false, now: () => NOW });
    const token = freshToken();
    first.setTokens({ accessToken: token, refreshToken: 'refresh-1' });

    // A fresh instance backed by the same storage sees the token.
    const second = new TokenManager({ storage, scheduleRefresh: false, now: () => NOW });
    expect(second.getAccessTokenSync()).toBe(token);
  });

  it('forceLogout clears tokens, storage and unsubscribed listeners are not called', () => {
    const { manager, storage } = build();
    manager.setTokens({ accessToken: freshToken(), refreshToken: 'refresh-1' });

    const revoked = vi.fn();
    const off = manager.on('token:revoked', revoked);
    off();

    manager.forceLogout('manual');

    expect(manager.getAccessTokenSync()).toBeNull();
    expect(storage.getItem('token')).toBeNull();
    expect(storage.getItem('refresh_token')).toBeNull();
    expect(revoked).not.toHaveBeenCalled();
  });
});

describe('TokenManager proactive refresh scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules a silent refresh before expiry', async () => {
    const storage = createStorage();
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ accessToken: freshToken() }));
    const manager = new TokenManager({
      storage,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      refreshSkewMs: 60_000,
      scheduleRefresh: true,
    });

    // Token expires in 100s; with a 60s skew the refresh should fire at ~40s.
    manager.setTokens({
      accessToken: makeJwt(Math.floor(NOW / 1000) + 100),
      refreshToken: 'refresh-1',
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(41_000);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    manager.dispose();
  });
});
