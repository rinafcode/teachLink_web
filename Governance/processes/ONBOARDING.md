# Contributor Onboarding Process

## Purpose

This process defines how new contributors are onboarded in TeachLink Web: the
steps they follow, the resources they receive, and who owns onboarding. It makes
the path from interest to productive contribution explicit and keeps it
self-contained in the `Governance/` folder.

## Scope

This process applies to people becoming contributors as defined in
`Governance/roles/CONTRIBUTOR.md`. It complements `CONTRIBUTING.md`,
`Governance/policies/FIRST_TIME_CONTRIBUTOR.md`, and
`Governance/policies/GOOD_FIRST_ISSUE.md`. It focuses on the human onboarding
experience (orientation, resources, and clarity of expectations).

## Onboarding Steps

New contributors follow these steps:

1. **Orientation.** Review `CONTRIBUTING.md` and the Code of Conduct
   (`Governance/CODE_OF_CONDUCT.md`) to understand expectations and norms.
2. **Find a suitable issue.** Look for issues labelled as good first issues
   per `Governance/policies/GOOD_FIRST_ISSUE.md` or discuss a proposed change in
   an issue before starting work.
3. **Get assigned.** An issue must be assigned before opening a pull request, as
   described in `CONTRIBUTING.md`.
4. **Set up locally.** Follow project setup instructions in `README.md` and any
   environment notes referenced by the issue.
5. **Implement and test.** Make a small, focused change on a feature branch,
   following project standards and quality gates (`type-check`, `lint`, `build`,
   `test`, `security-audit`).
6. **Submit for review.** Open a pull request that references and closes the
   assigned issue, responding to review feedback until approved and merged.
7. **Follow-up and recognition.** After merge, contributors are acknowledged
   according to project practices and may explore the next steps on the
   contributor ladder.

## Resources a New Contributor Receives

New contributors receive the following resources to be successful:

- **Clear entry points.** Guidance via `Governance/policies/GOOD_FIRST_ISSUE.md`
  and `Governance/policies/FIRST_TIME_CONTRIBUTOR.md`.
- **Project documentation.** Access to `CONTRIBUTING.md`, `README.md`, and
  relevant `Governance/` documents for context.
- **Feedback loops.** Timely review feedback on pull requests and responses to
  questions in issue discussions, consistent with
  `Governance/policies/REVIEW_SLA.md` and `Governance/processes/TRIAGE.md`.
- **Mentorship guidance.** Direction to maintainers or experienced contributors
  when questions arise, without assuming private hand-holding.

## Who Owns Onboarding

- **Maintainers.** Own the onboarding process and ensure it remains accurate
  and accessible.
- **Triage/experienced contributors.** Help label and recommend good first
  issues, provide clarifying feedback, and support newcomers in public forums.
- **New contributors.** Own their learning by reading the provided resources,
  asking questions in public, and following the agreed steps.

## Ownership

Maintainers own this process and updates to it. Changes to this document are
proposed in a pull request that touches only the `Governance/` folder.

## Success

This process succeeds when new contributors can move from interest to their
first merged pull request with minimal friction, when expectations are clear,
and when onboarding is consistent across contributors.

## Regression Tests

Regression coverage for this process lives in
`Governance/processes/ONBOARDING.test.ts`. It verifies the document structure,
required sections, line length, absence of placeholders, references to key
policies and resources, and the explicit ownership model.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-28 | Initial version. | TeachLink maintainers |
