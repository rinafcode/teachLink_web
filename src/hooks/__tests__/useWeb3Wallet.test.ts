import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeb3Wallet } from '../useWeb3Wallet';

describe('useWeb3Wallet', () => {
  let mockEthereum: any;
  let mockStarknet: any;

  beforeEach(() => {
    vi.useFakeTimers();
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.clear();

      // Mock window.ethereum
      mockEthereum = {
        request: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      };
      Object.defineProperty(window, 'ethereum', {
        writable: true,
        configurable: true,
        value: mockEthereum,
      });

      // Mock window.starknet
      mockStarknet = {
        enable: vi.fn(),
        selectedAddress:
          '0xstarkaddress123456789012345678901234567890123456789012345678901234567890',
        on: vi.fn(),
        removeListener: vi.fn(),
      };
      Object.defineProperty(window, 'starknet', {
        writable: true,
        configurable: true,
        value: mockStarknet,
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (typeof window !== 'undefined') {
      delete (window as any).ethereum;
      delete (window as any).starknet;
    }
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWeb3Wallet());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.provider).toBeNull();
    expect(result.current.chainId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should successfully connect to MetaMask', async () => {
    mockEthereum.request.mockImplementation(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') return ['0x1234567890123456789012345678901234567890'];
      if (method === 'eth_chainId') return '0x1';
      return null;
    });

    const { result } = renderHook(() => useWeb3Wallet());

    await act(async () => {
      await result.current.connect('metamask');
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
    expect(result.current.provider).toBe('metamask');
    expect(result.current.chainId).toBe('0x1');
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('wallet_connected')).toBe('true');
    expect(localStorage.getItem('wallet_provider')).toBe('metamask');
  });

  it('should successfully connect to Starknet', async () => {
    mockStarknet.enable.mockResolvedValue([
      '0xstarkaddress123456789012345678901234567890123456789012345678901234567890',
    ]);

    const { result } = renderHook(() => useWeb3Wallet());

    await act(async () => {
      await result.current.connect('starknet');
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe(
      '0xstarkaddress123456789012345678901234567890123456789012345678901234567890',
    );
    expect(result.current.provider).toBe('starknet');
    expect(result.current.chainId).toBe('starknet');
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('wallet_connected')).toBe('true');
    expect(localStorage.getItem('wallet_provider')).toBe('starknet');
  });

  it('should disconnect successfully', async () => {
    mockEthereum.request.mockImplementation(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') return ['0x1234567890123456789012345678901234567890'];
      if (method === 'eth_chainId') return '0x1';
      return null;
    });

    const { result } = renderHook(() => useWeb3Wallet());

    await act(async () => {
      await result.current.connect('metamask');
    });

    expect(result.current.isConnected).toBe(true);

    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.provider).toBeNull();
    expect(localStorage.getItem('wallet_connected')).toBeNull();
  });

  it('should prevent MetaMask events from corrupting Starknet connection state', async () => {
    let mockAccountListener: ((accounts: string[]) => void) | null = null;
    mockEthereum.on.mockImplementation((event: string, callback: any) => {
      if (event === 'accountsChanged') {
        mockAccountListener = callback;
      }
    });

    mockStarknet.enable.mockResolvedValue(['0xstarkaddress']);

    const { result } = renderHook(() => useWeb3Wallet());

    // Connect to Starknet
    await act(async () => {
      await result.current.connect('starknet');
    });

    expect(result.current.provider).toBe('starknet');
    expect(result.current.address).toBe('0xstarkaddress');

    // Trigger accountsChanged event on MetaMask window.ethereum
    act(() => {
      if (mockAccountListener) {
        mockAccountListener([]);
      }
    });

    // Starknet connection should remain intact
    expect(result.current.isConnected).toBe(true);
    expect(result.current.provider).toBe('starknet');
    expect(result.current.address).toBe('0xstarkaddress');
  });

  it('should update Starknet connection state when Starknet accountsChanged event is fired', async () => {
    let mockAccountListener: ((accounts: string[]) => void) | null = null;
    mockStarknet.on.mockImplementation((event: string, callback: any) => {
      if (event === 'accountsChanged') {
        mockAccountListener = callback;
      }
    });

    mockStarknet.enable.mockResolvedValue(['0xstarkaddress']);

    const { result } = renderHook(() => useWeb3Wallet());

    // Connect to Starknet
    await act(async () => {
      await result.current.connect('starknet');
    });

    expect(result.current.provider).toBe('starknet');
    expect(result.current.address).toBe('0xstarkaddress');

    // Trigger accountsChanged event on Starknet with empty accounts
    await act(async () => {
      if (mockAccountListener) {
        mockAccountListener([]);
      }
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
  });
});
