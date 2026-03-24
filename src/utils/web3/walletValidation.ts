/**
 * Wallet Interaction Validation
 * Safe checks for wallet operations that won't break builds
 */

export interface WalletInteractionResult {
  canInteract: boolean;
  reason: string | null;
}

/**
 * Check if wallet interactions are possible in current environment
 * Returns safe result - never throws
 */
export function validateWalletInteraction(): WalletInteractionResult {
  // SSR check
  if (typeof window === 'undefined') {
    return {
      canInteract: false,
      reason: 'Server-side rendering - wallet interactions disabled',
    };
  }

  // Check for Starknet wallet
  const hasStarknet = !!(window as Window & { starknet?: unknown }).starknet;
  
  if (!hasStarknet) {
    return {
      canInteract: false,
      reason: 'No Starknet wallet extension detected',
    };
  }

  return {
    canInteract: true,
    reason: null,
  };
}

/**
 * Safe wrapper for wallet operations
 * Catches errors and returns structured result
 */
export async function safeWalletCall<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<{ success: boolean; data: T; error: string | null }> {
  try {
    const data = await operation();
    return { success: true, data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown wallet error';
    console.error('[safeWalletCall]', message);
    return { success: false, data: fallback, error: message };
  }
}
