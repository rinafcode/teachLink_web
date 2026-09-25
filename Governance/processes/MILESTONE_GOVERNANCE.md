# Milestone Governance Process

## Purpose

This process defines how TeachLink Web creates milestones, what a milestone must
satisfy to be opened and to be closed, and who is accountable for it while it is
open. Milestones are the project's commitments at a level of detail finer than
the roadmap and coarser than a single issue, and this process makes those
commitments checkable rather than aspirational.

## Scope

This process applies to every milestone opened on this repository, for
application work and for governance work alike. It covers milestone creation,
entry and exit criteria, status reporting, ownership, and the handling of
milestones that stall. It does not decide what work belongs on the roadmap,
which is the roadmap process in
`Governance/processes/ROADMAP_GOVERNANCE.md`, and it does not define how
releases are cut, which is covered by
`Governance/processes/RELEASE_SIGNOFF.md`.

## What a Milestone Is

A milestone groups work that shares an outcome, a review window, and a target
date. It is not a release, a Git tag, a branch, or a deadline for its own sake.
A milestone is created when work is worth shipping and announcing together, when
a contributor needs a concrete scope to work against, or when a piece of work is
too large for a single issue and too narrow to be a standing roadmap horizon.

A milestone is retired as soon as it is closed, merged into another milestone,
or deferred. Milestones are never left open indefinitely to signal ongoing work.

## Creating a Milestone

Any contributor may propose a milestone in a GitHub issue. The issue is
reviewed in the maintainer triage queue, and the milestone is created when:

- The proposal names the outcome in one sentence and lists the issues that make
  it up, with at least three issues linked at creation.
- The proposal names a single milestone owner who is a maintainer, and at most
  one additional owner.
- The proposal carries a target date no more than one quarter out, or states
  why no date is appropriate and proposes a review date instead.
- The proposal is consistent with the current roadmap horizons and does not
  duplicate an existing milestone.
- A structural milestone (one that changes architecture, a public interface, or
  the contributor workflow) also has an accepted RFC under
  `Governance/processes/RFC_PROCESS.md` before the milestone is created.

## Entry Criteria

A milestone may only be opened once all of the following hold:

- **Scope is written down.** The milestone issue states the outcome, the linked
  issues, and an explicit non-goals list.
- **Owner is named.** A maintainer has accepted ownership in the issue thread.
- **Dependencies are known.** Any dependency on `teachLink_backend`, a contract
  change, a migration, or a governance decision is listed with its status.
- **Design is settled.** Work that needed an RFC has an accepted RFC, and work
  that did not states why not.
- **Estimates exist.** Each linked issue has a size estimate and at least one
  assigned contributor, or a stated reason why it is unassigned.
- **Baseline is clean.** `main` builds and the required quality gates
  (`type-check`, `lint`, `build`, `test`) pass on the commit the milestone
  starts from.

## Exit Criteria

A milestone is closed only when all of the following hold:

- **Every linked issue is resolved or explicitly deferred,** with the decision
  and its reasoning recorded on the issue.
- **The work is merged** into the protected branches through the normal pull
  request flow, with at least one maintainer approval and required checks green.
- **The shipped behaviour is documented,** including user-facing documentation
  and the changelog entry or release note the change requires.
- **No new deprecations are left unannounced.** Anything deprecated in the
  milestone follows `Governance/policies/DEPRECATION.md` and its notice period
  is running.
- **Follow-ups are filed,** as new issues linked back to the milestone, so
  remaining work is tracked rather than forgotten.
- **A closing note is posted** in the milestone issue recording what shipped,
  what was dropped, and the lessons worth carrying into the next milestone.

A milestone that meets the exit criteria is closed, not left open. Work that
misses the target date is rescheduled or deferred explicitly, and the reason is
recorded.

## Status and Cadence

- The milestone owner posts a written status update in the milestone issue at
  least every seven days while the milestone is open, covering shipped work,
  blocked work, and the current confidence in the target date.
- A milestone with no merged work and no status update for fourteen consecutive
  days is treated as at risk. The owner is asked to restate the target date,
  narrow the scope, or hand ownership to another maintainer.
- Maintainers review at-risk and overdue milestones in the maintainer sync held
  every two weeks, and record the outcome of that review on the milestone issue.
- A milestone that has been at risk for two consecutive reviews is closed as
  deferred, with the remaining work moved onto new issues.

## Ownership and Accountability

- **Milestone owner.** A maintainer who is accountable for the scope, the status
  updates, the decision to reschedule, and the closing note. Ownership is
  personal and is not a task for the whole maintainer group.
- **Linked issue assignees.** Responsible for delivering their issue within the
  milestone and for flagging slippage as soon as it is visible, not at the next
  status update.
- **Maintainers.** Approve the milestone at creation, may reassign ownership
  when an owner is unavailable, and review milestones that slip.
- **Contributors.** May propose milestones and may raise a milestone for review
  if the triage queue has not responded within fourteen days, following the
  rights described in `Governance/roles/CONTRIBUTOR.md`.
- **Exceptions.** Only maintainers may grant an exception to any entry or exit
  criterion, and the exception is recorded on the milestone issue with its
  reasoning and an expiry date. Maintainer authority is bounded as described in
  `Governance/roles/MAINTAINER.md`.
- **Ownership on departure.** If an owner steps down or becomes inactive, the
  remaining maintainers assign a new owner or close the milestone; ownership is
  never left unassigned.

## Success

This process succeeds when every open milestone has a named owner and a current
status, when milestones close on the criteria above rather than on a date that
has passed, and when contributors can tell from the issue tracker which work is
committed, which work is at risk, and who to ask about either.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | Aliyu Ibrahim (@ykargeee-bit) |
