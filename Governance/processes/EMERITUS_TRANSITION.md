# Emeritus Transition Process

## Purpose

This process defines how a member of TeachLink Web moves from an active
governance role to emeritus status, which privileges survive the transition,
and how a member returns to active status. It is the operational companion to
`Governance/roles/EMERITUS.md`: that document defines what emeritus status is,
and this one defines the transition itself, with an owner, a deadline, and a
public record for every step.

## Scope

This process applies to every role defined under `Governance/roles/`,
including the contributor, reviewer, moderator, maintainer, and treasurer
roles, and to any working-group lead or domain steward recognised in a
governance document.

It covers the voluntary, good-standing transition into emeritus that
`Governance/roles/EMERITUS.md` grants. It does not cover a role removed for
inactivity, which follows the notification and consequence steps in
`Governance/policies/INACTIVITY.md`, nor a role removed for misconduct, which
follows `Governance/CODE_OF_CONDUCT.md` and its enforcement documents. A
member who was removed through either path is not placed in emeritus status
by this process.

Emeritus is opt-in. No member is moved to emeritus status without their
agreement, and this process never removes a role as a disciplinary measure.

## When a Member Moves to Emeritus

The transition starts from one of three triggers, and each one runs the same
steps below.

- **Voluntary step-down.** A member decides to step back from an active role
  and asks the maintainers for emeritus status.
- **End of a fixed term.** A role held for a fixed term, such as treasurer,
  ends and the outgoing member does not stand for another term but wishes to
  stay associated with the project.
- **Role consolidation.** A governance change retires or merges the member's
  former role, and the member consents to emeritus status instead of a
  different active role.

Every trigger produces the same recorded sequence:

1. **Request or proposal.** The member requests the transition, or the
   maintainers propose it and record that the member consents. A proposal
   without consent does not proceed.
2. **Acknowledgement within 3 business days.** A maintainer opens a public
   transition issue titled with the member's handle and the word `Emeritus`,
   acknowledges the request, and confirms the retained and withdrawn
   privileges with the member.
3. **Recorded decision within 10 business days.** The maintainers record the
   decision and its reasoning on the transition issue, in line with the
   decision cadence in `Governance/processes/NOMINATION.md`.
4. **Applied within 5 business days of the decision.** The maintainers update
   the relevant `Governance/roles/` entry, the CODEOWNERS file, and the
   repository access list, and confirm the change back to the member.

If a deadline above cannot be met, the member is told on the transition issue
before it passes, with the reason and a new date. The transition issue is the
single audit record: it names who decided, when, and why.

## Privileges Retained

Emeritus status keeps the recognition earned by the former role without
recreating its authority.

- Being listed in project recognition materials, following the tiers in
  `Governance/RECOGNITION.md`.
- Attribution for past work, including continued credit on merged changes.
- Repository read access, so the member can follow the project.
- Participation in issues, pull requests, and discussions as a community
  member, exactly as `Governance/roles/CONTRIBUTOR.md` describes.
- An invitation to open governance meetings, with a voice to advise but no
  vote and no effect on quorum.
- Informal consultation when the member consents, including review comments
  offered as advice rather than as a required approval.
- The emeritus label or recognition marker where the project maintains one.

## Privileges Withdrawn

Emeritus status removes the duties, access, and decision authority of the
former role unless the member is reappointed through the process below.

- Voting rights and quorum on decisions reserved to active role-holders.
- Decision authority attached to the role, including triage, review
  approval, moderation, treasury signing, and security response duties.
- Membership of the maintainer team and any elevated repository permissions
  (write and admin), which are revoked or reduced to community-level read
  access.
- Entries in the CODEOWNERS file and any review-assignment rotation.
- Access to private channels, including security and conduct matters that are
  not public.
- Authority to represent the project externally or to speak for it.

Withdrawn privileges are listed explicitly on the transition issue so the
member knows exactly what changes, and any access change is applied only
after the recorded decision.

## Returning to Active Status

Emeritus status is reversible and is never a bar to returning. A member may
ask to return at any time by opening an issue, and the path depends on the
role sought.

- **Contributor.** A merged pull request reactivates the member; no issue or
  approval is required, as `Governance/policies/INACTIVITY.md` provides.
- **Reviewer or moderator.** The member demonstrates re-engagement through at
  least two completed reviews or moderation actions, and one active
  maintainer records approval on the return issue.
- **Maintainer.** The member demonstrates re-engagement through at least four
  completed reviews or merged pull requests within 60 days, and two active
  maintainers who are not the requestor record approval, followed by the
  onboarding steps in `Governance/roles/MAINTAINER.md`.
- **Appointment instead of reinstatement.** A return may also be made by
  nomination under `Governance/processes/NOMINATION.md`; prior emeritus
  service is evidence of the role's expectations and does not shorten the
  seconding requirement.

A return request is acknowledged within 3 business days and decided within 10
business days, or the member is told before the deadline passes with a new
date. A returning member has no waiting period and no penalty: the transition
back restores the full privileges of the role from the recorded decision.

## Ownership

- Maintainers own this process, decide each transition, and keep the
  transition issue and the role records in step.
- Changes to this process are proposed in a pull request that touches only
  the `Governance/` folder.
- This process is reviewed alongside `Governance/roles/EMERITUS.md` and
  `Governance/policies/INACTIVITY.md` whenever either is revised.

## Success

This process succeeds when every emeritus transition has a public record and
a named owner, when the member knows before the change exactly which
privileges are retained and which are withdrawn, when recognition is kept
without recreating authority, and when a member who wishes to return finds a
clear, welcoming path back.

## Regression Tests

Coverage is provided by `Governance/processes/EMERITUS_TRANSITION.test.ts`,
which pins the triggers, the retained and withdrawn privileges, and the
return-to-active path in this document to the guarantees made by
`Governance/roles/EMERITUS.md` and `Governance/policies/INACTIVITY.md`.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-28 | Initial version. | TeachLink maintainers |
