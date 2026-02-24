/**
 * Web3 Utilities
 * Barrel export for web3-related utilities
 */

export {
  validateWeb3Env,
  getExplorerUrl,
  formatAddress,
  isValidStarknetAddress,
  type EnvValidationResult,
  type Web3Config,
} from './envValidation';

export { validateWalletInteraction, type WalletInteractionResult } from './walletValidation';
