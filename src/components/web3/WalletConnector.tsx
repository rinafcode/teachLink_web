'use client';

import React, { useCallback, useState } from 'react';
import { Wallet, LogOut, AlertCircle, Loader2, Copy, Check, ChevronDown } from 'lucide-react';
import { useWeb3Wallet, type WalletProvider } from '@/hooks/useWeb3Wallet';

interface WalletConnectorProps {
  className?: string;
  showBalance?: boolean;
  onConnect?: (address: string, provider: WalletProvider) => void;
  onDisconnect?: () => void;
}

/**
 * WalletConnector Component
 *
 * Provides seamless multi-wallet connection experience with support for:
 * - MetaMask
 * - Starknet (ArgentX, Braavos)
 * - WalletConnect
 * - Coinbase Wallet
 *
 * Features:
 * - Easy switching between providers
 * - Address copy-to-clipboard
 * - Connection status display
 * - Error handling and recovery
 * - Responsive design
 */
export const WalletConnector: React.FC<WalletConnectorProps> = ({
  className = '',
  showBalance = false,
  onConnect,
  onDisconnect,
}) => {
  const wallet = useWeb3Wallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const walletProviders: { id: WalletProvider; name: string; description: string }[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask extension',
    },
    {
      id: 'starknet',
      name: 'Starknet',
      description: 'Connect using ArgentX or Braavos',
    },
    // {
    //   id: 'walletconnect',
    //   name: 'WalletConnect',
    //   description: 'Connect using WalletConnect protocol',
    // },
    // {
    //   id: 'coinbase',
    //   name: 'Coinbase Wallet',
    //   description: 'Connect using Coinbase Wallet',
    // },
  ];

  /**
   * Handle wallet connection
   */
  const handleConnect = useCallback(
    async (provider: WalletProvider) => {
      try {
        const result = await wallet.connect(provider);
        setIsDropdownOpen(false);
        onConnect?.(result.address, result.provider);
      } catch (error) {
        console.error('[WalletConnector] Connection failed:', error);
      }
    },
    [wallet, onConnect],
  );

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = useCallback(async () => {
    await wallet.disconnect();
    setIsDropdownOpen(false);
    onDisconnect?.();
  }, [wallet, onDisconnect]);

  /**
   * Copy address to clipboard
   */
  const handleCopyAddress = useCallback(async () => {
    if (!wallet.address) return;

    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('[WalletConnector] Failed to copy address:', error);
    }
  }, [wallet.address]);

  /**
   * Format address for display
   */
  const formatAddress = (address: string, chars = 4): string => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={wallet.isConnecting}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-md"
            aria-label="Connect wallet"
            aria-expanded={isDropdownOpen}
          >
            {wallet.isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Select Wallet</h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {walletProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  aria-label={`Connect ${provider.name}`}
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {provider.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {provider.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {wallet.error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{wallet.error}</p>
              {wallet.error.includes('not installed') && (
                <button
                  onClick={() => wallet.clearError()}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Connected state
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
        aria-label="Wallet menu"
        aria-expanded={isDropdownOpen}
      >
        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
        <span className="hidden sm:inline">{formatAddress(wallet.address || '')}</span>
        <span className="sm:hidden">{formatAddress(wallet.address || '', 3)}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Address section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
              Connected Address
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="font-mono text-sm font-medium text-gray-900 dark:text-white break-all">
                  {wallet.address}
                </p>
              </div>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Copy address"
                title="Copy address"
              >
                {copiedAddress ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Provider and chain info */}
          <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
            {wallet.provider && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Provider</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {wallet.provider}
                </p>
              </div>
            )}
            {wallet.chainId && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Network</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {wallet.supportedChains[wallet.chainId]?.chainName || wallet.chainId}
                </p>
              </div>
            )}
          </div>

          {/* Balances section */}
          {showBalance && wallet.balances.length > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">
                Balances
              </p>
              <div className="space-y-2">
                {wallet.balances.map((balance) => (
                  <div key={balance.token} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{balance.symbol}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {parseFloat(balance.balance).toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disconnect button */}
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium flex items-center gap-2 transition-colors"
            aria-label="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;
