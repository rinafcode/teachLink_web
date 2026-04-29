'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { validateWalletInteraction, safeWalletCall } from '@/utils/web3/walletValidation';

/**
 * Supported wallet providers
 */
export type WalletProvider = 'metamask' | 'starknet' | 'walletconnect' | 'coinbase';

/**
 * Chain configuration
 */
export interface ChainConfig {
  chainId: string;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Wallet balance info
 */
export interface WalletBalance {
  token: string;
  balance: string;
  decimals: number;
  symbol: string;
  usdValue?: number;
}

/**
 * Transaction details
 */
export interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  chainId: string;
}

/**
 * Wallet state
 */
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: WalletProvider | null;
  chainId: string | null;
  balances: WalletBalance[];
  error: string | null;
}

/**
 * Network configuration for supported chains
 */
const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  '0x1': {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.public.blastapi.io',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  '0x89': {
    chainId: '0x89',
    chainName: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  '0x13881': {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
};

/**
 * useWeb3Wallet - Comprehensive Web3 wallet management hook
 *
 * Handles wallet connection, balance tracking, and transaction management
 * across multiple blockchain providers with robust error handling.
 */
export function useWeb3Wallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
    chainId: null,
    balances: [],
    error: null,
  });

  const walletInteractionRef = useRef(validateWalletInteraction());

  /**
   * Connect to MetaMask wallet
   */
  const connectMetaMask = useCallback(async () => {
    return safeWalletCall(async () => {
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

      const ethereum = (window as Window & { ethereum?: any }).ethereum;
      if (!ethereum) {
        throw new Error('MetaMask not installed');
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await ethereum.request({ method: 'eth_chainId' });

      if (!accounts?.[0]) {
        throw new Error('No account available');
      }

      return {
        address: accounts[0],
        chainId,
        provider: 'metamask' as WalletProvider,
      };
    }, null);
  }, []);

  /**
   * Connect to Starknet wallet
   */
  const connectStarknet = useCallback(async () => {
    return safeWalletCall(async () => {
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

      const starknet = (window as Window & { starknet?: any }).starknet;
      if (!starknet) {
        throw new Error('Starknet wallet not installed');
      }

      const accounts = await starknet.enable();
      if (!accounts?.[0]) {
        throw new Error('No account available');
      }

      return {
        address: accounts[0],
        chainId: 'starknet',
        provider: 'starknet' as WalletProvider,
      };
    }, null);
  }, []);

  /**
   * Connect to specified wallet provider
   */
  const connect = useCallback(
    async (provider: WalletProvider = 'metamask') => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      try {
        if (!walletInteractionRef.current.canInteract) {
          throw new Error(walletInteractionRef.current.reason || 'Wallet interactions disabled');
        }

        let result;
        switch (provider) {
          case 'metamask':
            result = await connectMetaMask();
            break;
          case 'starknet':
            result = await connectStarknet();
            break;
          default:
            throw new Error(`Unsupported wallet provider: ${provider}`);
        }

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Connection failed');
        }

        setState((prev) => ({
          ...prev,
          address: result.data.address,
          isConnected: true,
          isConnecting: false,
          provider: result.data.provider,
          chainId: result.data.chainId,
          error: null,
        }));

        // Persist connection preference
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('wallet_provider', provider);
          localStorage.setItem('wallet_connected', 'true');
        }

        return result.data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect wallet';
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: message,
        }));
        throw error;
      }
    },
    [connectMetaMask, connectStarknet],
  );

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      address: null,
      isConnected: false,
      provider: null,
      chainId: null,
      balances: [],
      error: null,
    }));

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('wallet_connected');
      localStorage.removeItem('wallet_provider');
    }
  }, []);

  /**
   * Switch to specified chain
   */
  const switchChain = useCallback(async (chainId: string) => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }

      const ethereum = (window as Window & { ethereum?: any }).ethereum;
      if (!ethereum) {
        throw new Error('Wallet not available');
      }

      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      setState((prev) => ({ ...prev, chainId }));
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Sign message
   */
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      try {
        if (!state.address) {
          throw new Error('Wallet not connected');
        }

        if (typeof window === 'undefined') {
          throw new Error('Window not available');
        }

        const ethereum = (window as Window & { ethereum?: any }).ethereum;
        if (!ethereum) {
          throw new Error('Wallet not available');
        }

        const signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, state.address],
        });

        return signature;
      } catch (error) {
        throw error;
      }
    },
    [state.address],
  );

  /**
   * Send transaction
   */
  const sendTransaction = useCallback(
    async (tx: Partial<TransactionDetails>) => {
      try {
        if (!state.address) {
          throw new Error('Wallet not connected');
        }

        if (typeof window === 'undefined') {
          throw new Error('Window not available');
        }

        const ethereum = (window as Window & { ethereum?: any }).ethereum;
        if (!ethereum) {
          throw new Error('Wallet not available');
        }

        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: state.address, ...tx }],
        });

        return txHash;
      } catch (error) {
        throw error;
      }
    },
    [state.address],
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Auto-connect on mount if previously connected
   */
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof localStorage === 'undefined') return;

      const wasConnected = localStorage.getItem('wallet_connected') === 'true';
      const savedProvider = localStorage.getItem('wallet_provider') as WalletProvider;

      if (wasConnected && savedProvider) {
        try {
          await connect(savedProvider);
        } catch (error) {
          console.warn('[useWeb3Wallet] Auto-connect failed:', error);
          localStorage.removeItem('wallet_connected');
        }
      }
    };

    autoConnect();
  }, [connect]);

  /**
   * Listen for account and chain changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ethereum = (window as Window & { ethereum?: any }).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        setState((prev) => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState((prev) => ({ ...prev, chainId }));
      window.location.reload(); // Reload on chain change to update contract references
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.address, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    switchChain,
    signMessage,
    sendTransaction,
    clearError,
    supportedChains: SUPPORTED_CHAINS,
  };
}
