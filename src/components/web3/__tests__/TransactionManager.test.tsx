import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TransactionManager } from '../TransactionManager';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

vi.mock('@/hooks/useWeb3Wallet', () => ({
  useWeb3Wallet: vi.fn(),
}));

describe('TransactionManager', () => {
  const mockWallet = {
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    provider: 'metamask',
    chainId: '0x1',
    supportedChains: {
      '0x1': {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        rpcUrl: 'https://eth.rpc',
        explorerUrl: 'https://etherscan.io',
      },
    },
    sendTransaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders connect message when wallet is disconnected', () => {
    vi.mocked(useWeb3Wallet).mockReturnValue({
      ...mockWallet,
      isConnected: false,
      address: null,
    } as any);

    render(<TransactionManager />);
    expect(screen.getByText(/Connect wallet to manage transactions/i)).toBeInTheDocument();
  });

  it('loads and displays transaction history when connected', () => {
    vi.mocked(useWeb3Wallet).mockReturnValue(mockWallet as any);

    const mockHistory = [
      {
        hash: '0xmocktxhash123456789',
        status: 'success',
        timestamp: Date.now(),
        from: mockWallet.address,
        to: '0xrecipientaddress',
        value: '1.5',
      },
    ];

    localStorage.setItem(`tx_history_${mockWallet.address}`, JSON.stringify(mockHistory));

    render(<TransactionManager />);

    expect(screen.getByText(/Recent Transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/1.5 ETH/i)).toBeInTheDocument();
  });

  it('clears transaction history state when wallet is disconnected', async () => {
    vi.mocked(useWeb3Wallet).mockReturnValue(mockWallet as any);

    const mockHistory = [
      {
        hash: '0xmocktxhash123456789',
        status: 'success',
        timestamp: Date.now(),
        from: mockWallet.address,
        to: '0xrecipientaddress',
        value: '1.5',
      },
    ];
    localStorage.setItem(`tx_history_${mockWallet.address}`, JSON.stringify(mockHistory));

    const { rerender } = render(<TransactionManager />);
    expect(screen.getByText(/1.5 ETH/i)).toBeInTheDocument();

    // Rerender with disconnected wallet
    vi.mocked(useWeb3Wallet).mockReturnValue({
      ...mockWallet,
      isConnected: false,
      address: null,
    } as any);

    rerender(<TransactionManager />);
    expect(screen.queryByText(/Recent Transactions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1.5 ETH/i)).not.toBeInTheDocument();
  });

  it('resets transaction history when switching to a wallet with no history', () => {
    // Start with Wallet A containing history
    vi.mocked(useWeb3Wallet).mockReturnValue(mockWallet as any);

    const mockHistoryA = [
      {
        hash: '0xmocktxhashwalletA',
        status: 'success',
        timestamp: Date.now(),
        from: mockWallet.address,
        to: '0xrecipient',
        value: '1.5',
      },
    ];
    localStorage.setItem(`tx_history_${mockWallet.address}`, JSON.stringify(mockHistoryA));

    const { rerender } = render(<TransactionManager />);
    expect(screen.getByText(/1.5 ETH/i)).toBeInTheDocument();

    // Switch to Wallet B (which has no saved history in localStorage)
    const walletAddressB = '0x9876543210987654321098765432109876543210';
    vi.mocked(useWeb3Wallet).mockReturnValue({
      ...mockWallet,
      address: walletAddressB,
    } as any);

    rerender(<TransactionManager />);
    expect(screen.queryByText(/1.5 ETH/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recent Transactions/i)).not.toBeInTheDocument();
  });
});
