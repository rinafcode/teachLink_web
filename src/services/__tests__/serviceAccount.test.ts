import {
  getServiceAddress,
  signMessage,
  sendTransaction,
  getBalance,
} from '@/services/serviceAccount';
import { ethers } from 'ethers';

describe('Service Account utilities', () => {
  beforeAll(() => {
    process.env.SERVICE_ACCOUNT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
    process.env.SERVICE_PRIVATE_KEY =
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  });

  test('getServiceAddress returns address from wallet', async () => {
    const address = await getServiceAddress();
    expect(typeof address).toBe('string');
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test('signMessage returns a signature string', async () => {
    const sig = await signMessage('test-message');
    expect(typeof sig).toBe('string');
    expect(sig).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test('sendTransaction without provider returns signed tx hex', async () => {
    const tx = {
      to: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      value: ethers.parseEther('0.01'),
    };
    const signed = await sendTransaction(tx);
    expect(typeof signed).toBe('string');
    expect(signed).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  test('getBalance returns ETH balance string', async () => {
    const provider = new ethers.InfuraProvider('goerli');
    const balance = await getBalance(provider);
    expect(typeof balance).toBe('string');
  });
});
