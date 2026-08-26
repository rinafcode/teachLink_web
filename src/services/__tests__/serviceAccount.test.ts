import { getEthers } from '../ethersService';

describe('Service Account utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SERVICE_ACCOUNT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
    process.env.SERVICE_PRIVATE_KEY =
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  });

  test('module can be imported without SERVICE_PRIVATE_KEY until it is used', async () => {
    const previousKey = process.env.SERVICE_PRIVATE_KEY;
    delete process.env.SERVICE_PRIVATE_KEY;

    try {
      const serviceAccountModule = await import('@/services/serviceAccount');
      await expect(serviceAccountModule.getServiceAddress()).rejects.toThrow(
        'SERVICE_PRIVATE_KEY is not set in environment',
      );
    } finally {
      if (previousKey) {
        process.env.SERVICE_PRIVATE_KEY = previousKey;
      } else {
        delete process.env.SERVICE_PRIVATE_KEY;
      }
    }
  });

  test('getServiceAddress returns address from wallet', async () => {
    const { getServiceAddress } = await import('@/services/serviceAccount');
    const address = await getServiceAddress();
    expect(typeof address).toBe('string');
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test('signMessage returns a signature string', async () => {
    const { signMessage } = await import('@/services/serviceAccount');
    const sig = await signMessage('test-message');
    expect(typeof sig).toBe('string');
    expect(sig).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test('sendTransaction without provider returns signed tx hex', async () => {
    const { sendTransaction } = await import('@/services/serviceAccount');
    const ethers = await getEthers();
    const tx = {
      to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      value: ethers.parseEther('0.01'),
    };
    const signed = await sendTransaction(tx);
    expect(typeof signed).toBe('string');
    expect(signed).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test('getBalance returns ETH balance string', async () => {
    const { getBalance } = await import('@/services/serviceAccount');
    const ethers = await getEthers();
    const provider = new ethers.InfuraProvider('goerli');
    const balance = await getBalance(provider);
    expect(typeof balance).toBe('string');
  });
});
