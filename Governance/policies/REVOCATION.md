# Privilege Revocation Policy

## Purpose

This policy defines how TeachLink Web revokes repository and project
privileges that have already been granted: repository access levels, team
and working-group membership, credentials used by automation and release
tooling, and other named authorities. It states the grounds on which a
privilege may be revoked, who may initiate a revocation, the steps every
revocation follows, and the appeal path available to the affected holder.
It exists so that revocation is prompt when it must be, and documented,
reviewable, and non-arbitrary at all other times.

## Scope

This policy applies to every privilege granted through the project,
including but not limited to:

- Repository access levels: read, triage, write, maintain, and administer.
- Team, working-group, and security-response membership.
- Credentials and authorities used by bots, automation, and release tooling.
- Any other named authority recorded in this `Governance/` folder.

It does not cover enforcement of conduct standards, which follows the Code
of Conduct and its appeals process, nor the ordinary removal of access that
simply follows inactivity, which follows the Inactivity Policy. Where this
policy and another governance document both apply, the stricter requirement
governs.

## Grounds for Revocation

A privilege may be revoked only on an enumerated ground:

- **Security risk.** The holder's credentials, devices, or accounts are
  compromised, or the holder poses an active risk to the repository, its
  users, or its releases.
- **Confirmed misconduct.** A conduct enforcement decision under the Code
  of Conduct requires or recommends removal of the privilege.
- **Breach of trust.** Deliberate abuse of the privilege, such as bypassing
  required checks, leaking private data, or acting against the project while
  using the granted authority.
- **Loss of competence or availability.** The holder cannot exercise the
  privilege safely under the applicable role requirements.
- **Legal or platform requirement.** A law, court order, or hosting platform
  requires the privilege to be removed.

A revocation is never used as a general sanction. It is proportionate to the
ground, and the record states which ground applies and why.

## Who May Initiate

- **Maintainers** may open a revocation for any holder, under any ground, as
  defined in `Governance/roles/MAINTAINER.md`.
- **The Security Response Team** may open a revocation on security grounds,
  as described in `Governance/SECURITY_RESPONSE_TEAM.md`, and may act first
  and document afterwards when there is an active risk to users.
- **The relevant working group or role owner** may open a revocation for the
  privileges it grants, for its own members.
- **The holder** may voluntarily surrender a privilege at any time by
  telling a maintainer. A voluntary surrender follows the record steps but
  does not require the grounds test.

An initiator may not decide a revocation in which they are the affected
holder or the subject, and must disclose any personal stake under
`Governance/policies/CONFLICT_OF_INTEREST.md` and step aside when one exists.

## Revocation Steps

Every revocation moves through the following steps in order, except that a
security revocation may compress steps 1 and 2 when there is an active risk
to users, with the compression and its reason recorded.

### 1. Open a revocation record

The initiator opens a private revocation record that names the holder, the
privilege, the ground relied on, the evidence, and who raised it. Reports
that do not name a ground are sent back for that detail rather than actioned.

- **Owner:** the initiator.
- **Exit criterion:** a private record exists with holder, privilege,
  ground, and evidence.

### 2. Independent decision

An independent decision-maker reviews the record against the enumerated
grounds and decides to revoke, to restrict instead, or to decline. A
revocation that removes a privilege on a ground not listed above is invalid.

- **Owner:** a maintainer or delegate who is independent of the holder.
- **Exit criterion:** a written decision that names the ground and the
  reasoning, within 5 business days of the record being complete.

### 3. Apply the removal

The privilege is removed through the platform or tooling that grants it, and
every credential, token, or key issued for it is rotated or revoked. Removal
is complete: nothing that grants the privilege is left active.

- **Owner:** maintainers with the access to apply the change.
- **Exit criterion:** the access, membership, or credential is gone, and the
  platform audit log confirms it.

### 4. Notify and record

The holder is notified privately of the decision, the privilege removed, the
ground, and the appeal path in this document. The decision and its reasoning
are recorded where maintainers can audit them; public spaces carry only the
fact that a change was made, never private details.

- **Owner:** maintainers.
- **Exit criterion:** holder notified and the decision recorded.

### 5. Follow up

When the revocation exposed a gap in access control, review, or process, a
follow-up issue is opened without disclosing private details. Retaliation for
participating in a revocation is treated as a fresh conduct matter.

- **Owner:** maintainers.
- **Exit criterion:** any follow-up issue opened and linked to the record.

## Appeal Path

Every holder whose privilege is revoked may appeal that decision:

- **Who may appeal.** The affected holder, or a maintainer acting on behalf
  of a holder who cannot safely appeal alone. An appeal may use a pseudonym
  where safety requires it.
- **How to appeal.** File within 14 calendar days of the decision notice in
  the private channel named in that notice, stating which decision is
  appealed, why it should be reconsidered, and any new evidence.
- **Independent review.** An independent reviewer, uninvolved in the
  original decision, examines the record and the appeal grounds and decides
  to uphold, amend, or overturn, within 10 business days of assignment.
- **Written decision with reasoning.** The outcome is communicated to the
  appellant in writing, stating what was decided, why, and what could reopen
  it.
- **Re-review.** A party may request re-review once with new evidence; after
  that the decision stands unless new facts emerge.
- **Exceptions.** A security or legal revocation may remain in force during
  an appeal when the risk is ongoing. The exception, its reason, and a
  retrospective independent review are recorded, as described in
  `Governance/processes/ESCALATION_PATH.md`.

A review that merely restates the original decision without engaging the
appeal grounds is not an independent review.

## Ownership and Review

- Maintainers own this policy and are accountable for applying its grounds
  and steps consistently and for recording every revocation and exception.
- Changes to this policy are proposed in a pull request that touches only
  the `Governance/` folder, and are reviewed like any other governance
  change.
- This document is versioned with the repository and describes the
  revocation practice the project actually follows.

## Success

This policy succeeds when every revocation names an enumerated ground, when
removals are complete and their credentials rotated, when every affected
holder is told the decision and their appeal path, and when the record lets
the project review its own access decisions without exposing private
details.

## Regression Tests

Coverage is provided by `Governance/policies/REVOCATION.test.ts`, which pins
the grounds, the initiation rights, and the appeal guarantees in this
document.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-28 | Initial version. | TeachLink maintainers |
