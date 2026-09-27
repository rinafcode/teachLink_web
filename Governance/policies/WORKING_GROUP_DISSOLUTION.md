# Governance/processes/WORKING_GROUP_DISSOLUTION.md

# TeachLink Governance: Working Group Dissolution Process

**Version:** 1.0.0  
**Status:** Active  
**Scope:** All temporary or permanent working groups, task forces, and special interest groups operating within the TeachLink ecosystem.

---

## 1. Purpose
To ensure operational clarity, prevent orphaned repositories, and ensure intellectual property and artifacts are securely preserved, this document defines the formal lifecycle triggers, artifact handover protocols, and archival steps for dissolving TeachLink working groups.

---

## 2. Triggers for Dissolution
A working group may be dissolved under any of the following circumstances:
* **Charter Completion:** All objectives, deliverables, and milestones outlined in the working group's founding charter have been successfully completed and merged into main repositories.
* **Prolonged Inactivity:** Zero activity, meeting attendance, or pull request submissions over 90 consecutive days without an approved hiatus.
* **Maintainer Consensus:** A formal core maintainer vote resulting in a majority approval to sunset the working group due to shifting project priorities.

---

## 3. Handover of Artifacts
Prior to final archival, all working group assets must be systematically transitioned:
* **Code & Repositories:** Active code repositories, packages, and smart contracts must be transferred to the core TeachLink organization or assigned to designated permanent maintainers.
* **Documentation & Research:** All design docs, meeting notes, and research papers must be centralized within the primary project documentation or the Governance repository.
* **Pending Tasks:** Any unfinished work must be cataloged into open GitHub issues with clear ownership tags for community pickup.

---

## 4. Archival Steps
1. **Status Update:** Update the working group's status in the Governance directory to `Archived`.
2. **Channel Read-Only Lock:** Transition dedicated Discord/Slack channels and communication threads to read-only mode with a pinned closure notice.
3. **Repository Archival:** Mark GitHub repositories as archived (read-only) to preserve historical git commit history and pull request records.
4. **Final Announcement:** Publish a summary closure report on community channels and the core maintainer sync log.