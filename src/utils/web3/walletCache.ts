interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class WalletCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  size(): number {
    return this.store.size;
  }
}

/** TTL constants in milliseconds */
export const CACHE_TTL = {
  BALANCE: 30_000,
  NFT: 5 * 60_000,
  DEFI_POSITIONS: 60_000,
  CHAIN_DATA: 5 * 60_000,
} as const;

/** Cache key builders */
export const walletCacheKeys = {
  nfts: (address: string, chainId: string) => `nfts:${address}:${chainId}`,
  balance: (address: string, chainId: string) => `balance:${address}:${chainId}`,
  defiPositions: (address: string) => `defi_positions:${address}`,
  addressPrefix: (address: string) => `addr:${address}:`,
} as const;

/** Shared singleton cache instance for the wallet integration */
export const walletCache = new WalletCache();
