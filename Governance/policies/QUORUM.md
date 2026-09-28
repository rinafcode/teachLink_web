# Governance/policies/QUORUM.md
# Voting Quorum Policy

## 1. Overview
This policy establishes the voting quorum requirements for governance decisions, RFC approvals, core maintainer elections, and repository policy changes within TeachLink. Establishing a clear quorum ensures that decisions have sufficient backing from the community and core maintainers before being enacted.

---

## 2. Quorum Thresholds
Quorum requirements vary depending on the scope and impact of the decision:
* **Standard Governance Proposals & Feature RFCs:** A minimum of **50% plus one** of active core maintainers must participate in the vote.
* **Core Maintainer Additions / Removals:** At least **75%** of active core maintainers must participate.
* **Constitutional or Policy Overhauls:** At least **66%** of active voting members must participate.

---

## 3. Measurement of Quorum
* **Eligible Voters:** Defined as active contributors holding maintainer or voting status at the time the vote is officially opened.
* **Participation Calculation:** Quorum is measured by the total number of cast votes (including affirmative (`Yes`), negative (`No`), and formal abstentions (`Abstain`)) relative to the total number of eligible voters.
* **Approval Requirement:** In addition to meeting quorum, a proposal passes if it achieves a simple majority (or supermajority where specified) of non-abstaining votes.

---

## 4. Procedure When Quorum Is Not Met
If a voting period closes and the required quorum threshold has not been reached:
1. **Extension:** The voting window is automatically extended once by an additional 72 hours.
2. **Notification:** Maintainers are notified via communication channels (e.g., issue/PR comments or governance meetings).
3. **Deferral:** If quorum remains unmet after the extension period, the proposal is marked as **Defeated due to Lack of Quorum** and must be revised or re-proposed in a subsequent governance cycle.