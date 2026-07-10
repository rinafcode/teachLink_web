import { createWallet, formatEther, formatUnits, createContract } from './ethersService';

/**
 * Service Account utilities
 * Uses a private key from the environment variable SERVICE_PRIVATE_KEY.
 * The address is derived from the private key and cached.
 * Ethers.js is lazy-loaded to reduce initial bundle size.
 */

const PRIVATE_KEY = process.env.SERVICE_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('SERVICE_PRIVATE_KEY is not set in environment');
}

let walletInstance: Awaited<ReturnType<typeof createWallet>> | null = null;

const getWallet = async () => {
  if (!walletInstance) {
    walletInstance = await createWallet(PRIVATE_KEY);
  }
  return walletInstance;
};

/** Get the address of the service account */
export const getServiceAddress = async (): Promise<string> => {
  const wallet = await getWallet();
  return wallet.address;
};

/** Sign an arbitrary message */
export const signMessage = async (message: string): Promise<string> => {
  const wallet = await getWallet();
  return await wallet.signMessage(message);
};

/** Send a transaction using a provider (optional) */
export const sendTransaction = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider?: any,
): Promise<string> => {
  const wallet = await getWallet();
  if (provider) {
    const signer = wallet.connect(provider);
    const response = await signer.sendTransaction(tx);
    return response.hash;
  }
  // If no provider, just return the serialized transaction as hex (useful for offline signing)
  const signedTx = await wallet.signTransaction(tx);
  return signedTx;
};

/** Get balance of the service account for a given token (default ETH) */
export const getBalance = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any,
  tokenAddress?: string,
): Promise<string> => {
  const wallet = await getWallet();
  if (!tokenAddress) {
    const balance = await provider.getBalance(wallet.address);
    return await formatEther(balance);
  }
  const erc20 = await createContract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    provider,
  );
  const balance = await erc20.balanceOf(wallet.address);
  return await formatUnits(balance, 18);
};
