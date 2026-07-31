/**
 * Lazy-loaded Ethers.js service wrapper
 * This module dynamically imports ethers only when needed, reducing initial bundle size
 */

type EthersModule = typeof import('ethers');

let ethersPromise: Promise<EthersModule> | null = null;

const loadEthers = (): Promise<EthersModule> => {
  if (!ethersPromise) {
    ethersPromise = import('ethers');
  }
  return ethersPromise;
};

/**
 * Get ethers library (lazy-loaded)
 */
export const getEthers = async (): Promise<EthersModule['ethers']> => {
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
export const formatEther = async (value: string | bigint) => {
  const ethers = await getEthers();
  return ethers.formatEther(value);
};

/**
 * Format units (lazy-loaded)
 */
export const formatUnits = async (value: string | bigint, units: number) => {
  const ethers = await getEthers();
  return ethers.formatUnits(value, units);
};

/**
 * Create contract instance (lazy-loaded)
 */
export const createContract = async (
  address: string,
  abi: string | readonly string[],
  signerOrProvider: unknown,
) => {
  const ethers = await getEthers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new ethers.Contract(address, abi as any, signerOrProvider as any);
};
