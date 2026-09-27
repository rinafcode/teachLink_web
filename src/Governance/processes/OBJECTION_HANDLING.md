# Governance/processes/OBJECTION_HANDLING.md

# TeachLink Governance: Objection-Handling Process

**Version:** 1.0.0  
**Status:** Active  
**Scope:** All pull requests, architectural RFCs, governance proposals, and working group decisions across the TeachLink ecosystem.

---

## 1. Purpose
To ensure constructive technical debate, protect project integrity, and provide a clear, respectful mechanism for voicing and resolving substantive objections without causing project stagnation, this document defines the formal objection-handling process.

---

## 2. Raising an Objection
* **Substantive Criteria:** Objections must be grounded in technical merit, security risk, architectural inconsistency, or governance non-compliance. Casual disagreement or aesthetic preferences do not constitute formal blocking objections.
* **Format:** Objections must be raised in writing on the active pull request or RFC thread using the explicit prefix `[BLOCKING OBJECTION]` accompanied by a clear technical rationale and supporting evidence.

---

## 3. Resolution Steps
1. **Direct Discussion:** The author(s) of the proposal and the objecting contributor must engage in good-faith discussion on the thread to address the underlying concern, explore alternative designs, or adjust the proposal scope.
2. **Mandatory Response Window:** Proposal authors must acknowledge and address a formal objection within **48 hours**.
3. **Compromise / Amendment:** If the objection is valid, the proposal must be amended or refactored to resolve the identified risk before merging.

---

## 4. Escalation Path
If an objection cannot be resolved informally between the parties within 5 business days:
1. **Core Maintainer Review:** The objection escalates to the Core Maintainer team for formal technical evaluation.
2. **Tie-Breaker / Vote:** The maintainers review the merits and initiate either a formal vote (`Governance/processes/FORMAL_VOTING.md`) or invoke the tie-breaking policy (`Governance/policies/TIE_BREAKING.md`).
3. **Override:** A two-thirds supermajority of unconflicted core maintainers can override a blocking objection if it is determined to be technically unfounded or obstructive to project progress.