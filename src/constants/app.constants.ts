/**
 * Application-wide constants
 * Extracting magic numbers and strings for better maintainability
 */

// Timeouts (in milliseconds)
export const DEFAULT_TOAST_DURATION = 5000;
export const DEFAULT_IDLE_TIMEOUT_MS = 2000;
export const RECONNECT_DELAY_MS = 1000;
export const MAX_TREND_POINTS = 200;
export const MAX_RETRIES = 3;

// API Timeouts
export const API_TIMEOUT_DEFAULT = 10000;
export const API_TIMEOUT_UPLOAD = 60000;
export const API_TIMEOUT_DOWNLOAD = 60000;
export const API_TIMEOUT_SEARCH = 15000;
export const API_CACHE_TTL_DEFAULT = 300000; // 5 minutes

// API URLs & Endpoints
export const DEFAULT_SOCKET_URL = 'http://localhost:3001';

// Web3 Config
export const DEFAULT_STARKNET_NETWORK = 'goerli-alpha';
export const STARKNET_NETWORKS = {
  MAINNET: {
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    explorerUrl: 'https://starkscan.co',
  },
  TESTNET: {
    rpcUrl: 'https://starknet-testnet.public.blastapi.io',
    explorerUrl: 'https://testnet.starkscan.co',
  },
  SEPOLIA: {
    rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
    explorerUrl: 'https://sepolia.starkscan.co',
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  PERF_TRENDS: 'teachlink:perf:trends',
  AUTH_TOKEN: 'token',
};
