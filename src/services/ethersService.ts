/**
 * Lazy-loaded Ethers.js service wrapper
 * This module dynamically imports ethers only when needed, reducing initial bundle size
 */

let ethersPromise: Promise<any> | null = null;

const loadEthers = (): Promise<any> => {
  if (!ethersPromise) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Dynamic import types resolved at runtime
    ethersPromise = import('ethers');
  }
  return ethersPromise;
};

/**
 * Get ethers library (lazy-loaded)
 */
export const getEthers = async (): Promise<any> => {
  const ethersModule = await loadEthers();
  return ethersModule.ethers;
};

/**
 * Create a wallet from private key (lazy-loaded)
 */
export const createWallet = async (privateKey: string) => {
  const ethers = await getEthers();
  return new ethers.Wallet(privateKey);
};

/**
 * Format ether value (lazy-loaded)
 */
export const formatEther = async (value: any) => {
  const ethers = await getEthers();
  return ethers.formatEther(value);
};

/**
 * Format units (lazy-loaded)
 */
export const formatUnits = async (value: any, units: number) => {
  const ethers = await getEthers();
  return ethers.formatUnits(value, units);
};

/**
 * Create contract instance (lazy-loaded)
 */
export const createContract = async (address: string, abi: any[], signerOrProvider: any) => {
  const ethers = await getEthers();
  return new ethers.Contract(address, abi, signerOrProvider);
};
