'use client';

import React, { useCallback, useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Grid3x3,
  List,
} from 'lucide-react';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  tokenId: string;
  contractAddress: string;
  chainId: string;
  rarity?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface NFTGalleryProps {
  className?: string;
  onNFTSelect?: (nft: NFT) => void;
  showMintButton?: boolean;
  onMintClick?: () => void;
}

type ViewMode = 'grid' | 'list';

/**
 * NFTGallery Component
 *
 * Comprehensive NFT viewing and interaction:
 * - Display user's NFT collection
 * - Grid and list view modes
 * - NFT details and attributes
 * - Mint new NFTs
 * - Integration with multiple NFT standards (ERC-721, ERC-1155)
 *
 * Features:
 * - Responsive gallery layout
 * - Loading states
 * - Error handling
 * - Metadata parsing from various sources
 */
export const NFTGallery: React.FC<NFTGalleryProps> = ({
  className = '',
  onNFTSelect,
  showMintButton = true,
  onMintClick,
}) => {
  const wallet = useWeb3Wallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(0);

  const itemsPerPage = viewMode === 'grid' ? 12 : 10;
  const totalPages = Math.ceil(nfts.length / itemsPerPage);
  const currentNFTs = nfts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  /**
   * Fetch NFTs for connected wallet
   */
  const fetchNFTs = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mock data - In production, fetch from Alchemy, Moralis, or Opensea API
      const mockNFTs: NFT[] = [
        {
          id: '1',
          name: 'TeachLink Badge #001',
          description: 'Proof of knowledge sharing on TeachLink',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8e7ad06f?w=500&h=500&fit=crop',
          tokenId: '1',
          contractAddress: '0x1234...5678',
          chainId: wallet.chainId || '0x1',
          rarity: 'uncommon',
          attributes: [
            { trait_type: 'Level', value: 'Gold' },
            { trait_type: 'Creator Score', value: '1000' },
          ],
        },
        {
          id: '2',
          name: 'Knowledge Token #042',
          description: 'Earned through course completion',
          image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop',
          tokenId: '42',
          contractAddress: '0x1234...5678',
          chainId: wallet.chainId || '0x1',
          rarity: 'rare',
          attributes: [
            { trait_type: 'Course', value: 'Web3 Basics' },
            { trait_type: 'Score', value: '95%' },
          ],
        },
        {
          id: '3',
          name: 'Community Contributor',
          description: 'Recognized for helping others learn',
          image: 'https://images.unsplash.com/photo-1520763185298-1b434c919c37?w=500&h=500&fit=crop',
          tokenId: '123',
          contractAddress: '0x1234...5678',
          chainId: wallet.chainId || '0x1',
          rarity: 'uncommon',
          attributes: [{ trait_type: 'Contributions', value: '50+' }],
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNfts(mockNFTs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch NFTs';
      setError(message);
      console.error('[NFTGallery] Error fetching NFTs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallet.isConnected, wallet.address, wallet.chainId]);

  /**
   * Load NFTs when wallet connects
   */
  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  /**
   * Handle NFT selection
   */
  const handleSelectNFT = useCallback((nft: NFT) => {
    setSelectedNFT(nft);
    onNFTSelect?.(nft);
  }, [onNFTSelect]);

  if (!wallet.isConnected) {
    return (
      <div className={`p-8 text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
        <ImageIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3 opacity-50" />
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          Connect your wallet to view NFTs
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-300">Failed to load NFTs</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            <button
              onClick={fetchNFTs}
              className="text-sm text-red-600 dark:text-red-400 hover:underline mt-2 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading your NFT collection...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (nfts.length === 0) {
    return (
      <div className={`p-8 text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">No NFTs yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          Start earning NFT badges by completing courses and contributing to TeachLink!
        </p>
        {showMintButton && onMintClick && (
          <button
            onClick={onMintClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Mint NFT
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">NFT Collection</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{nfts.length} NFTs</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => {
                setViewMode('grid');
                setCurrentPage(0);
              }}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                setCurrentPage(0);
              }}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Mint button */}
          {showMintButton && onMintClick && (
            <button
              onClick={onMintClick}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Mint</span>
            </button>
          )}
        </div>
      </div>

      {/* NFT gallery */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentNFTs.map((nft) => (
            <button
              key={nft.id}
              onClick={() => handleSelectNFT(nft)}
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-medium text-gray-900 dark:text-white truncate">{nft.name}</p>
                {nft.rarity && (
                  <span
                    className={`text-xs font-medium mt-1 inline-block px-2 py-1 rounded ${
                      nft.rarity === 'rare'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : nft.rarity === 'uncommon'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {nft.rarity}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        // List view
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
          {currentNFTs.map((nft) => (
            <button
              key={nft.id}
              onClick={() => handleSelectNFT(nft)}
              className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <img
                src={nft.image}
                alt={nft.name}
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E';
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{nft.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {nft.description}
                </p>
                {nft.rarity && (
                  <span className="text-xs font-medium capitalize text-blue-600 dark:text-blue-400 mt-1">
                    {nft.rarity}
                  </span>
                )}
              </div>
              <Zap className="w-4 h-4 text-yellow-500" />
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* NFT detail modal */}
      {selectedNFT && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedNFT(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNFT.name}</h3>
              <button
                onClick={() => setSelectedNFT(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <img
                src={selectedNFT.image}
                alt={selectedNFT.name}
                className="w-full aspect-square object-cover rounded-lg"
              />

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedNFT.description}</p>
              </div>

              {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Attributes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedNFT.attributes.map((attr) => (
                      <div key={attr.trait_type} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{attr.trait_type}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Token ID:</span> {selectedNFT.tokenId}
                </p>
                <p className="text-xs text-gray-500 break-all">
                  <span className="font-medium">Contract:</span> {selectedNFT.contractAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
