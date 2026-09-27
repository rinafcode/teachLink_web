# Stale Issue Policy

## Purpose

This policy defines how TeachLink Web marks inactive issues
as stale, warns participants before closing, closes issues
that stay inactive, and reopens them when activity resumes.
It keeps the backlog honest without closing work that is
still wanted, and gives contributors one predictable rule
instead of ad hoc cleanup.

## Scope

This policy applies to issues filed in this repository. It
covers the staleness threshold, the warning comment, the
closing step, and the reopen path. It does not cover pull
requests, which are closed by review inactivity under
`Governance/policies/REVIEW_POLICY.md`, nor security reports
handled in private under `Governance/SECURITY_POLICY.md`.

It works with the triage process in
`Governance/processes/TRIAGE.md` and the labels defined in
`Governance/LABEL_TAXONOMY.md`. Label meaning stays in the
taxonomy; this policy only sets timing and steps.

## Staleness Threshold

An issue becomes eligible for staleness handling after
60 calendar days with no activity. Activity means a human
comment, a label change by a maintainer, an assignment
change, a linked pull request, or a reopen event. Automated
bot comments alone do not reset the clock.

The 60 calendar days threshold matches the stale sweep in
`Governance/processes/TRIAGE.md`. The clock pauses while an
issue waits on a maintainer action recorded in the thread,
and while an issue carries an exempt label below.

The following issues are exempt from automatic staleness
handling and are never marked stale by automation:

- Issues labelled `security` or under an active embargo.
- Issues labelled `priority: high` or blocking a release.
- Pinned issues, milestones, and announced roadmap items.
- Issues with an assigned owner and a recorded due date.

Exempt issues are still reviewed at the monthly backlog
audit, where maintainers confirm the exemption still holds.

## Warning and Closing Steps

Staleness handling has two visible steps: warning, then
closing. Both steps are recorded in the issue thread so the
decision is auditable.

- **Warning.** When the threshold is reached, automation or
  a maintainer adds the `triage: stale` status label and
  posts a warning comment. The comment states the issue
  appears inactive, asks if it is still wanted, and names
  the closing date. The warning starts a grace period of
  14 calendar days.
- **Grace period.** Any human activity during the grace
  period removes the `triage: stale` label and cancels the
  pending close. The 60 calendar days clock restarts from
  that activity.
- **Closing.** If no human activity occurs within the
  14 calendar days after the warning, a maintainer or
  automation closes the issue. The closing comment links
  this policy, states the reason as inactive, and explains
  how to reopen. Status labels are removed on close under
  `Governance/LABEL_TAXONOMY.md`; type, area, and priority
  labels are kept as history.
- **No silent transitions.** Issues are never marked stale
  or closed as stale without the thread comments above. A
  bulk sweep lists each issue it touches.

Closing as stale is not a judgement on value. It means no
participant confirmed the work is still wanted in time.

## Reopen Path

Any participant may reopen a closed-as-stale issue by
commenting with new context or by reopening it directly.
Reopening removes the closed-as-stale state, clears any
remaining `triage: stale` label, and restarts triage under
`Governance/processes/TRIAGE.md` rather than continuing the
old discussion.

- A reporter reopens by adding a reproduction, expected
  behaviour, or confirmation the problem still exists.
- A maintainer reopens by confirming the work is wanted
  and setting type, priority, and status labels again.
- Disposition labels `duplicate`, `invalid`, and `wontfix`
  are removed on reopen so history stays searchable.
- An issue closed in error is reopened on request with no
  penalty, and the thread records the correction.

An issue may cycle through warning and closing more than
once. Repeat cycles are a signal at the monthly audit to
re-scope, split, or close the issue with a firmer reason.

## Ownership and Review

- Maintainers own this policy, approve exemptions, and
  review stale sweeps at the monthly backlog audit so
  automation does not close wanted work.
- Changes to this policy are proposed in a pull request
  that touches only the `Governance/` folder as
  `Governance/README.md` requires.
- This document is versioned with the repository; it
  describes the process the project actually follows.

## Success

This policy succeeds when no open issue waits 60 calendar
days without a recorded state, every stale warning names a
closing date, every stale close links this policy and its
reopen path, and reopened issues return to triage instead
of stalling again.
