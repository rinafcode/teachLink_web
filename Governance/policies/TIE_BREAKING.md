# Governance/policies/TIE_BREAKING.md

# TeachLink Governance: Tie-Breaking Policy

**Version:** 1.0.0  
**Status:** Active  
**Scope:** All formal governance votes, pull request deadlocks, and proposal decisions within the TeachLink ecosystem.

---

## 1. Purpose
In the event of a tied vote or deadlock during governance proposals, architectural decisions, or core maintainer votes, this policy defines an objective, transparent, and binding resolution mechanism to prevent project stagnation while upholding community trust.

---

## 2. Casting Vote Authority
When a formal vote results in an exact numerical tie (50/50 split among eligible active maintainers/voters):
* **Primary Authority:** The **Lead Maintainer / Project Lead** holds the decisive casting vote.
* **Execution:** The casting vote must be officially cast within 48 hours of the deadlock announcement on the relevant governance issue or pull request thread, accompanied by a brief rationale for the decision.

---

## 3. Fallback Procedure & Conflict of Interest
If the primary casting vote holder is unavailable, unresponsive (exceeding the 48-hour window), or has a direct conflict of interest regarding the tied proposal:
1. **Secondary Escrow Lead:** Authority automatically delegates to the designated **Core Architecture Lead** or Co-Maintainer.
2. **Governance Committee Resolution:** If both primary and secondary leads are conflicted, a simple majority vote among the remaining unconflicted Governance Committee members will break the tie.
3. **Time-Bound Escalation:** If no quorum is reached within 7 days of the deadlock, the proposal defaults to **status quo** (rejection of the proposed change until consensus can be re-evaluated in a subsequent review cycle).

---

## 4. Policy Review & Amendments
This policy may be amended via a standard governance proposal requiring a two-thirds supermajority of active maintainers.