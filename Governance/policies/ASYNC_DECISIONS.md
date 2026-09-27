# Governance/policies/ASYNC_DECISIONS.md

# TeachLink Governance: Asynchronous Decision Policy

**Version:** 1.0.0  
**Status:** Active  
**Scope:** All asynchronous proposals, RFCs, and non-blocking architectural decisions across the TeachLink repositories and community channels.

---

## 1. Purpose
To ensure distributed contributors and maintainers across different time zones can participate effectively in project decisions, this policy defines standard protocols, minimum response windows, and mandatory recording requirements for asynchronous voting and consensus-building.

---

## 2. Permitted Use Cases for Async Decisions
Asynchronous decision-making is permitted for:
* Standard pull request reviews and architectural RFCs.
* Routine maintenance, tooling upgrades, and minor dependency policies.
* Non-emergency governance adjustments and minor documentation updates.
* Urgent security patches or SEV-1 incident response coordination (subject to expedited timelines defined in incident runbooks).

---

## 3. Minimum Response Window
To ensure adequate review time for all eligible maintainers and stakeholders:
* **Standard Proposals / RFCs:** A minimum response window of **72 hours (3 business days)** must be observed from the time of formal notification in official communication channels.
* **Major Governance / Breaking Changes:** A minimum response window of **168 hours (7 calendar days)** is required.
* **Expedited Patches:** Security fixes or critical operational patches may utilize a shortened 24-hour window with explicit notification and quorum acknowledgement.

---

## 4. Recording Requirements & Quorum
* **Mandatory Archival:** All asynchronous decisions, votes, objections, and final outcomes must be recorded permanently in writing on the corresponding GitHub issue, pull request, or governance repository thread.
* **Quorum:** An asynchronous decision is valid when at least a simple majority of active core maintainers have formally registered their vote or approval within the stipulated response window.
* **Silence Policy:** Failure to respond within the minimum response window constitutes abstention, allowing the active quorum to finalize the decision.