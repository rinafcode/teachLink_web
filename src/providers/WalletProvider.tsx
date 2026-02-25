'use client';

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
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Check if wallet extension is available
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

      // Starknet wallet detection
      const starknet = (window as Window & { starknet?: { 
        enable: () => Promise<string[]>;
        selectedAddress?: string;
        isConnected?: boolean;
      }}).starknet;
      
      if (!starknet) {
        throw new Error('No Starknet wallet detected. Please install ArgentX or Braavos.');
      }

      const accounts = await starknet.enable();
      const address = accounts[0] || starknet.selectedAddress;

      if (!address) {
        throw new Error('No account available');
      }

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      // Don't rethrow - graceful degradation
      console.error('[WalletProvider] Connection failed:', message);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState(prev => ({
      ...prev,
      address: null,
      isConnected: false,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const wasConnected = typeof window !== 'undefined' && 
      localStorage.getItem('wallet_connected') === 'true';
    
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

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  
  if (!context) {
    // Return safe fallback instead of throwing - prevents build breaks
    return {
      ...initialState,
      connect: async () => { console.warn('WalletProvider not found'); },
      disconnect: async () => {},
      clearError: () => {},
    };
  }
  
  return context;
}

export default WalletProvider;
