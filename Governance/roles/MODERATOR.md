# Moderator Role

## Purpose

This document defines the moderator role in TeachLink Web: who may hold it, what
duties they perform, their moderation powers and limits, how they are appointed
and removed, and how the role is tracked in public. It fills a known governance
gap by making moderation expectations explicit and self-contained in the
`Governance/` folder.

## Scope

The moderator role applies to public spaces that the project operates, including
repository discussions, issue and pull request comments, reviews, project boards,
and other project-controlled communication channels as identified in
`Governance/policies/MODERATION.md`. It does not replace platform-level
moderation rules or override applicable laws. It complements
`Governance/policies/MODERATION.md`, the conflict handling in
`Governance/processes/CONFLICT_RESOLUTION.md`, and the guidance in
`Governance/domains/COMMENT_MODERATION.md`.

## Duties

Moderators are expected to:

- **Uphold the Code of Conduct.** Enforce `Governance/CODE_OF_CONDUCT.md`
  consistently and impartially in the spaces covered by this role.
- **Intervene early.** Respond to reports and visible violations in a way that
  de-escalates and protects the wellbeing of participants.
- **Document actions.** Record moderation actions in the public thread or issue
  associated with the report when safe to do so, without disclosing
  confidential details that would put reporters at risk.
- **Collaborate on escalations.** Escalate serious or unresolved matters using
  `Governance/processes/ESCALATION_PATH.md` and
  `Governance/processes/CONFLICT_RESOLUTION.md`.
- **Maintain clarity.** Explain the rationale for moderation actions in terms
  of the Code of Conduct and applicable policies.

## Moderation Powers and Limits

Moderators have limited authority to maintain a safe, constructive environment:

- **Powers.** Warn participants, apply temporary restrictions appropriate to the
  space, lock or close threads to further escalation, hide or remove comments
  that clearly violate the Code of Conduct, and decline to engage with abusive
  behaviour. These actions must be proportionate to the incident.
- **Limits.** Moderators do not unilaterally change governance documents, remove
  other roles without following removal rules, or disclose private information
  obtained in a report. Bans or permanent exclusion require escalation per
  `Governance/processes/ESCALATION_PATH.md` unless the policy explicitly grants
  the specific action.
- **Impartiality.** A moderator must recuse themselves from moderating a
  situation where they have a conflict of interest under
  `Governance/policies/CONFLICT_OF_INTEREST.md`.

## Appointment and Removal

Moderators are selected and held accountable through the project's nomination
process:

- **Appointment.** Nominations follow the
  `Governance/processes/NOMINATION.md` process. The nomination must state
  evidence of calm judgement, familiarity with the Code of Conduct, and prior
  constructive participation. Self-nominations are allowed and treated like any
  other nomination.
- **Eligibility.** A nominee should be a contributor or maintainer as defined in
  `Governance/roles/CONTRIBUTOR.md` and `Governance/roles/MAINTAINER.md`.
- **Removal.** If a moderator fails to meet duties, violates this role, or
  breaches the Code of Conduct, removal proceeds through the same
  `Governance/processes/NOMINATION.md` mechanism (motion to revoke the role)
  with evidence documented in the public nomination issue.

## Ownership

Maintainers own this role definition and any updates to it. Changes to this
document are proposed in a pull request that touches only the `Governance/`
folder.

## Success

This role succeeds when moderation is predictable, proportionate, and auditable;
when reports are handled consistently with the Code of Conduct and published
policies; and when participants understand the boundaries of moderator authority.

## Regression Tests

Regression coverage for this role lives in
`Governance/roles/MODERATOR.test.ts`. It verifies the document structure,
required sections, line length, absence of placeholders, references to key
policies and processes, and the explicit appointment/removal path via
`Governance/processes/NOMINATION.md`.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-28 | Initial version. | TeachLink maintainers |
