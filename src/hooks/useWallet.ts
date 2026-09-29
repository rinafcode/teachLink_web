import { useWallet as useWalletContext } from '@/providers/WalletProvider';

export function useWallet() {
  const wallet = useWalletContext();

  return {
    ...wallet,
    connected: wallet.isConnected,
    publicKey: wallet.address,
  };
}