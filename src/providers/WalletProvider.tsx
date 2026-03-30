'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Restore session on mount
    const saved = localStorage.getItem('wallet_address');
    if (saved) {
      setAddress(saved);
      setIsConnected(true);
    }
  }, []);

  const connect = async () => {
    try {
      if (typeof window === 'undefined') return;
      // Wallet connection logic placeholder
      const mockAddress = '0x0000000000000000000000000000000000000000';
      setAddress(mockAddress);
      setIsConnected(true);
      localStorage.setItem('wallet_address', mockAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnect = () => {
    try {
      setAddress(null);
      setIsConnected(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wallet_address');
      }
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
    }
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect }}>
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Environment validation for wallet config
const validateWalletEnv = () => {
  const warnings: string[] = [];

  if (!process.env.NEXT_PUBLIC_STARKNET_NETWORK) {
    warnings.push('NEXT_PUBLIC_STARKNET_NETWORK not set, defaulting to testnet');
  }

  if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
    console.warn('[WalletProvider] Environment warnings:', warnings);
  }

  return {
    network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'goerli-alpha',
    isValid: true, // Non-blocking - app works without wallet
  };
};

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  network: string;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

const initialState: WalletState = {
  address: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  network: 'goerli-alpha',
};

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>(() => ({
    ...initialState,
    network: validateWalletEnv().network,
  }));

  // Safe wallet connection with error boundary
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if wallet extension is available
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

      // Starknet wallet detection
      const starknet = (
        window as Window & {
          starknet?: {
            enable: () => Promise<string[]>;
            selectedAddress?: string;
            isConnected?: boolean;
          };
        }
      ).starknet;

      if (!starknet) {
        throw new Error('No Starknet wallet detected. Please install ArgentX or Braavos.');
      }

      const accounts = await starknet.enable();
      const address = accounts[0] || starknet.selectedAddress;

      if (!address) {
        throw new Error('No account available');
      }

      setState((prev) => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      // Don't rethrow - graceful degradation
      console.error('[WalletProvider] Connection failed:', message);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      address: null,
      isConnected: false,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const wasConnected =
      typeof window !== 'undefined' && localStorage.getItem('wallet_connected') === 'true';

    if (wasConnected) {
      connect().catch(() => {
        // Silent fail on auto-reconnect
        localStorage.removeItem('wallet_connected');
      });
    }
  }, [connect]);

  // Persist connection state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (state.isConnected) {
        localStorage.setItem('wallet_connected', 'true');
      } else {
        localStorage.removeItem('wallet_connected');
      }
    }
  }, [state.isConnected]);

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === null) {
    return { address: null, isConnected: false, connect: async () => {}, disconnect: () => {} };
  }
  return context;
}
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);

  if (!context) {
    // Return safe fallback instead of throwing - prevents build breaks
    return {
      ...initialState,
      connect: async () => {
        console.warn('WalletProvider not found');
      },
      disconnect: async () => {},
      clearError: () => {},
    };
  }

  return context;
}

export default WalletProvider;
