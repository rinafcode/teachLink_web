/**
 * Web3 Utilities
 * Barrel export for web3-related utilities
 */
export * from './envValidation';

export {
  validateWeb3Env,
  getExplorerUrl,
  formatAddress,
  type EnvValidationResult,
  type Web3Config,
} from './envValidation';

export { validateWalletInteraction, type WalletInteractionResult } from './walletValidation';

export {
  WalletConnectionQueue,
  walletConnectionQueue,
  type QueuedOperation,
  type QueueEntry,
  type WalletQueueStats,
} from './walletQueue';

export {
  isValidEthereumAddress,
  isValidStarknetAddress,
  isValidAddress,
  isBlacklistedAddress,
  performSecurityChecks,
  RateLimiter,
  decodeContractData,
  formatGasPrice,
  estimateGasCost,
  isValidENSName,
  toChecksumAddress,
  validateTransaction,
  walletActionRateLimiter,
  transactionRateLimiter,
  type SecurityCheckResult,
  type Web3SecurityContext,
  type ValidatedTransaction,
} from './security';
