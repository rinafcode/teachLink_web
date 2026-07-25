/**
 * Wallet Knowledge Graph Types
 *
 * Models the relationships between wallets, users, transactions, and tokens
 * to enable reputation scoring, tip history, and social graph traversal.
 */

// ─── Node Types ──────────────────────────────────────────────────────────────

export type NodeType = 'wallet' | 'user' | 'transaction' | 'token' | 'content';

export interface BaseNode {
  id: string;
  type: NodeType;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export interface WalletNode extends BaseNode {
  type: 'wallet';
  address: string;
  chainId: string | null;
  provider: string | null;
  /** Reputation score derived from tip activity */
  reputationScore: number;
  /** Total value tipped out (in smallest unit) */
  totalTipped: string;
  /** Total value received */
  totalReceived: string;
}

export interface UserNode extends BaseNode {
  type: 'user';
  userId: string;
  displayName?: string;
}

export interface TransactionNode extends BaseNode {
  type: 'transaction';
  hash: string;
  from: string;
  to: string;
  value: string;
  chainId: string;
  status: 'pending' | 'confirmed' | 'failed';
  /** Optional content reference this tip is associated with */
  contentId?: string;
}

export interface TokenNode extends BaseNode {
  type: 'token';
  address: string;
  symbol: string;
  decimals: number;
  chainId: string;
}

export interface ContentNode extends BaseNode {
  type: 'content';
  contentId: string;
  title?: string;
  authorWallet?: string;
}

export type GraphNode = WalletNode | UserNode | TransactionNode | TokenNode | ContentNode;

// ─── Edge Types ──────────────────────────────────────────────────────────────

export type EdgeType =
  | 'OWNS' // user → wallet
  | 'SENT' // wallet → transaction
  | 'RECEIVED' // wallet → transaction
  | 'TIPPED' // wallet → wallet (via transaction)
  | 'HOLDS' // wallet → token
  | 'AUTHORED' // wallet → content
  | 'TIPPED_CONTENT'; // wallet → content

export interface GraphEdge {
  id: string;
  type: EdgeType;
  fromId: string;
  toId: string;
  weight: number;
  createdAt: number;
  metadata: Record<string, unknown>;
}

// ─── Graph Structure ─────────────────────────────────────────────────────────

export interface KnowledgeGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  /** Adjacency list: nodeId → Set of edge IDs */
  adjacency: Map<string, Set<string>>;
}

// ─── Query Results ────────────────────────────────────────────────────────────

export interface WalletProfile {
  wallet: WalletNode;
  connectedUsers: UserNode[];
  recentTransactions: TransactionNode[];
  heldTokens: TokenNode[];
  authoredContent: ContentNode[];
  reputationScore: number;
}

export interface TipRelationship {
  fromWallet: string;
  toWallet: string;
  totalValue: string;
  transactionCount: number;
  lastTipAt: number;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  walletCount: number;
  transactionCount: number;
}
