# Conflict Resolution Process

## Purpose

This process defines how contributors and maintainers resolve
interpersonal disagreements and technical disputes for TeachLink Web.
It gives every party a predictable path from direct discussion to a
recorded decision, so conflicts are handled fairly, promptly, and in
the open wherever possible.

## Scope

This process applies to disagreements between contributors,
reviewers, and maintainers in issues, pull requests, and community
channels for this repository.

It covers interpersonal conflicts and good-faith technical
disagreements about a change under review. It does not cover
conflicts of interest, which follow
`Governance/policies/CONFLICT_OF_INTEREST.md`, nor vulnerability
reports, which follow `Governance/SECURITY_POLICY.md` and
`Governance/processes/VULN_DISCLOSURE.md`, nor design proposals,
which follow `Governance/processes/RFC_PROCESS.md`, nor issue
routing, which follows `Governance/processes/TRIAGE.md`.

Private conduct matters that cannot be discussed in the open are
handled with the same steps below but in a private channel, with
only the outcome recorded publicly where it is safe to do so.

## Resolution Steps

Every conflict moves through the following steps in order. A step
is skipped only when safety requires it, and the reason is recorded
in the thread by a maintainer.

### 1. Direct discussion

The parties restate the disagreement in one thread, stay on the
technical or conduct facts, and propose a concrete outcome. Each
party gets a chance to respond once before any wider call for input.

- **Owner:** the parties involved.
- **Exit criterion:** agreement recorded in the thread, or a request
  for facilitated discussion after 3 business days without progress.

### 2. Facilitated discussion

A neutral facilitator (see below) joins the thread, sets the scope
of the dispute, and time-boxes the discussion to 5 business days.
The facilitator summarises each position fairly and proposes a
compromise that fits the project scope in `Governance/SCOPE.md`
and the values in `Governance/VALUES.md`.

- **Owner:** neutral facilitator.
- **Exit criterion:** agreed compromise recorded in the thread, or
  escalation requested by any party or the facilitator.

### 3. Maintainer decision

Maintainers review the thread, the facilitator summary, and any
linked RFC, issue, or pull request, then record a decision with
reasoning. The decision states what was decided, why, and what, if
anything, can reopen it.

- **Owner:** maintainers, as defined in
  `Governance/roles/MAINTAINER.md`.
- **Exit criterion:** written decision with reasoning posted in the
  thread within 5 business days of escalation.

### 4. Record and follow up

The decision and its reasoning stay in the thread as the record.
When the conflict exposed a gap in docs, process, or tooling, a
follow-up issue is opened and linked from the thread. Retaliation
against anyone for raising or participating in a conflict process
is treated as a fresh conduct matter under this same process.

- **Owner:** facilitator records; maintainers ensure follow-up.
- **Exit criterion:** record complete and any follow-up issue linked.

## Neutral Facilitator Role

The neutral facilitator keeps the discussion fair and moving. The
facilitator must be uninvolved in the substance of the dispute, must
not have approved or authored the change under dispute, and must
disclose any personal stake under
`Governance/policies/CONFLICT_OF_INTEREST.md` and step aside when
one exists.

The facilitator:

- Sets scope, ground rules, and deadlines, and enforces respectful
  conduct in the thread.
- Summarises positions without taking sides and proposes options
  tied to project scope and values.
- Does not decide the outcome, except to call for escalation when
  discussion stalls or conduct breaks down.
- Hands over to another uninvolved maintainer or contributor when
  impartiality could reasonably be questioned.

Any maintainer may appoint the facilitator; when no uninvolved
maintainer is available, the parties may agree on a trusted
contributor as described in `Governance/roles/CONTRIBUTOR.md`.

## Escalation Path

Escalation moves one level at a time, with the record travelling
with it:

1. Thread parties -> neutral facilitator.
2. Facilitator -> maintainers for a recorded decision.
3. Maintainers -> project leadership for conduct matters that
   involve a maintainer or that the maintainers cannot resolve
   impartially.

Security, privacy, or safety concerns skip the queue and are
handled immediately under `Governance/SECURITY_POLICY.md`. A party
may request re-review once with new evidence; after that the
maintainer decision stands unless new facts emerge.

## Ownership

- Maintainers own this process and hold final say on the outcome,
  as set out in `Governance/roles/MAINTAINER.md`.
- Changes to this process are proposed in a pull request that
  touches only the `Governance/` folder.

## Success

This process succeeds when disagreements are raised early in the
open, when every dispute has a named owner and a deadline, when
decisions are recorded with reasoning, and when contributors trust
that raising a conflict will not lead to retaliation.

## Regression Tests

Not applicable for this process document. Coverage is provided by
the existing governance checks and the repository quality gates.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-27 | Initial version. | TeachLink maintainers |
