'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

// Environment validation for wallet config
const validateWalletEnv = () => {
  const warnings: string[] = [];

  if (typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_STARKNET_NETWORK) {
    warnings.push('NEXT_PUBLIC_STARKNET_NETWORK not set, defaulting to testnet');
  }

  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    warnings.length > 0
  ) {
    console.warn('[WalletProvider] Environment warnings:', warnings);
  }

  return {
    network:
      (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_STARKNET_NETWORK : null) ||
      'goerli-alpha',
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

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

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

  useEffect(() => {
    const wasConnected =
      typeof window !== 'undefined' && localStorage.getItem('wallet_connected') === 'true';

    if (wasConnected) {
      connect().catch(() => {
        localStorage.removeItem('wallet_connected');
      });
    }
  }, [connect]);

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

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);

  if (!context) {
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
