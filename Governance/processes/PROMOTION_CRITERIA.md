# Role Promotion Criteria

## Purpose

This document defines the objective criteria a contributor must meet
before being eligible for promotion to a higher project role in TeachLink
Web, who may nominate and approve a promotion, and the evidence that must
be supplied to support the nomination. It supplements the nomination and
decision process in `Governance/processes/NOMINATION.md` by specifying
what achievement looks like at each step of the contributor ladder. Without
published criteria, role boundaries are invisible and promotions appear
arbitrary.

## Scope

This document covers promotions within the contributor ladder for TeachLink
Web: from community participant to Contributor, from Contributor to
Reviewer, and from Reviewer to Maintainer. It does not cover the Treasurer
role (see `Governance/roles/TREASURER.md`) or working-group leads, whose
criteria are defined in the relevant working-group charter.

Promotion is separate from recognition, which is handled quarterly under
`Governance/RECOGNITION.md`. Meeting the criteria makes a person eligible
for promotion; it does not automatically grant the role.

## Criteria by Role

### Contributor

A community participant is eligible to become a Contributor when they have:

- At least **one merged pull request** in this repository that closes an
  assigned issue. A pull request with no assigned issue, or one that
  modifies only documentation with no associated change to functionality,
  does not satisfy this criterion on its own; at least one merged pull
  request must address a labelled, triaged issue.
- Demonstrated adherence to the project's contribution standards: changes
  are small and focused, pass the required quality gates (`type-check`,
  `lint`, `build`, `test`), use `lucide-react` icons, and produce no
  console errors.
- No unresolved conduct matter under `Governance/CODE_OF_CONDUCT.md`.

The Contributor role is granted automatically: the first pull request
that meets the above conditions establishes the role with no nomination
required. It is documented here for completeness and so the expectation
is explicit.

### Reviewer

A Contributor is eligible for the Reviewer role when they have:

- At least **five merged pull requests** in this repository spanning at
  least **two different areas** of the codebase (features, components,
  services, infrastructure, documentation, governance).
- At least **five substantive review comments** left on other
  contributors' pull requests — comments that identify a correctness
  issue, a performance concern, an accessibility gap, or a clear code
  quality improvement, not purely approvals or nits.
- Demonstrated familiarity with the project's architecture, coding
  conventions, and accessibility requirements as evidenced by review
  comments or pull-request descriptions.
- At least **three months of active participation** in the repository
  (issues, pull requests, or reviews) with no gap longer than 30
  consecutive days.
- No unresolved conduct matter.

### Maintainer

A Reviewer is eligible for the Maintainer role when they have:

- At least **fifteen merged pull requests** in this repository, of which
  at least **five** addressed non-trivial scope: new features, refactors
  covering more than two files, or governance documents with a companion
  test suite.
- At least **twenty substantive review comments** on other contributors'
  pull requests, at least **five** of which led to a revision or were
  explicitly cited as influential by the PR author.
- Demonstrated familiarity with the full contributor workflow and the
  project's governance: how issues are triaged, how nominations work, how
  the release cadence operates, and how conflicts are resolved.
- At least **six months of active participation** at Reviewer level with
  no gap longer than 30 consecutive days.
- Availability to respond to review assignments, security disclosures,
  and time-sensitive governance decisions within the response windows
  committed in `Governance/processes/ESCALATION_PATH.md`.
- No unresolved conduct matter.

## Nomination and Approval

Promotions to Reviewer and Maintainer follow the full nomination and
decision process defined in `Governance/processes/NOMINATION.md`:

1. A nomination is opened as a public issue by any eligible nominator.
2. At least one second is posted within the 10-business-day seconding
   window.
3. The maintainers record a decision within 5 business days of the
   seconding window closing.

The nomination evidence must include direct links to the pull requests and
review comments cited against the criteria above. Assertions without links
do not satisfy the evidence requirement.

**Who may nominate.** Anyone who satisfies the definition of Contributor in
`Governance/roles/CONTRIBUTOR.md` may nominate, including the candidate
themselves. Self-nominations follow the same process as any other.

**Who approves.** The existing Maintainers approve promotions, recorded by
simple majority of those who respond within the decision window. An
abstention is not a no. A decision reached with two or fewer participating
Maintainers is valid but should be reviewed at the next maintainer sync.

## Evidence Requirements

The nomination issue must include, at minimum:

- A link to each pull request cited as evidence, with the merge date
  visible.
- A link to each review comment cited as substantive, with the pull
  request visible.
- A plain-language summary of the candidate's contribution to areas
  outside their own pull requests (triaging, documentation, governance,
  community support).
- The conflict declaration required by
  `Governance/policies/CONFLICT_OF_INTEREST.md`.

Evidence assembled after the nomination is opened is acceptable; it is
added as a comment on the nomination issue and is considered part of the
nomination record. Assertions without links do not satisfy the evidence
requirement, regardless of when they are added.

## Ownership

- Maintainers own this document and are responsible for keeping the
  criteria aligned with the project's actual expectations.
- A change to the criteria is proposed in a pull request that touches
  only the `Governance/` folder.
- When the project's contribution standards change in a way that affects
  what counts as a qualifying pull request or review, this document is
  updated in the same pull request.

## Success

This document succeeds when any contributor can read it and determine,
from their own public contribution record, whether they are eligible for
promotion; when no promotion is granted to a candidate who does not meet
the criteria; and when every maintainer can point to the criteria when
declining a nomination.

## Regression Tests

Regression coverage for this document lives in
`Governance/processes/PROMOTION_CRITERIA.test.ts`. It pins the per-role
criteria counts, the nomination and approval process, and the evidence
requirements to this document so they cannot silently regress — for
example, an edit that removes a criterion, lowers a threshold, or drops
the evidence requirement fails CI.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-28 | Initial version. | TeachLink maintainers |
