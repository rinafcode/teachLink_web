export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface IIdentityState {
  status: VerificationStatus;
  tier: number; // Tier 0: Unverified, Tier 1: KYC Passed, Tier 2: Corporate/Advanced Audit Approved
  expiresAt: string | null;
  loading: boolean;
  error: string | null;
}