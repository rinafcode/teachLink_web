import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletConnector } from '../WalletConnector';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

vi.mock('@/hooks/useWeb3Wallet', () => ({
  useWeb3Wallet: vi.fn(),
}));

describe('WalletConnector', () => {
  const mockUseWeb3Wallet = useWeb3Wallet as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Connect Wallet" button when disconnected', () => {
    mockUseWeb3Wallet.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      provider: null,
      chainId: null,
      balances: [],
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      clearError: vi.fn(),
    });

    render(<WalletConnector />);
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('renders "Connecting..." when wallet is connecting', () => {
    mockUseWeb3Wallet.mockReturnValue({
      isConnected: false,
      isConnecting: true,
      address: null,
      provider: null,
      chainId: null,
      balances: [],
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      clearError: vi.fn(),
    });

    render(<WalletConnector />);
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it('renders error message and "Dismiss" button for any error type', () => {
    const clearErrorMock = vi.fn();
    mockUseWeb3Wallet.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      address: null,
      provider: null,
      chainId: null,
      balances: [],
      error: 'Some custom Starknet connection error occurred',
      connect: vi.fn(),
      disconnect: vi.fn(),
      clearError: clearErrorMock,
    });

    render(<WalletConnector />);
    expect(screen.getByText(/some custom starknet connection error occurred/i)).toBeInTheDocument();
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(clearErrorMock).toHaveBeenCalled();
  });
});
