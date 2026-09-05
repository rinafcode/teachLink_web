import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ethersService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('lazy-loads ethers successfully through the circuit breaker', async () => {
    const { getEthers } = await import('../ethersService');

    const [first, second] = await Promise.all([getEthers(), getEthers()]);

    expect(first).toBe(second);
    expect(first).toHaveProperty('Wallet');
    expect(first).toHaveProperty('Contract');
  });
});
