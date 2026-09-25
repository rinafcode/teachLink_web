# Maintainer Role

## Purpose

This document defines the maintainer role for TeachLink Web: the
responsibilities, the decision authority, and the accountability expectations
that come with it. It gives maintainers a shared contract for their day-to-day
work and gives contributors a clear account of how decisions are made.

## Responsibilities

Maintainers are responsible for the day-to-day health of the repository:

- **Review and merge.** Reviewing pull requests with substantive, documented
  feedback and merging approved changes. Merges follow the repository's branch
  protection rules: no direct pushes to the protected branches (`main`,
  `develop`), pull-request-only merges, at least one approval, required status
  checks, up-to-date branches, and resolved review conversations.
- **Quality gates.** Ensuring changes pass the required checks (`type-check`,
  `lint`, `build`, `test`) and that dependency vulnerabilities at high or
  critical severity do not reach the protected branches, per the
  `security-audit` policy in `CONTRIBUTING.md`.
- **Governance.** Proposing and reviewing governance changes in the
  `Governance/` folder, and keeping governance documents current with how the
  project actually runs.
- **Issue health.** Triaging, labeling, and prioritizing issues so contributors
  can predict what will be worked on.
- **Community stewardship.** Responding to questions and feedback, enforcing the
  project's conduct expectations, and keeping discussions productive and
  respectful.
- **Security response.** Handling disclosures and coordinated fixes for this
  repository, escalating severe issues promptly, and documenting the response.

## Decision Authority

Maintainers hold the project's decision authority for the web client:

- Day-to-day technical decisions about the codebase, libraries, and architecture
  within the project's scope statement.
- Decisions on whether a pull request is accepted or rejected.
- Decisions on governance changes proposed through the `Governance/` folder,
  following the decision-making processes defined there.
- When a decision affects security, privacy, or the availability of the
  service, maintainers may act quickly and document the decision afterward, as
  the project charter states.

Maintainer authority is always bounded by the project's scope, values, and
governance. Maintainers do not override community feedback without documenting
their reasoning.

## Accountability Expectations

With authority comes accountability:

- **Transparency.** Decisions that materially affect users or contributors are
  recorded on the issue or pull request, with the reasoning that drove them.
- **Predictability.** Maintainers meet response expectations for reviews and
  triage, and they do not let approved work sit unreviewed indefinitely.
- **Consistency.** Approvals and rejections apply the same standards to every
  contributor.
- **Learning.** Maintainers review their own decisions when outcomes differ from
  expectations and adjust process or guarding where that would prevent
  recurrence.
- **Limits.** Maintainers seek wider review for changes to governance, for
  changes that affect privacy or safety, and for decisions where the trade-off
  deserves additional eyes.

## Selection and Transition

New maintainers are proposed through the project's role promotion process and
appointed by the existing maintainers. Maintainers who become inactive for a
sustained period are subject to the project's inactivity policy, and a maintainer
may step down at any time by informing the rest of the group.

## Ownership

- Maintainers jointly own this document. Substantive changes to the role are
  agreed among maintainers and proposed in a pull request that touches only the
  `Governance/` folder.
- Each maintainer's authority is exercised with the duty to keep this document
  honest about what being a maintainer involves.

## Success

This role definition succeeds when maintainers have clear, bounded authority;
when contributors can predict how decisions are made; and when the decision
record lets the project hold itself accountable for the choices it makes.