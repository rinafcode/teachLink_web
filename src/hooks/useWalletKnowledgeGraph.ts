'use client';

import { useCallback, useEffect, useState } from 'react';
import { walletKnowledgeGraph } from '@/lib/wallet/knowledgeGraph.service';
import type {
  WalletProfile,
  TipRelationship,
  GraphStats,
  TransactionNode,
  TokenNode,
  ContentNode,
} from '@/lib/wallet/knowledgeGraph.types';

interface UseWalletKnowledgeGraphReturn {
  /** Full profile for a wallet address */
  getWalletProfile: (address: string) => WalletProfile | null;
  /** Tip relationships originating from a wallet */
  getTipRelationships: (address: string) => TipRelationship[];
  /** Reputation score for a wallet (0–100) */
  getReputationScore: (address: string) => number;
  /** Current graph statistics */
  stats: GraphStats;
  /** Register a wallet in the graph */
  registerWallet: (address: string, chainId: string | null, provider: string | null) => void;
  /** Record a tip transaction */
  recordTip: (tx: Omit<TransactionNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>) => void;
  /** Register a token holding */
  registerToken: (
    token: Omit<TokenNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>,
    walletAddress: string,
  ) => void;
  /** Register authored content */
  registerContent: (
    content: Omit<ContentNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>,
  ) => void;
}

/**
 * useWalletKnowledgeGraph
 *
 * Provides access to the wallet knowledge graph for querying relationships,
 * reputation scores, and tip history. Also exposes mutation helpers to
 * populate the graph as wallet events occur.
 */
export function useWalletKnowledgeGraph(): UseWalletKnowledgeGraphReturn {
  const [stats, setStats] = useState<GraphStats>(() => walletKnowledgeGraph.getStats());

  const refreshStats = useCallback(() => {
    setStats(walletKnowledgeGraph.getStats());
  }, []);

  const getWalletProfile = useCallback((address: string) => {
    return walletKnowledgeGraph.getWalletProfile(address);
  }, []);

  const getTipRelationships = useCallback((address: string) => {
    return walletKnowledgeGraph.getTipRelationships(address);
  }, []);

  const getReputationScore = useCallback((address: string) => {
    return walletKnowledgeGraph.getReputationScore(address);
  }, []);

  const registerWallet = useCallback(
    (address: string, chainId: string | null, provider: string | null) => {
      walletKnowledgeGraph.upsertWallet(address, chainId, provider);
      refreshStats();
    },
    [refreshStats],
  );

  const recordTip = useCallback(
    (tx: Omit<TransactionNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>) => {
      walletKnowledgeGraph.addTransaction(tx);
      refreshStats();
    },
    [refreshStats],
  );

  const registerToken = useCallback(
    (
      token: Omit<TokenNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>,
      walletAddress: string,
    ) => {
      walletKnowledgeGraph.addToken(token);
      walletKnowledgeGraph.linkWalletToken(walletAddress, token.id);
      refreshStats();
    },
    [refreshStats],
  );

  const registerContent = useCallback(
    (content: Omit<ContentNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>) => {
      walletKnowledgeGraph.addContent(content);
      refreshStats();
    },
    [refreshStats],
  );

  // Sync stats on mount
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    getWalletProfile,
    getTipRelationships,
    getReputationScore,
    stats,
    registerWallet,
    recordTip,
    registerToken,
    registerContent,
  };
}
