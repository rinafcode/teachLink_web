'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useWeb3Wallet, type TransactionDetails } from '@/hooks/useWeb3Wallet';

interface TransactionManagerProps {
  className?: string;
  onTransactionSent?: (txHash: string) => void;
  onTransactionError?: (error: Error) => void;
}

interface TransactionHistory {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  from: string;
  to: string;
  value: string;
  description?: string;
}

type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * TransactionManager Component
 *
 * Provides comprehensive transaction management:
 * - Build and sign transactions
 * - Track transaction status
 * - View transaction history
 * - Manage gas settings
 * - Handle transaction errors gracefully
 *
 * Supports both EVM and Starknet chains
 */
export const TransactionManager: React.FC<TransactionManagerProps> = ({
  className = '',
  onTransactionSent,
  onTransactionError,
}) => {
  const wallet = useWeb3Wallet();
  const [showForm, setShowForm] = useState(false);
  const [txHistory, setTxHistory] = useState<TransactionHistory[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  // Form state
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasLimit, setGasLimit] = useState('21000');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /**
   * Load transaction history from localStorage
   */
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;

    const saved = localStorage.getItem(`tx_history_${wallet.address}`);
    if (saved) {
      try {
        setTxHistory(JSON.parse(saved));
      } catch (error) {
        console.error('[TransactionManager] Failed to load history:', error);
      }
    }
  }, [wallet.address]);

  /**
   * Save transaction to history
   */
  const saveToHistory = useCallback(
    (hash: string, tx: Partial<TransactionDetails>, status: 'pending' | 'success' | 'failed') => {
      const newTx: TransactionHistory = {
        hash,
        status,
        timestamp: Date.now(),
        from: wallet.address || '',
        to: tx.to || '',
        value: tx.value || '0',
      };

      const updated = [newTx, ...txHistory];
      setTxHistory(updated);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`tx_history_${wallet.address}`, JSON.stringify(updated.slice(0, 50)));
      }
    },
    [wallet.address, txHistory],
  );

  /**
   * Validate transaction form
   */
  const validateForm = (): string | null => {
    if (!toAddress.trim()) return 'Recipient address is required';
    if (!amount || parseFloat(amount) <= 0) return 'Amount must be greater than 0';
    if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) return 'Invalid Ethereum address format';
    return null;
  };

  /**
   * Handle transaction submission
   */
  const handleSubmitTransaction = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      const validationError = validateForm();
      if (validationError) {
        setTxError(validationError);
        return;
      }

      if (!wallet.isConnected) {
        setTxError('Wallet not connected');
        return;
      }

      setTxStatus('pending');
      setTxError(null);
      setTxHash(null);

      try {
        // Convert amount to Wei (for ETH)
        const valueInWei = (parseFloat(amount) * Math.pow(10, 18)).toString(16);

        const tx: Partial<TransactionDetails> = {
          to: toAddress,
          value: `0x${valueInWei}`,
          gasLimit: `0x${parseInt(gasLimit).toString(16)}`,
          data: '0x',
        };

        // Send transaction
        const hash = await wallet.sendTransaction(tx);

        setTxHash(hash);
        setTxStatus('success');
        saveToHistory(hash, tx, 'pending');
        onTransactionSent?.(hash);

        // Reset form
        setTimeout(() => {
          setToAddress('');
          setAmount('');
          setGasLimit('21000');
          setShowForm(false);
          setTxStatus('idle');
        }, 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transaction failed';
        setTxError(message);
        setTxStatus('error');
        onTransactionError?.(error instanceof Error ? error : new Error(message));

        if (txHash) {
          saveToHistory(txHash, { to: toAddress, value: amount }, 'failed');
        }
      }
    },
    [wallet, toAddress, amount, gasLimit, onTransactionSent, onTransactionError, saveToHistory],
  );

  /**
   * Format transaction amount
   */
  const formatAmount = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(4);
  };

  /**
   * Get explorer URL for transaction
   */
  const getExplorerUrl = (hash: string): string => {
    const chain = wallet.supportedChains[wallet.chainId || '0x1'];
    if (!chain) return '';
    return `${chain.explorerUrl}/tx/${hash}`;
  };

  if (!wallet.isConnected) {
    return (
      <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center ${className}`}>
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
        <p className="text-sm text-blue-700 dark:text-blue-300">Connect wallet to manage transactions</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Transaction form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-900 dark:text-white">Send Transaction</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${showForm ? 'rotate-180' : ''}`}
          />
        </button>

        {showForm && (
          <form onSubmit={handleSubmitTransaction} className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {/* Error message */}
            {txError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{txError}</p>
              </div>
            )}

            {/* Recipient address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Address
              </label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                disabled={txStatus === 'pending'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={txStatus === 'pending'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Advanced settings */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>

            {showAdvanced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gas Limit
                </label>
                <input
                  type="number"
                  value={gasLimit}
                  onChange={(e) => setGasLimit(e.target.value)}
                  disabled={txStatus === 'pending'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={txStatus === 'pending' || !wallet.isConnected}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {txStatus === 'pending' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Transaction</span>
                </>
              )}
            </button>

            {/* Success message */}
            {txStatus === 'success' && txHash && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Transaction submitted!
                  </span>
                </div>
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Transaction history */}
      {txHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {txHistory.map((tx) => (
              <div key={tx.hash} className="p-4">
                <button
                  onClick={() => setExpandedTx(expandedTx === tx.hash ? null : tx.hash)}
                  className="w-full text-left flex items-center justify-between hover:opacity-75 transition-opacity"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {tx.status === 'pending' && (
                      <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                    )}
                    {tx.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                    {tx.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm text-gray-600 dark:text-gray-400 truncate">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right ml-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatAmount(tx.value)} ETH
                    </p>
                    <span
                      className={`text-xs font-medium capitalize ${
                        tx.status === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : tx.status === 'pending'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </button>

                {expandedTx === tx.hash && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">From:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {tx.from.slice(0, 10)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">To:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {tx.to.slice(0, 10)}...
                      </span>
                    </div>
                    <a
                      href={getExplorerUrl(tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-2"
                    >
                      View Full Details
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
