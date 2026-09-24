# Contributor Role

## Purpose

This document defines who is a contributor to TeachLink Web, what rights and
expectations come with the role, and how someone becomes a contributor. It makes
the contribution ladder explicit: contributors are the foundation of the project,
and this document is the entry point above plain community participation.

## Who Is a Contributor

A contributor is a person who makes documented, reusable improvements to the
project and has had at least one pull request merged into the repository. Until a
pull request merges, participation counts as involvement with the community —
raising issues, commenting, and reviewing — but the contributor role is earned by
accepted, merged work.

Contribution is not limited to code:

- Proposing and discussing issues that lead to changes.
- Reviewing pull requests with substantive, documented feedback.
- Writing, structuring, and maintaining documentation and governance.
- Improving accessibility, design, performance, or security of the web client.
- Anything else that durably increases the project's quality and is accepted
  through the normal change process.

## Rights

Contributors have the right to:

- Be assigned to open issues and receive responses to their work.
- Open pull requests and receive review of them.
- Propose changes to application code and to governance documents in the
  `Governance/` folder.
- Be credited for their contribution through normal attribution practices.
- Disagree in discussion without it affecting their standing, as long as the
  disagreement stays respectful and documented.

## Expectations

Contributors are expected to follow the contribution guidelines in
`CONTRIBUTING.md`, which describe the workflows that apply to everyone:

- Work is done on a feature or fix branch, never pushed directly to the
  protected branches.
- An issue must be assigned before a pull request is opened, and the pull
  request must reference its issue with a closing keyword.
- Pull requests must keep changes small and focused, follow project standards
  (including using `lucide-react` icons, accessible and responsive markup, and
  no console errors), and pass the required quality gates (`type-check`,
  `lint`, `build`, `test`, `security-audit`).
- Communication is honest and measured, consistent with the project's values of
  learning, inclusion, integrity, craft, and stewardship.

## How to Become a Contributor

Becoming a contributor follows the steps in `CONTRIBUTING.md`:

1. **Find or propose work.** Pick an open issue or propose a change with a clear
   problem statement.
2. **Get assigned.** An issue must be assigned before a pull request is opened.
3. **Implement on a branch.** Create a feature or fix branch from `main` or
   `develop` and make a small, focused change.
4. **Open a pull request** that references and closes the assigned issue, passes
   the quality gates, and requests review.
5. **Respond to review** until the change is approved and merged.

Once the first pull request merges, the author is a contributor and is eligible
to take on larger, more independent work and to be considered for wider
participation (for example the issue triager role) through the project's
promotion process.

## Ownership

- This document is owned by the maintainers, who decide how the contributor
  role is described and when someone has earned it.
- Changes to this document are proposed in a pull request that touches only the
  `Governance/` folder and must be approved before adoption.

## Success

This role definition succeeds when new people can confidently take the path from
community member to contributor without asking what is expected of them, when
contributors know their rights and responsibilities, and when the project's
accepted contributions are recognized in a consistent way.