export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging' || nodeEnv === 'test') return 'staging';
  return 'development';
};

export interface AuthConfig {
  /** Endpoint used to exchange a refresh token for a new access token. */
  refreshEndpoint: string;
  /** Milliseconds before `exp` at which a token becomes due for refresh. */
  refreshSkewMs: number;
}

export interface JWTConfig {
  /** Clock-skew tolerance in milliseconds for `exp`/`nbf` validation. */
  clockSkewMs: number;
}

/**
 * Resolves the authentication token-lifecycle configuration, allowing the
 * refresh endpoint and skew to be overridden per environment via
 * `NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT` / `NEXT_PUBLIC_AUTH_REFRESH_SKEW_MS`.
 */
export const getAuthConfig = (): AuthConfig => {
  const endpoint = process.env.NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT;
  const skewRaw = process.env.NEXT_PUBLIC_AUTH_REFRESH_SKEW_MS;
  const skew = skewRaw ? Number.parseInt(skewRaw, 10) : NaN;

  return {
    refreshEndpoint: endpoint && endpoint.length > 0 ? endpoint : '/api/auth/refresh',
    refreshSkewMs: Number.isFinite(skew) && skew >= 0 ? skew : 60_000,
  };
};

/**
 * Resolves JWT validation tolerance. Allows server-side clocks to differ slightly
 * without rejecting otherwise valid tokens.
 */
export const getJWTConfig = (): JWTConfig => {
  const skewRaw = process.env.JWT_CLOCK_SKEW_MS;
  const skew = skewRaw ? Number.parseInt(skewRaw, 10) : NaN;

  return {
    clockSkewMs: Number.isFinite(skew) && skew >= 0 ? skew : 5_000,
  };
};

export interface TrustedProxyConfig {
  /** IPs allowed to set client-identifying headers (x-forwarded-for / x-real-ip). */
  trustedProxyIPs: ReadonlySet<string>;
}

/**
 * Parses a comma-separated list of proxy IP addresses into a Set of trimmed
 * IP strings, e.g.:
 *   TRUSTED_PROXY_IPS=10.0.0.1,10.0.0.2,172.16.0.1
 *
 * Returns an empty Set when the value is unset or empty, which means no proxy
 * is trusted and forwarded headers must be ignored.
 */
export function parseTrustedProxyIPs(envValue: string | undefined): Set<string> {
  if (!envValue || envValue.trim() === '') {
    return new Set();
  }
  const ips = envValue
    .split(',')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
  return new Set(ips);
}

/**
 * Resolves the trusted-proxy allowlist from the TRUSTED_PROXY_IPS environment
 * variable. Read at call time so tests can override the value per scenario.
 */
export const getTrustedProxyConfig = (): TrustedProxyConfig => ({
  trustedProxyIPs: parseTrustedProxyIPs(process.env.TRUSTED_PROXY_IPS),
});
