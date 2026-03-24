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
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === null) {
    return { address: null, isConnected: false, connect: async () => {}, disconnect: () => {} };
  }
  return context;
}
