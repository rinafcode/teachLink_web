/**
 * Web3 Components - Barrel export
 *
 * Provides seamless Web3 wallet integration and blockchain interactions:
 * - Multi-wallet connection (MetaMask, Starknet, WalletConnect, Coinbase)
 * - Transaction management with status tracking
 * - NFT gallery and interaction  - DeFi staking and rewards UI
 * - Real-time blockchain data
 * - Comprehensive security features
 */

export { WalletConnector } from './WalletConnector';
export type { default as WalletConnectorType } from './WalletConnector';

export { TransactionManager } from './TransactionManager';
export type { default as TransactionManagerType } from './TransactionManager';

export { NFTGallery } from './NFTGallery';
export type { default as NFTGalleryType } from './NFTGallery';

export { DeFiInterface } from './DeFiInterface';
export type { default as DeFiInterfaceType } from './DeFiInterface';
