'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Send,
  Image,
  TrendingUp,
  ChevronDown,
  Terminal,
} from 'lucide-react';
import {
  WalletConnector,
  TransactionManager,
  NFTGallery,
  DeFiInterface,
} from '@/components/web3';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

type DemoTab = 'wallet' | 'transactions' | 'nfts' | 'defi' | 'code';

/**
 * Web3 Integration Demo Page
 *
 * Demonstrates all Web3 components working together with:
 * - Wallet connection showcase
 * - Transaction management
 * - NFT gallery
 * - DeFi interface
 * - Code examples
 */
export default function Web3DemoPage() {
  const wallet = useWeb3Wallet();
  const [activeTab, setActiveTab] = useState<DemoTab>('wallet');
  const [showCode, setShowCode] = useState(false);

  const demos: Array<{ id: DemoTab; label: string; icon: React.ReactNode }> = [
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <Send className="w-4 h-4" /> },
    { id: 'nfts', label: 'NFTs', icon: <Image className="w-4 h-4" /> },
    { id: 'defi', label: 'DeFi', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'code', label: 'Code', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Web3 Integration Demo
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Advanced wallet integration with multi-chain support
            </p>
          </div>
          <WalletConnector showBalance={true} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wallet.isConnected ? (
          <>
            {/* Wallet info card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Connected Wallet
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                  <p className="font-mono text-sm mt-1 text-gray-900 dark:text-white break-all">
                    {wallet.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Provider</p>
                  <p className="font-medium mt-1 text-gray-900 dark:text-white capitalize">
                    {wallet.provider}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
                  <p className="font-medium mt-1 text-gray-900 dark:text-white">
                    {wallet.supportedChains[wallet.chainId || '0x1']?.chainName ||
                      wallet.chainId}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {demos.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveTab(demo.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === demo.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {demo.icon}
                  {demo.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Wallet tab */}
              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Wallet Connection
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Supports multiple wallet providers with seamless connection experience:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>✓ MetaMask - EVM chains (Ethereum, Polygon, etc.)</li>
                    <li>✓ Starknet - ArgentX, Braavos wallets</li>
                    <li>✓ WalletConnect - Protocol v2</li>
                    <li>✓ Coinbase Wallet - EVM compatible</li>
                  </ul>
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <button
                      onClick={() => setActiveTab('code')}
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-sm"
                    >
                      View code example →
                    </button>
                  </div>
                </div>
              )}

              {/* Transactions tab */}
              {activeTab === 'transactions' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Transaction Manager
                  </h2>
                  <TransactionManager
                    onTransactionSent={(txHash) => {
                      console.log('Transaction sent:', txHash);
                    }}
                  />
                </div>
              )}

              {/* NFTs tab */}
              {activeTab === 'nfts' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    NFT Gallery
                  </h2>
                  <NFTGallery
                    showMintButton={true}
                    onNFTSelect={(nft) => {
                      console.log('Selected NFT:', nft);
                    }}
                  />
                </div>
              )}

              {/* DeFi tab */}
              {activeTab === 'defi' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    DeFi Interface
                  </h2>
                  <DeFiInterface
                    onStake={(protocol, amount, duration) => {
                      console.log(`Staked ${amount} in ${protocol} for ${duration} days`);
                    }}
                  />
                </div>
              )}

              {/* Code tab */}
              {activeTab === 'code' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Integration Examples
                  </h2>

                  {/* Hook usage */}
                  <div>
                    <button
                      onClick={() => setShowCode(!showCode)}
                      className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showCode ? 'rotate-180' : ''
                        }`}
                      />
                      Using the Hook
                    </button>
                    {showCode && (
                      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">
                        {`import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

export function MyComponent() {
  const wallet = useWeb3Wallet();

  return (
    <div>
      {wallet.isConnected ? (
        <>
          <p>Address: {wallet.address}</p>
          <button onClick={() => wallet.disconnect()}>
            Disconnect
          </button>
        </>
      ) : (
        <button onClick={() => wallet.connect('metamask')}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}`}
                      </pre>
                    )}
                  </div>

                  {/* Component usage */}
                  <div>
                    <button
                      onClick={() => setShowCode(!showCode)}
                      className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showCode ? 'rotate-180' : ''
                        }`}
                      />
                      Using Components
                    </button>
                    {showCode && (
                      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">
                        {`import {
  WalletConnector,
  TransactionManager,
  NFTGallery,
  DeFiInterface,
} from '@/components/web3';

export default function Page() {
  return (
    <div className="space-y-4">
      <WalletConnector showBalance={true} />
      <TransactionManager />
      <NFTGallery />
      <DeFiInterface />
    </div>
  );
}`}
                      </pre>
                    )}
                  </div>

                  {/* Security checks */}
                  <div>
                    <button
                      onClick={() => setShowCode(!showCode)}
                      className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showCode ? 'rotate-180' : ''
                        }`}
                      />
                      Security Checks
                    </button>
                    {showCode && (
                      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">
                        {`import { performSecurityChecks } from '@/utils/web3';

const result = performSecurityChecks(
  toAddress,
  value,
  userAddress,
  chainId
);

if (!result.isSecure) {
  console.error('Warnings:', result.warnings);
  console.error('Errors:', result.errors);
} else {
  console.log('Transaction is safe to proceed');
}`}
                      </pre>
                    )}
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      📖 For complete documentation, see{' '}
                      <code className="font-mono">WEB3_INTEGRATION_GUIDE.md</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // Not connected state
          <div className="text-center py-16">
            <Wallet className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Connect a wallet to explore the Web3 integration features including transaction
              management, NFT gallery, and DeFi protocols.
            </p>
            <div className="flex justify-center">
              <WalletConnector />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Web3 Integration
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Multi-chain support</li>
                <li>✓ Secure transactions</li>
                <li>✓ NFT management</li>
                <li>✓ DeFi protocols</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resources</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 TeachLink DAO. Web3 Integration by GitHub Copilot.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
