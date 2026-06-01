import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WalletCache, walletCache, walletCacheKeys, CACHE_TTL } from '../web3/walletCache';

describe('WalletCache', () => {
  let cache: WalletCache;

  beforeEach(() => {
    cache = new WalletCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set / get', () => {
    it('returns null for a missing key', () => {
      expect(cache.get('missing')).toBeNull();
    });

    it('returns cached data before TTL expires', () => {
      cache.set('key', { value: 42 }, 5000);
      expect(cache.get('key')).toEqual({ value: 42 });
    });

    it('returns null after TTL expires', () => {
      cache.set('key', 'data', 1000);
      vi.advanceTimersByTime(1001);
      expect(cache.get('key')).toBeNull();
    });

    it('overwrites an existing entry', () => {
      cache.set('key', 'first', 5000);
      cache.set('key', 'second', 5000);
      expect(cache.get('key')).toBe('second');
    });
  });

  describe('has', () => {
    it('returns false for a missing key', () => {
      expect(cache.has('x')).toBe(false);
    });

    it('returns true for a live key', () => {
      cache.set('x', 1, 5000);
      expect(cache.has('x')).toBe(true);
    });

    it('returns false for an expired key', () => {
      cache.set('x', 1, 500);
      vi.advanceTimersByTime(501);
      expect(cache.has('x')).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes the entry so get returns null', () => {
      cache.set('key', 'val', 5000);
      cache.delete('key');
      expect(cache.get('key')).toBeNull();
    });

    it('is a no-op for non-existent keys', () => {
      expect(() => cache.delete('ghost')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', 1, 5000);
      cache.set('b', 2, 5000);
      cache.clear();
      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('invalidateByPrefix', () => {
    it('removes only entries matching the prefix', () => {
      cache.set('nfts:0xabc:0x1', ['nft1'], 5000);
      cache.set('nfts:0xabc:0x89', ['nft2'], 5000);
      cache.set('balance:0xabc:0x1', ['bal'], 5000);

      cache.invalidateByPrefix('nfts:0xabc:');

      expect(cache.get('nfts:0xabc:0x1')).toBeNull();
      expect(cache.get('nfts:0xabc:0x89')).toBeNull();
      expect(cache.get('balance:0xabc:0x1')).toEqual(['bal']);
    });

    it('is a no-op when no keys match the prefix', () => {
      cache.set('foo', 'bar', 5000);
      cache.invalidateByPrefix('baz:');
      expect(cache.get('foo')).toBe('bar');
    });
  });

  describe('size', () => {
    it('reflects the number of stored (including expired) entries before eviction', () => {
      cache.set('a', 1, 5000);
      cache.set('b', 2, 5000);
      expect(cache.size()).toBe(2);
    });

    it('decreases after delete', () => {
      cache.set('a', 1, 5000);
      cache.delete('a');
      expect(cache.size()).toBe(0);
    });
  });
});

describe('walletCacheKeys', () => {
  it('builds nft key from address and chainId', () => {
    expect(walletCacheKeys.nfts('0xabc', '0x1')).toBe('nfts:0xabc:0x1');
  });

  it('builds balance key from address and chainId', () => {
    expect(walletCacheKeys.balance('0xabc', '0x89')).toBe('balance:0xabc:0x89');
  });

  it('builds defiPositions key from address', () => {
    expect(walletCacheKeys.defiPositions('0xabc')).toBe('defi_positions:0xabc');
  });

  it('builds addressPrefix key', () => {
    expect(walletCacheKeys.addressPrefix('0xabc')).toBe('addr:0xabc:');
  });
});

describe('CACHE_TTL', () => {
  it('BALANCE is 30 seconds', () => {
    expect(CACHE_TTL.BALANCE).toBe(30_000);
  });

  it('NFT is 5 minutes', () => {
    expect(CACHE_TTL.NFT).toBe(300_000);
  });

  it('DEFI_POSITIONS is 60 seconds', () => {
    expect(CACHE_TTL.DEFI_POSITIONS).toBe(60_000);
  });
});

describe('walletCache singleton', () => {
  afterEach(() => {
    walletCache.clear();
  });

  it('is a shared WalletCache instance', () => {
    expect(walletCache).toBeInstanceOf(WalletCache);
  });

  it('persists data across imports', () => {
    walletCache.set('shared', true, 5000);
    expect(walletCache.get('shared')).toBe(true);
  });
});
