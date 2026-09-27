export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const ReviewDecision = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ReviewDecision = (typeof ReviewDecision)[keyof typeof ReviewDecision];
