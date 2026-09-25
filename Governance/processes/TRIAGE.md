# Issue Triage Process

## Purpose

Issues arrive unlabelled, unordered, and addressed to nobody, and without triage a
contributor cannot tell what the project wants worked on next or whether their
report was read. This process defines the steps an issue moves through after it
is opened, the labels an issue must carry before it counts as triaged, and the
cadence at which the backlog is reviewed so that nothing rots quietly.

## Scope

This process applies to issues filed in the `rinafcode/teachLink_web` repository.
It covers first response, classification, validation, prioritisation, and routing
to the right owner. It does not cover the design or scope of a proposed change,
which belongs to the RFC process in `Governance/processes/RFC_PROCESS.md`, nor
the review of a pull request, nor the release of merged work.

Vulnerabilities are not triaged in public. An issue that appears to describe a
vulnerability is handled under `Governance/SECURITY_POLICY.md` and
`Governance/processes/VULN_DISCLOSURE.md`, and the public issue is redirected to
the private channel within 24 hours.

## Triage Steps

Every issue moves through the following steps. Each step has an owner and an exit
criterion, so it is always clear which step an issue is waiting in.

### 1. Acknowledge

A maintainer or the assigned issue triager replies within three business days to
confirm the issue was seen, restate the reported problem in one sentence, and
name the next step. An acknowledgement is a commitment to respond, not a
commitment to fix.

- **Owner:** issue triager, or any maintainer.
- **Exit criterion:** a public maintainer reply exists and the issue is assigned.

### 2. Classify

Apply exactly one type label from `bug`, `enhancement`, `documentation`,
`question`, and `security`. The legacy `feature` label is remapped to
`enhancement` at this step so the backlog has a single spelling for new
capability requests.

- **Owner:** issue triager.
- **Exit criterion:** exactly one type label is set.

### 3. Validate, or ask for what is missing

The triager attempts to reproduce a `bug` against the current tip of `main`, or
confirms that the behaviour described in an `enhancement` is genuinely missing.
When the report cannot be acted on, set the status label that matches the gap
and ask one concrete question rather than a general one.

- `triage: needs-info` (to be created) — the request is understood, but a detail
  is missing: the account role, the browser, the expected value, or the build.
- `triage: needs-repro` (to be created) — the triager could not reproduce the
  behaviour from the evidence given; ask for a minimal reproduction, a failing
  test, or a short screen recording.

- **Owner:** issue triager.
- **Exit criterion:** the issue is either confirmed, or carries a status label
  and a single specific question to the reporter.

### 4. Route to an area and find duplicates

Apply at least one area label so the issue reaches the people who own that
surface, and search the backlog for an existing report of the same problem. A
second report of the same defect is closed as `duplicate` with a link to the
canonical issue and a one-line summary of why it is the same defect.

- **Owner:** issue triager.
- **Exit criterion:** an area label is set, and any duplicate relationship is
  recorded with a link.

### 5. Assess priority

Assign one priority label from the rubric below. Priority reflects user impact
and how close the issue sits to a release, not how enthusiastic the report is.
The reporter may propose a priority; the triager decides.

- **Owner:** issue triager; a maintainer confirms any `priority: high`.
- **Exit criterion:** a priority label is set and the reason for it is one
  sentence in the issue thread.

### 6. Set the working status

A confirmed issue is marked `triage: confirmed` and becomes eligible for
assignment. An issue that cannot start yet — waiting on an upstream dependency,
on a design decision, on a partner team, or on a release — is marked
`triage: blocked` with a comment naming what it is waiting on. An issue with no
maintainer or reporter activity for 60 calendar days is marked `triage: stale`.

- **Owner:** issue triager.
- **Exit criterion:** the status label matches the issue's actual state.

### 7. Escalate security reports

An issue whose content describes a vulnerability is handled the same day, in
private, under `Governance/SECURITY_POLICY.md`. The triager replies to the
reporter with the private reporting route, leaves the public issue otherwise
untouched so it is not used as an advertisement for the defect, and does not
discuss exploit details in the open thread. Reports received through the triage
queue are treated exactly like reports received through the private channel.

- **Owner:** the maintainer acting as security contact for the current quarter.
- **Exit criterion:** the report exists as a private advisory and the reporter
  has been acknowledged within 24 hours.

### 8. Close out

An issue is closed as `duplicate`, `invalid`, or `wontfix` when it no longer
describes work the project will do. The closing comment states which of the
three it is and why. A closed issue is reopened only when a maintainer agrees,
or when a reporter supplies new evidence that changes the answer, not to
continue an old discussion.

- **Owner:** maintainer.
- **Exit criterion:** a closing comment with a reason exists.

## Required Labels

An issue counts as **triaged** when all four conditions below hold.

| Requirement | Accepted values | Notes |
| --- | --- | --- |
| One type label | `bug`, `enhancement`, `documentation`, `question`, `security` | `feature` is remapped to `enhancement` during triage. |
| One priority label | `priority: high`, `priority: medium`, `priority: low` | Chosen by the triager from the rubric, not by the reporter. |
| One status label | `triage: confirmed`, `triage: needs-info`, `triage: needs-repro`, `triage: blocked`, `triage: stale` | All five are to be created; see below. |
| One or more area labels | `frontend`, `governance`, `cicd`, `monitoring`, `performance`, `test`, `dependencies` | Use every area that genuinely applies, not only the first. |

Terminal states use the repository's existing labels instead of a status label:
`duplicate`, `invalid`, and `wontfix`.

Recommended, but not required for an issue to be triaged: `good first issue`,
`help wanted`, `intermediate`, `tech-debt`, `refactor`, `chore`, `optimization`,
and `javascript`. The first three describe how approachable the work is and are
only applied when the issue is also `triage: confirmed`.

Programme and reward labels — `ODHack14`, `Non-Rewarded`, `Maybe Rewarded`,
`GrantFox OSS`, `Third Campaign`, `Stellar Wave`, and `onlydust-wave` — are
applied by the programmes that own them and are not part of triage.

**The status labels are new.** `triage: confirmed`, `triage: needs-info`,
`triage: needs-repro`, `triage: blocked`, and `triage: stale` do not exist in the
repository yet and must be created before this process is enforced on a live
backlog. Until they exist, a triager records the same state in a `Triage:` line
in the issue body, using one of the five names, and the four conditions above are
treated as satisfied in that form.

The repository currently has no milestones, so triage does not depend on one.
When milestones are introduced, a `triage: confirmed` issue is added to the
current iteration milestone and the milestone is the authoritative ordering;
until then the priority label is.

## Priority Rubric

`priority: high`

- An active security or privacy issue, data loss, or an authentication failure.
- A broken critical user flow: sign-in, session handling, or core content.
- A regression on `main` that is not present in the previous release line.
- Anything blocking a release already in progress.

`priority: medium`

- A defect with a documented workaround, or a well-scoped enhancement with an
  agreed outcome.
- A failing quality gate on `main` (`type-check`, `lint`, `build`, `test`) with
  no user-visible symptom.
- A governance gap that leaves a contributor unsure of their next step, such as
  a process that `Governance/README.md` points to but that does not exist.

`priority: low`

- Cosmetic, copy, or layout issues with no accessibility consequence.
- Documentation that is inaccurate but not misleading about how to contribute.
- Speculative proposals with no agreed outcome yet.

The security severity of an issue is assigned separately from its priority, using
the scale in `Governance/SECURITY_POLICY.md`. A `priority: high` issue can carry
a `low` security severity, and a report that turns out not to be a
vulnerability at all is re-triaged as an ordinary issue.

## Triage Cadence

- **Daily quick pass — 10 minutes, on business days.** The security contact
  checks for new `security` reports and for issues that have been waiting on a
  maintainer for more than three business days.
- **Weekly triage session — 60 minutes, on Tuesday or the next business day.**
  The session works the backlog in this order: security, then `priority: high`,
  then aging `triage: needs-repro` and `triage: needs-info` issues, then
  everything else. A short digest of what changed is posted on the issue or
  tracking issue used for the session.
- **Monthly backlog audit — 60 minutes.** Review the median and 90th-percentile
  time to triage, the count of unlabelled issues older than seven days, the
  ratio of `priority: high` to `priority: low`, the count of issues in each
  status, and the 60-day stale sweep. Findings that need work become issues.
- **Quarterly label and milestone review — 30 minutes.** Maintainers confirm the
  label set still matches this document, add or retire labels with the reason
  recorded, and open the next iteration milestone when milestones are in use.

Triage targets, reviewed at the monthly audit:

- 90 percent of new issues receive a first maintainer response within three
  business days.
- 90 percent of new issues are fully triaged within seven calendar days.
- No issue carrying the `security` label waits more than 24 hours for the
  private redirect described in `Governance/SECURITY_POLICY.md`.
- No open issue goes 30 calendar days without a maintainer comment explaining
  why it is waiting.

## Ownership, Decisions, and Exceptions

- Maintainers own this process and hold final say on type, priority, and
  closure, as set out in `Governance/roles/MAINTAINER.md`.
- The issue triager is a contributor role, as described in
  `Governance/roles/CONTRIBUTOR.md`. A triager proposes labels, priority, and
  duplicate links; a maintainer confirms every `priority: high` assignment, every
  closure of someone else's issue, and every exception below.
- A reporter may ask for re-triage once, with new evidence such as a working
  reproduction or a correction of fact. After that, a maintainer decides whether
  the issue is re-triaged.
- **Exceptions.** A maintainer may skip, reorder, or defer any step when the
  issue is a live incident or a security matter, and records the reason on the
  issue so the step is auditable. A step may also be deferred for an
  `enhancement` that would change the product direction: such an issue is
  triaged as usual and then routed to the RFC process in
  `Governance/processes/RFC_PROCESS.md`, where the decision is made, rather than
  being decided during triage.
- Work that ships before its issue is fully triaged does not need to be
  re-triaged afterwards; the step is recorded as skipped with the reason.
- Changes to this process are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This process succeeds when a contributor who opens an issue always receives a
human response within three business days, when any issue can be put into the
correct bucket by reading its labels alone, when the weekly session clears the
queue instead of triaging only what arrives, and when the monthly audit shows
the median time to triage falling rather than the backlog growing.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | DevMuhdishaq (@DevMuhdishaq) |
