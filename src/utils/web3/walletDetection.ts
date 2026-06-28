export interface WalletDetectionResult {
  hasFreighter: boolean;
  hasFreighterInstalled: boolean;
  hasEthereum: boolean;
  hasStarknet: boolean;
  detectedWallets: string[];
  message: string;
}

export function scanWalletDependencies(): WalletDetectionResult {
  const detectedWallets: string[] = [];

  // Check for Freighter (Stellar)
  const hasFreighter = typeof window !== 'undefined' && !!(window as any).stellar?.freighter;
  if (hasFreighter) {
    detectedWallets.push('Freighter');
  }

  // Check for Ethereum wallets (MetaMask, etc.)
  const hasEthereum = typeof window !== 'undefined' && !!(window as any).ethereum;
  if (hasEthereum) {
    detectedWallets.push('Ethereum (MetaMask)');
  }

  // Check for Starknet wallets
  const hasStarknet = typeof window !== 'undefined' && !!(window as any).starknet;
  if (hasStarknet) {
    detectedWallets.push('Starknet');
  }

  let message = '';
  if (detectedWallets.length > 0) {
    message = `Detected wallets: ${detectedWallets.join(', ')}`;
  } else {
    message = 'No wallets detected. Please install Freighter (Stellar) to get started.';
  }

  return {
    hasFreighter,
    hasFreighterInstalled: hasFreighter,
    hasEthereum,
    hasStarknet,
    detectedWallets,
    message,
  };
}
