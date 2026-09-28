# Role Nomination Process

## Purpose

This process defines how people are nominated for project roles in TeachLink
Web: how a nomination is raised, what the seconding requirement demands before
a nomination may be decided, and the timeline within which maintainers record
a decision. It is the role nomination and appointment process that
`Governance/roles/TREASURER.md` refers to, and the promotion process that
`Governance/roles/CONTRIBUTOR.md` and `Governance/roles/MAINTAINER.md` assume
exists. Writing it down means a name can be put forward in the open, on a
published clock, instead of through a private conversation.

## Scope

This process applies to nominations for the project's roles: the issue
triager role, the maintainer role, the treasurer, and any other role defined
by a document in `Governance/roles/`, including promotions along the
contributor ladder. A motion to revoke a role follows the same steps, with
the evidence describing the duty that was not met, as
`Governance/roles/TREASURER.md` requires for its own role.

It does not cover recognition tiers, which follow the quarterly nomination
review in `Governance/RECOGNITION.md`, nor the design of the roles
themselves, which is defined in `Governance/roles/`. Nominations are ordinary
issues, so they are acknowledged and labelled under
`Governance/processes/TRIAGE.md` like everything else.

## Raising a Nomination

A nomination is raised by opening a public issue in this repository, titled
with the word `Nomination`, the role, and the candidate's handle — for
example, `Nomination: issue triager — @alice`. Raising it in the open is what
makes the process auditable: a nomination made only in chat, direct messages,
or a meeting does not start the timeline and has no standing.

Every nomination states:

- **The role.** Exactly one role per nomination, named the way the
  governance document that defines that role names it.
- **The candidate.** The candidate's handle, and whether the nomination is of
  someone else or a self-nomination. Self-nominations are allowed and are
  treated exactly like any other nomination.
- **The evidence.** What the candidate has already done that meets the role's
  expectations, linked: merged pull requests, reviews, triage work, or
  governance contributions.
- **The conflict declaration.** Any relationship between the nominator and
  the candidate that a reader should weigh, disclosed under
  `Governance/policies/CONFLICT_OF_INTEREST.md`.

Anyone may raise a nomination: a candidate for themselves, a contributor as
defined in `Governance/roles/CONTRIBUTOR.md`, or a maintainer. A maintainer
acknowledges the nomination within 3 business days, applies the `governance`
area label, and repeats the deadlines below on the issue, in line with
`Governance/processes/TRIAGE.md`.

## Seconding Requirement

No nomination is decided on the nominator's word alone. Before a nomination
reaches the maintainers for decision it needs at least one second, and that
second must come from someone other than the nominator and other than the
candidate.

- **Who may second.** Anyone with at least one merged pull request in this
  repository, as `Governance/roles/CONTRIBUTOR.md` defines a contributor. A
  maintainer may second.
- **How to second.** A comment on the nomination issue that backs the
  nomination and gives one sentence of the seconder's own reason. A second is
  a statement of support, not a promise to argue the case.
- **Window.** A second counts only when it is posted within 10 business days
  of the nomination being opened.
- **No second.** A nomination with no second when the window closes lapses:
  it is closed as not seconded, with the lapse recorded on the issue. It may
  be re-raised after 30 calendar days with new evidence.
- **Count is a floor, not a score.** Further seconds are welcome and change
  nothing about the timeline; the maintainers weigh the evidence, not the
  number of supporters.

A candidate cannot second their own nomination, and the nominator's own
support is never counted as the second.

## Decision Timeline

The clock starts when the nomination issue is opened, and every deadline
below is a commitment, not an estimate.

- **Acknowledged** — any maintainer, within 3 business days after opening.
- **Seconding window closes** — an eligible seconder, 10 business days after
  opening.
- **Decision recorded** — the maintainers, 5 business days after the window
  closes.
- **Outcome posted on the issue** — the maintainers, with the decision.

- If a deadline cannot be met, the nominator and the candidate are told on
  the nomination issue **before** it passes, with the reason and a new date.
- No nomination goes more than 30 calendar days without either a recorded
  decision or a notice giving a new date.
- The outcome is one of three, recorded on the issue with its reasoning:
  **appointed**, meaning the candidate takes the role when the decision is
  posted; **declined**, with the maintainers' reasons recorded; or **lapsed**,
  meaning the seconding window closed without a second.
- A declined or lapsed nomination does not end the matter. Either may be
  re-raised after 30 calendar days with new evidence, and a re-raised
  nomination runs the same timeline from its new opening date.
- The record of who holds a role is the set of decided nomination issues for
  that role, so any contributor can reconstruct the appointment history
  without private access.

## Ownership

- Maintainers own this process and make the appointment decision, as set out
  in `Governance/roles/MAINTAINER.md`.
- The nominator owns the nomination issue until the decision is recorded;
  after that, maintainers own any follow-up.
- Changes to this process are proposed in a pull request that touches only
  the `Governance/` folder.

## Success

This process succeeds when any contributor can put a name forward for a role
and know exactly what happens next, when no nomination depends on a private
conversation, when every decision is recorded with its reasoning inside the
published timeline, and when the roles in `Governance/roles/` are held by
people whose appointment is on the public record.

## Regression Tests

Regression coverage for this process lives in
`Governance/processes/NOMINATION.test.ts`. It pins the nomination contents,
the seconding requirement, and the decision timeline to this document so
they cannot silently regress — for example, an edit that drops the second,
relaxes a deadline, or removes the public-issue rule fails CI.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-27 | Initial version. | TeachLink maintainers |
