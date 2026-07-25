import { scanWalletDependencies } from '../walletDetection';

describe('scanWalletDependencies', () => {
  it('should return detected wallets object', () => {
    const result = scanWalletDependencies();
    expect(result).toHaveProperty('hasFreighter');
    expect(result).toHaveProperty('hasEthereum');
    expect(result).toHaveProperty('hasStarknet');
    expect(result).toHaveProperty('detectedWallets');
    expect(result).toHaveProperty('message');
  });

  it('should return message when no wallets detected', () => {
    const result = scanWalletDependencies();
    if (result.detectedWallets.length === 0) {
      expect(result.message).toContain('No wallets detected');
    }
  });
});
