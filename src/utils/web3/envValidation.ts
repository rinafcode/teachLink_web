import { z } from 'zod';

/**
 * Web3 Environment Validation
 * Validates required environment variables for Starknet integration
 */

const envSchema = z.object({
  NEXT_PUBLIC_STARKNET_NETWORK: z.enum(['mainnet-alpha', 'goerli-alpha', 'sepolia-alpha']).default('goerli-alpha'),
  NEXT_PUBLIC_STARKNET_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Web3Config;
}

export interface Web3Config {
  network: string;
  rpcUrl: string | null;
  explorerUrl: string;
}

const NETWORKS = {
  'mainnet-alpha': {
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    explorerUrl: 'https://starkscan.co',
  },
  'goerli-alpha': {
    rpcUrl: 'https://starknet-testnet.public.blastapi.io',
    explorerUrl: 'https://testnet.starkscan.co',
  },
  'sepolia-alpha': {
    rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
    explorerUrl: 'https://sepolia.starkscan.co',
  },
} as const;

type NetworkType = keyof typeof NETWORKS;

/**
 * Validates the entire application environment.
 * Throws or returns errors for missing required variables.
 */
export function validateAppEnv(): { success: boolean; data?: EnvConfig; error?: string } {
  try {
    const data = envSchema.parse({
      NEXT_PUBLIC_STARKNET_NETWORK: process.env.NEXT_PUBLIC_STARKNET_NETWORK,
      NEXT_PUBLIC_STARKNET_RPC_URL: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map(i => i.path.join('.')).join(', ');
      return { 
        success: false, 
        error: `Invalid environment configuration. Missing or invalid fields: ${missingFields}` 
      };
    }
    return { success: false, error: 'Unknown environment validation error' };
  }
}

/**
 * Validates web3-related environment variables
 * Returns warnings instead of throwing to prevent build breaks
 */
export function validateWeb3Env(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validation = validateAppEnv();
  
  if (!validation.success) {
    errors.push(validation.error || 'Environment validation failed');
  }

  const network = process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'goerli-alpha';
  const customRpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL;

  // Validate network
  if (!Object.keys(NETWORKS).includes(network)) {
    warnings.push(`Unknown network "${network}", defaulting to goerli-alpha`);
  }

  // Check for custom RPC in production
  if (process.env.NODE_ENV === 'production' && !customRpcUrl) {
    warnings.push('Consider setting NEXT_PUBLIC_STARKNET_RPC_URL for production');
  }

  const networkConfig = NETWORKS[network as NetworkType] || NETWORKS['goerli-alpha'];

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      network,
      rpcUrl: customRpcUrl || networkConfig.rpcUrl,
      explorerUrl: networkConfig.explorerUrl,
    },
  };
}

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(
  hashOrAddress: string,
  type: 'tx' | 'contract' | 'address' = 'tx',
): string {
  const { config } = validateWeb3Env();
  const path = type === 'tx' ? 'tx' : type === 'contract' ? 'contract' : 'contract';
  return `${config.explorerUrl}/${path}/${hashOrAddress}`;
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string | null): string {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate Starknet address format
 */
export function isValidStarknetAddress(address: string): boolean {
  if (!address) return false;
  // Starknet addresses are 66 chars (0x + 64 hex chars) or shorter
  const cleanAddress = address.toLowerCase();
  return /^0x[a-f0-9]{1,64}$/i.test(cleanAddress);
}

export function getStarknetNetwork(): string {
  return process.env.NEXT_PUBLIC_STARKNET_NETWORK ?? 'goerli-alpha';
}

