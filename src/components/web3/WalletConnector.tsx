import React, { useState, useEffect } from 'react';
import { scanWalletDependencies, WalletDetectionResult } from '../../utils/web3/walletDetection';

interface WalletConnectorProps {
  onConnect?: (walletType: string) => void;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ onConnect }) => {
  const [scanResult, setScanResult] = useState<WalletDetectionResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  useEffect(() => {
    const scan = async () => {
      setIsScanning(true);
      // Simulate async scan
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = scanWalletDependencies();
      setScanResult(result);
      setIsScanning(false);
    };
    scan();
  }, []);

  const handleConnect = async (walletType: string) => {
    setSelectedWallet(walletType);
    setIsConnected(true);
    if (onConnect) {
      onConnect(walletType);
    }
  };

  if (isScanning) {
    return (
      <div className="wallet-connector" role="status" aria-label="Scanning for wallets">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Scanning for wallets...</span>
        </div>
      </div>
    );
  }

  if (!scanResult || scanResult.detectedWallets.length === 0) {
    return (
      <div className="wallet-connector" role="alert" aria-label="No wallets detected">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">No wallets detected</p>
          <p className="text-yellow-600 text-sm mt-1">{scanResult?.message}</p>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          >
            Install Freighter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connector" role="region" aria-label="Wallet connection">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-3" aria-live="polite">
          {scanResult.message}
        </p>
        {!isConnected ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Select a wallet to connect:</p>
            {scanResult.hasFreighter && (
              <button
                onClick={() => handleConnect('freighter')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                aria-label="Connect Freighter wallet"
              >
                Connect Freighter
              </button>
            )}
            {scanResult.hasEthereum && (
              <button
                onClick={() => handleConnect('ethereum')}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                aria-label="Connect Ethereum wallet"
              >
                Connect Ethereum Wallet
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-green-700">✓ Connected to {selectedWallet}</p>
          </div>
        )}
      </div>
    </div>
  );
};
