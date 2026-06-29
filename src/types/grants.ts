export type GrantScope = 'all' | 'budget_management' | 'dispute_resolution' | 'escrow_payout';

export interface IGrantContext {
  id: string;
  contractAddress: string;
  grantee: string;
  scope: GrantScope;
  expirationLedger: number;
  authorizedAmount?: string;
  assetSymbol?: string;
}

export interface IGrantManagementState {
  activeGrants: IGrantContext[];
  pendingApprovalsCount: number;
  loading: boolean;
  error: string | null;
}
