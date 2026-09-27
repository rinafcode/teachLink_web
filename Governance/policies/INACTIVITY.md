# Inactivity Policy

## Purpose

This policy defines what counts as inactivity for each contributor role in
TeachLink Web, the process for notifying an inactive role-holder before any
status change takes effect, and the consequences of confirmed inactivity
together with the path back to active status. It gives every contributor a
single, versioned reference so that role transitions are predictable,
transparent, and reversible.

Without a written policy, inactivity is handled inconsistently: some
role-holders are quietly removed without notice while others retain access
indefinitely. Both outcomes harm the project — the first erodes trust, the
second creates security and governance risk. This document closes that gap.

## Scope

This policy applies to every named role defined under `Governance/roles/`:
Contributor, Reviewer, Maintainer, and any working-group lead or domain
steward recognised in a governance document. It covers inactivity in the
TeachLink Web repository and its associated governance spaces (issue tracker,
discussion forums, and working-group channels). It does not cover temporary
absences that are communicated in advance, which are governed by the leave
provisions each role document may define.

## Inactivity Thresholds

Inactivity is defined per role because the expected cadence of participation
differs between roles.

- **Contributor.** A Contributor is considered inactive after **six months**
  with no merged pull request, no reviewed pull request, no substantive
  comment on an open issue, and no participation in a governance discussion.
  A Contributor role carries no elevated access, so the threshold is longer
  and the consequence is a status note rather than access removal.
- **Reviewer.** A Reviewer is considered inactive after **three months** with
  no completed review, no review comment, and no response to a review
  assignment. The shorter threshold reflects the access and the expectation
  that Reviewers participate on a regular cadence.
- **Maintainer.** A Maintainer is considered inactive after **two months**
  with no merged pull request, no completed review, no response to a
  time-sensitive governance decision, and no participation in the regular
  maintainer sync. The shortest threshold reflects the elevated access and
  the responsibilities the role carries.
- **Working-group lead / domain steward.** A lead or steward is considered
  inactive after **two months** with no agenda published, no meeting
  facilitated, no decision recorded, and no response to an action item
  assigned to them. The threshold matches Maintainer because the role carries
  equivalent governance responsibility.

A single qualifying action within the threshold window resets the clock.
Qualifying actions are the same ones listed above for each role. Passive
actions (watching the repository, starring, or reading notifications without
responding) do not reset the clock.

## Notification Process

Before any status change takes effect, the project must make a genuine effort
to reach the role-holder through the following steps, in order.

1. **First notice — 14 days before the threshold is reached.** A maintainer
   or the governance automation posts a notice on the role-holder's most
   recent active GitHub thread (or opens a new issue tagged with the
   role-holder's username) stating that the threshold will be reached in
   fourteen days and listing the qualifying actions that would reset the
   clock.
2. **Second notice — on the day the threshold is reached.** A maintainer
   confirms that no qualifying action has occurred and posts a second notice
   on the same thread stating that the role-holder is now considered inactive
   and that their status will change in **seven days** unless they respond.
3. **Response window — seven days.** The role-holder may respond with a
   qualifying action, a request for a short extension (up to 30 days, granted
   once per 12-month period), or a voluntary step-down. Any of these
   responses pauses the status-change process.
4. **Status change.** If the seven-day window closes with no response, a
   maintainer records the status change on the tracking issue and applies
   the consequences defined below. The tracking issue is linked from the
   role-holder's entry in the relevant `Governance/roles/` document.

Notices must be public (on GitHub) so the process is auditable. Private
messages may supplement public notices but never replace them.

## Consequences

Consequences are proportional to the access the role carries and are applied
only after the notification process is complete.

- **Contributor.** The role-holder's entry in the Contributor list is marked
  inactive. No access is changed. The entry is retained so the contribution
  history remains visible.
- **Reviewer.** The role-holder is removed from the CODEOWNERS file and any
  review-assignment rotation. Repository read access is retained. The
  role-holder's entry in the reviewer list is moved to an inactive section.
- **Maintainer.** The role-holder is removed from the CODEOWNERS file, the
  maintainer team, and any elevated repository permissions (write, admin).
  Repository read access is retained. The role-holder's entry in
  `Governance/roles/MAINTAINER.md` is moved to an inactive section.
- **Working-group lead / domain steward.** The role-holder is removed from
  the lead position. If no active co-lead exists, the working group is placed
  in a caretaker state under the maintainer team until a new lead is
  identified. The transition is recorded in the relevant governance document.

In every case the tracking issue records who made the change, when, and why,
so the decision is auditable.

## Reinstatement

A former role-holder may request reinstatement at any time by opening an
issue in the repository. The following apply.

- **Contributor.** Reinstatement is automatic on the next merged pull
  request. No issue or approval is required.
- **Reviewer.** A former Reviewer may request reinstatement after demonstrating
  re-engagement through at least **two completed reviews** on open pull
  requests. Reinstatement requires approval from one active Maintainer,
  recorded on the reinstatement issue.
- **Maintainer.** A former Maintainer may request reinstatement after
  demonstrating re-engagement through at least **four completed reviews or
  merged pull requests** within a 60-day window. Reinstatement requires
  approval from two active Maintainers who are not the requestor, following
  the normal Maintainer onboarding process in `Governance/roles/MAINTAINER.md`.
- **Working-group lead / domain steward.** Reinstatement follows the same
  process as initial appointment for the role, documented in the relevant
  working-group charter.

A role-holder who steps down voluntarily is treated as a former role-holder
and follows the same reinstatement path. There is no penalty for voluntary
step-down.

## Ownership and Review

- Maintainers own this policy, approve exceptions, and apply it consistently
  across all roles.
- A change to this policy is proposed in a pull request that touches only the
  `Governance/` folder.
- This policy is reviewed alongside `Governance/roles/MAINTAINER.md`
  and any working-group charters whenever a threshold or consequence is
  proposed for change.

## Success

This policy succeeds when every inactive role transition is preceded by a
public notice, no role-holder loses access without a recorded reason, and
former contributors can return to active participation through a clear,
welcoming path.
