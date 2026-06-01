/**
 * Wallet Knowledge Graph Service
 *
 * In-memory graph store for tracking wallet relationships, tip history,
 * and reputation scores. Designed for client-side use with optional
 * persistence via localStorage.
 */

import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  EdgeType,
  WalletNode,
  UserNode,
  TransactionNode,
  TokenNode,
  ContentNode,
  WalletProfile,
  TipRelationship,
  GraphStats,
} from './knowledgeGraph.types';

const STORAGE_KEY = 'teachlink_wallet_graph';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): number {
  return Date.now();
}

function makeEdgeId(type: EdgeType, fromId: string, toId: string): string {
  return `${type}:${fromId}:${toId}`;
}

function createGraph(): KnowledgeGraph {
  return {
    nodes: new Map(),
    edges: new Map(),
    adjacency: new Map(),
  };
}

// ─── WalletKnowledgeGraphService ─────────────────────────────────────────────

export class WalletKnowledgeGraphService {
  private graph: KnowledgeGraph;

  constructor() {
    this.graph = createGraph();
    this.loadFromStorage();
  }

  // ── Node Operations ─────────────────────────────────────────────────────

  addNode(node: GraphNode): void {
    this.graph.nodes.set(node.id, { ...node, updatedAt: now() });
    if (!this.graph.adjacency.has(node.id)) {
      this.graph.adjacency.set(node.id, new Set());
    }
    this.persistToStorage();
  }

  getNode<T extends GraphNode>(id: string): T | undefined {
    return this.graph.nodes.get(id) as T | undefined;
  }

  upsertWallet(address: string, chainId: string | null, provider: string | null): WalletNode {
    const existing = this.getNode<WalletNode>(address);
    const wallet: WalletNode = {
      id: address,
      type: 'wallet',
      address,
      chainId,
      provider,
      reputationScore: existing?.reputationScore ?? 0,
      totalTipped: existing?.totalTipped ?? '0',
      totalReceived: existing?.totalReceived ?? '0',
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
      metadata: existing?.metadata ?? {},
    };
    this.addNode(wallet);
    return wallet;
  }

  upsertUser(userId: string, walletAddress: string, displayName?: string): UserNode {
    const existing = this.getNode<UserNode>(userId);
    const user: UserNode = {
      id: userId,
      type: 'user',
      userId,
      displayName,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
      metadata: existing?.metadata ?? {},
    };
    this.addNode(user);
    // Link user → wallet
    this.addEdge('OWNS', userId, walletAddress);
    return user;
  }

  addTransaction(tx: Omit<TransactionNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>): TransactionNode {
    const node: TransactionNode = {
      ...tx,
      type: 'transaction',
      createdAt: now(),
      updatedAt: now(),
      metadata: {},
    };
    this.addNode(node);

    // Ensure wallet nodes exist
    this.upsertWallet(tx.from, tx.chainId, null);
    this.upsertWallet(tx.to, tx.chainId, null);

    // Add directional edges
    this.addEdge('SENT', tx.from, tx.id);
    this.addEdge('RECEIVED', tx.to, tx.id);
    this.addEdge('TIPPED', tx.from, tx.to, parseFloat(tx.value) || 0);

    // Update reputation and totals
    this.updateWalletStats(tx.from, tx.to, tx.value);

    // Link to content if provided
    if (tx.contentId) {
      this.addEdge('TIPPED_CONTENT', tx.from, tx.contentId);
    }

    return node;
  }

  addToken(token: Omit<TokenNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>): TokenNode {
    const node: TokenNode = {
      ...token,
      type: 'token',
      createdAt: now(),
      updatedAt: now(),
      metadata: {},
    };
    this.addNode(node);
    return node;
  }

  linkWalletToken(walletAddress: string, tokenId: string): void {
    this.addEdge('HOLDS', walletAddress, tokenId);
  }

  addContent(content: Omit<ContentNode, 'type' | 'createdAt' | 'updatedAt' | 'metadata'>): ContentNode {
    const node: ContentNode = {
      ...content,
      type: 'content',
      createdAt: now(),
      updatedAt: now(),
      metadata: {},
    };
    this.addNode(node);
    if (content.authorWallet) {
      this.addEdge('AUTHORED', content.authorWallet, content.id);
    }
    return node;
  }

  // ── Edge Operations ─────────────────────────────────────────────────────

  addEdge(type: EdgeType, fromId: string, toId: string, weight = 1): GraphEdge {
    const id = makeEdgeId(type, fromId, toId);
    const existing = this.graph.edges.get(id);

    const edge: GraphEdge = {
      id,
      type,
      fromId,
      toId,
      weight: (existing?.weight ?? 0) + weight,
      createdAt: existing?.createdAt ?? now(),
      metadata: existing?.metadata ?? {},
    };

    this.graph.edges.set(id, edge);

    // Update adjacency
    const fromAdj = this.graph.adjacency.get(fromId) ?? new Set();
    fromAdj.add(id);
    this.graph.adjacency.set(fromId, fromAdj);

    this.persistToStorage();
    return edge;
  }

  getEdgesBetween(fromId: string, toId: string): GraphEdge[] {
    const adjEdgeIds = this.graph.adjacency.get(fromId) ?? new Set();
    return Array.from(adjEdgeIds)
      .map((id) => this.graph.edges.get(id))
      .filter((e): e is GraphEdge => !!e && e.toId === toId);
  }

  // ── Query Operations ────────────────────────────────────────────────────

  getWalletProfile(address: string): WalletProfile | null {
    const wallet = this.getNode<WalletNode>(address);
    if (!wallet) return null;

    const adjEdgeIds = this.graph.adjacency.get(address) ?? new Set();
    const edges = Array.from(adjEdgeIds)
      .map((id) => this.graph.edges.get(id))
      .filter((e): e is GraphEdge => !!e);

    const connectedUsers: UserNode[] = [];
    const recentTransactions: TransactionNode[] = [];
    const heldTokens: TokenNode[] = [];
    const authoredContent: ContentNode[] = [];

    // Traverse incoming OWNS edges to find users
    for (const [, edge] of this.graph.edges) {
      if (edge.type === 'OWNS' && edge.toId === address) {
        const user = this.getNode<UserNode>(edge.fromId);
        if (user) connectedUsers.push(user);
      }
    }

    for (const edge of edges) {
      if (edge.type === 'SENT') {
        const tx = this.getNode<TransactionNode>(edge.toId);
        if (tx) recentTransactions.push(tx);
      }
      if (edge.type === 'HOLDS') {
        const token = this.getNode<TokenNode>(edge.toId);
        if (token) heldTokens.push(token);
      }
      if (edge.type === 'AUTHORED') {
        const content = this.getNode<ContentNode>(edge.toId);
        if (content) authoredContent.push(content);
      }
    }

    // Sort transactions by most recent
    recentTransactions.sort((a, b) => b.createdAt - a.createdAt);

    return {
      wallet,
      connectedUsers,
      recentTransactions: recentTransactions.slice(0, 20),
      heldTokens,
      authoredContent,
      reputationScore: wallet.reputationScore,
    };
  }

  getTipRelationships(address: string): TipRelationship[] {
    const adjEdgeIds = this.graph.adjacency.get(address) ?? new Set();
    const tipEdges = Array.from(adjEdgeIds)
      .map((id) => this.graph.edges.get(id))
      .filter((e): e is GraphEdge => !!e && e.type === 'TIPPED');

    return tipEdges.map((edge) => {
      // Count transactions between these two wallets
      const txEdges = this.getEdgesBetween(address, edge.toId).filter(
        (e) => e.type === 'SENT',
      );
      const txNodes = txEdges
        .map((e) => this.getNode<TransactionNode>(e.toId))
        .filter((t): t is TransactionNode => !!t && t.to === edge.toId);

      const lastTipAt = txNodes.reduce((max, tx) => Math.max(max, tx.createdAt), 0);

      return {
        fromWallet: address,
        toWallet: edge.toId,
        totalValue: edge.weight.toString(),
        transactionCount: txNodes.length,
        lastTipAt,
      };
    });
  }

  getReputationScore(address: string): number {
    return this.getNode<WalletNode>(address)?.reputationScore ?? 0;
  }

  getStats(): GraphStats {
    let walletCount = 0;
    let transactionCount = 0;
    for (const node of this.graph.nodes.values()) {
      if (node.type === 'wallet') walletCount++;
      if (node.type === 'transaction') transactionCount++;
    }
    return {
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size,
      walletCount,
      transactionCount,
    };
  }

  // ── Persistence ─────────────────────────────────────────────────────────

  clear(): void {
    this.graph = createGraph();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private updateWalletStats(fromAddress: string, toAddress: string, value: string): void {
    const amount = parseFloat(value) || 0;

    const sender = this.getNode<WalletNode>(fromAddress);
    if (sender) {
      const newTipped = (parseFloat(sender.totalTipped) + amount).toString();
      // Reputation increases slightly for tipping (active participation)
      const newScore = Math.min(100, sender.reputationScore + 0.5);
      this.addNode({ ...sender, totalTipped: newTipped, reputationScore: newScore });
    }

    const receiver = this.getNode<WalletNode>(toAddress);
    if (receiver) {
      const newReceived = (parseFloat(receiver.totalReceived) + amount).toString();
      // Reputation increases more for receiving tips (recognition)
      const newScore = Math.min(100, receiver.reputationScore + 1);
      this.addNode({ ...receiver, totalReceived: newReceived, reputationScore: newScore });
    }
  }

  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const serializable = {
        nodes: Array.from(this.graph.nodes.entries()),
        edges: Array.from(this.graph.edges.entries()),
        adjacency: Array.from(this.graph.adjacency.entries()).map(([k, v]) => [k, Array.from(v)]),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // Storage quota exceeded or unavailable — silently skip
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      this.graph.nodes = new Map(parsed.nodes ?? []);
      this.graph.edges = new Map(parsed.edges ?? []);
      this.graph.adjacency = new Map(
        (parsed.adjacency ?? []).map(([k, v]: [string, string[]]) => [k, new Set(v)]),
      );
    } catch {
      // Corrupted storage — start fresh
      this.graph = createGraph();
    }
  }
}

// Singleton instance
export const walletKnowledgeGraph = new WalletKnowledgeGraphService();
