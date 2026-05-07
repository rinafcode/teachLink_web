/**
 * Web3 Security and Validation Utilities
 *
 * Provides comprehensive security checks and validations for:
 * - Address validation
 * - Smart contract interactions
 * - Transaction security
 * - Phishing detection
 * - Rate limiting
 */

import { z } from 'zod';

/**
 * Address validation schema
 */
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export const starknetAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{60,66}$/, 'Invalid Starknet address');

/**
 * Transaction security checks result
 */
export interface SecurityCheckResult {
  isSecure: boolean;
  warnings: string[];
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Web3 security context
 */
export interface Web3SecurityContext {
  checksPerformed: string[];
  timestamp: number;
  userAddress: string;
  chainId: string;
}

/**
 * Known malicious addresses (updated periodically)
 */
const KNOWN_MALICIOUS_ADDRESSES = new Set<string>([
  // Add known malicious addresses here
]);

/**
 * Known phishing domains
 */
const KNOWN_PHISHING_DOMAINS = new Set<string>([
  // Add known phishing domains here
]);

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return addressSchema.safeParse(address).success;
}

/**
 * Validate Starknet address format
 */
export function isValidStarknetAddress(address: string): boolean {
  return starknetAddressSchema.safeParse(address).success;
}

/**
 * Validate any blockchain address
 */
export function isValidAddress(
  address: string,
  chainType: 'ethereum' | 'starknet' = 'ethereum',
): boolean {
  if (chainType === 'starknet') {
    return isValidStarknetAddress(address);
  }
  return isValidEthereumAddress(address);
}

/**
 * Check if address is blacklisted
 */
export function isBlacklistedAddress(address: string): boolean {
  return KNOWN_MALICIOUS_ADDRESSES.has(address.toLowerCase());
}

/**
 * Perform comprehensive security checks on transaction
 */
export function performSecurityChecks(
  toAddress: string,
  value: string,
  userAddress: string,
  chainId: string,
): SecurityCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check recipient address validity
  if (!isValidAddress(toAddress)) {
    errors.push('Invalid recipient address format');
  }

  // Check if recipient is blacklisted
  if (isBlacklistedAddress(toAddress)) {
    errors.push('Recipient address is flagged as potentially malicious');
  }

  // Check for zero address (burn address)
  if (toAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    warnings.push('Sending to zero address will burn tokens');
  }

  // Check if sender and recipient are the same
  if (toAddress.toLowerCase() === userAddress.toLowerCase()) {
    warnings.push('Sending to yourself');
  }

  // Check transaction value
  const valueNumber = parseFloat(value || '0');
  if (valueNumber > 100) {
    warnings.push('Large transaction amount detected');
  }

  if (valueNumber < 0) {
    errors.push('Invalid transaction amount');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (errors.length > 0) {
    riskLevel = 'high';
  } else if (warnings.length > 1) {
    riskLevel = 'medium';
  } else if (warnings.length > 0) {
    riskLevel = 'low';
  }

  return {
    isSecure: errors.length === 0,
    warnings,
    errors,
    riskLevel,
  };
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is rate limited
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }

    // Record new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return false;
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Get remaining attempts
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }
}

/**
 * Decode contract data
 */
export function decodeContractData(data: string): {
  method: string;
  params: Record<string, unknown>;
} | null {
  try {
    if (!data || data === '0x') {
      return null;
    }

    const methodId = data.slice(0, 10);
    const params = data.slice(10);

    return {
      method: methodId,
      params: { encoded: params },
    };
  } catch (error) {
    console.error('[Web3Utils] Error decoding contract data:', error);
    return null;
  }
}

/**
 * Format gas price
 */
export function formatGasPrice(gasPrice: string | number, decimals: number = 9): string {
  const num = typeof gasPrice === 'string' ? parseFloat(gasPrice) : gasPrice;
  return (num / Math.pow(10, decimals)).toFixed(2);
}

/**
 * Estimate gas cost
 */
export function estimateGasCost(
  gasLimit: string | number,
  gasPrice: string | number,
  ethPrice: number = 0,
): { wei: string; eth: string; usd: string } {
  const limit = typeof gasLimit === 'string' ? parseFloat(gasLimit) : gasLimit;
  const price = typeof gasPrice === 'string' ? parseFloat(gasPrice) : gasPrice;

  const wei = (limit * price).toFixed(0);
  const eth = (parseFloat(wei) / Math.pow(10, 18)).toString();
  const usd = (parseFloat(eth) * ethPrice).toFixed(2);

  return { wei, eth, usd };
}

/**
 * Validates if string is a valid ENS name
 */
export function isValidENSName(name: string): boolean {
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+eth$/.test(name.toLowerCase());
}

/**
 * Parse and format address checksum
 */
export function toChecksumAddress(address: string): string {
  if (!isValidEthereumAddress(address)) {
    return address;
  }

  const addr = address.slice(2);
  const hash = Array.from(addr)
    .map((char) => `0${char.charCodeAt(0).toString(16)}`.slice(-2))
    .join('');

  let checksum = '0x';
  for (let i = 0; i < addr.length; i++) {
    const char = addr[i];
    const hashValue = parseInt(hash[i * 2], 16);
    checksum += hashValue >= 8 ? char.toUpperCase() : char.toLowerCase();
  }

  return checksum;
}

/**
 * Validate transaction details structure
 */
export const transactionSchema = z.object({
  to: z.string(),
  from: z.string().optional(),
  value: z.string().optional(),
  data: z.string().optional(),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional(),
  nonce: z.number().optional(),
});

export type ValidatedTransaction = z.infer<typeof transactionSchema>;

/**
 * Safely validate and parse transaction
 */
export function validateTransaction(tx: unknown): {
  valid: boolean;
  data?: ValidatedTransaction;
  error?: string;
} {
  try {
    const validated = transactionSchema.parse(tx);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Invalid transaction' };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}

/**
 * Export rate limiter instance for use across app
 */
export const walletActionRateLimiter = new RateLimiter(5, 60000);
export const transactionRateLimiter = new RateLimiter(10, 300000); // 5 minutes
