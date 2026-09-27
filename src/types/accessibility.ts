export type AccessibilityConformance = "Supports" | "Partially Supports" | "Does Not Support" | "Not Applicable";

export interface IVpatCriteria {
  id: string;
  wcagSection: string;
  criterionName: string;
  conformance: AccessibilityConformance;
  remarks: string;
}

export interface IModerationAuditLog {
  id: string;
  action: string;
  targetUser: string;
  timestamp: string;
  reason: string;
}