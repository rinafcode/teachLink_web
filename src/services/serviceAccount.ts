import { ethers } from 'ethers';

/**
 * Service Account utilities
 * Uses a private key from the environment variable SERVICE_PRIVATE_KEY.
 * The address is derived from the private key and cached.
 */

const PRIVATE_KEY = process.env.SERVICE_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error('SERVICE_PRIVATE_KEY is not set in environment');
}

// Create an ethers Wallet instance (no provider, used for signing only)
const wallet = new ethers.Wallet(PRIVATE_KEY);

/** Get the address of the service account */
export const getServiceAddress = (): string => {
  return wallet.address;
};

/** Sign an arbitrary message */
export const signMessage = async (message: string): Promise<string> => {
  return await wallet.signMessage(message);
};

/** Send a transaction using a provider (optional) */
export const sendTransaction = async (
  tx: ethers.providers.TransactionRequest,
  provider?: ethers.providers.Provider,
): Promise<string> => {
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
  provider: ethers.providers.Provider,
  tokenAddress?: string,
): Promise<string> => {
  if (!tokenAddress) {
    const balance = await provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  }
  const erc20 = new ethers.Contract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    provider,
  );
  const balance: ethers.BigNumber = await erc20.balanceOf(wallet.address);
  return ethers.formatUnits(balance, 18);
};
