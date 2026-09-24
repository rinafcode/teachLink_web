# Treasurer Role

## Purpose

This document defines the treasurer role for TeachLink Web's community
governance: the duties of the role, the limits on its spending authority, and its
reporting obligations. It ensures that whatever value the community holds is
managed transparently and that no single person can dispose of it silently.

## Scope

The treasurer operates in the community and on-chain governance area of the
project. The TeachLink platform settles rewards on-chain through its
Stellar/Soroban layer, so treasury activity may touch on-chain balances managed
by the platform's contract layer. The treasurer's authority covers community
treasury functions governed here; application or contract behavior is owned by
the relevant codebase, not by this role.

## Duties

The treasurer is responsible for the care and accounting of community-held
resources:

- **Record keeping.** Maintaining a complete, current record of funds received,
  held, and disbursed, including the purpose and approval reference for each
  transaction.
- **Disbursement.** Executing approved payments for community grants, contributor
  rewards, and other expenses approved under this governance, using the platform
  mechanisms designated for those transfers.
- **Budget oversight.** Preparing and maintaining a community budget and
  flagging when planned spending is inconsistent with approved amounts.
- **Reconciliation.** Periodically reconciling records against on-chain or
  platform balances exposed by the project's Stellar/Soroban layer and resolving
  discrepancies.
- **Transparency.** Publishing regular treasury reports through the repository's
  normal communication channels so the community can verify the accounts.

## Spending Authority Limits

The treasurer does not have unlimited authority:

- **Approved-spending execution.** The treasurer may execute only spending that
  a governance-approved decision supports. A payment is not made without an
  explicit approval reference.
- **Tiered approvals.** Small, recurring, or already-budgeted expenses follow the
  standing approval path; larger or one-off expenses require a separate
  governance decision before disbursement. The exact thresholds and dollar
  (or token) amounts are defined in the community's treasury policy, which is
  itself a governance document that must be adopted through the decision-making
  process before any amount is spent. Until that policy exists, the treasurer
  holds no spending authority and may only record and report.
- **No unilateral policy changes.** The treasurer cannot change limits, approve
  their own expenses, or redefine the budget. Any change to limits is a
  governance change.
- **Dual control for material sums.** Material disbursements require more than
  the treasurer alone to execute, and the execution is recorded where the
  community can verify it.

## Reporting Obligations

- The treasurer reports on a regular cadence defined in the treasury policy:
  funds position, movements, pending approvals, and any discrepancies.
- Reports are published to the community and kept in a stable, versioned
  location.
- Any exception — a payment without a full approval trail, a discrepancy, or a
  missed report — is disclosed in the report itself rather than buried.

## Appointment

The treasurer is selected through the project's role nomination and appointment
process, from contributors with a demonstrated record of careful, transparent
work. The role is revocable through that same process if duties are not met.

## Ownership

- The community owns the treasury; the treasurer serves it. The treasurer's
  duties, limits, and reporting obligations are defined in governance documents
  in the `Governance/` folder, and changes to them are proposed in a pull
  request that touches only the `Governance/` folder.
- The platform maintainers oversee the safe execution of treasury functions
  within the web client's scope.

## Success

This role definition succeeds when community-held resources are spent only with
approval, recorded completely, reported transparently, and always within
documented limits — so the community can trust the account and the treasurer can
be held accountable to it.