# Component Contribution Policy

## Purpose

This policy defines the requirements for adding, changing, and removing reusable
UI components in TeachLink Web. It keeps component contributions accessible,
testable, and aligned with the product need they serve.

## Scope

This policy applies to every reusable component and shared component primitive,
including changes to its public API, behavior, states, styling, or documented
usage. It applies to contributors and reviewers of component work.

## Story Requirement

Every component contribution must include a concise user story in its pull
request description or linked issue. The story must identify the user, the need,
and the expected outcome:

> As a [type of user], I want [capability], so that [benefit].

The contribution must explain which component behavior and acceptance criteria
fulfill that story. Refactors with no user-facing behavior may state the
maintainer or engineering need instead and must describe the compatibility
outcome.

## Accessibility Requirements

- Components must use semantic HTML and the appropriate native control before
  introducing custom interaction patterns.
- All interactive elements must be keyboard accessible, have a visible focus
  state, and expose an accessible name and role.
- Components must support the relevant states, including loading, empty, error,
  disabled, and invalid states where applicable. State must not be conveyed by
  color alone.
- Text and interactive controls must meet WCAG 2.1 AA contrast requirements.
- Dynamic updates must be announced appropriately to assistive technology, and
  motion must respect `prefers-reduced-motion`.
- Accessibility checks must be included in the contribution's validation and
  documented when a requirement is not applicable.

## Test Requirements

- New component behavior must have focused tests covering its primary use case,
  important props, state transitions, and user interactions.
- Contributions that change shared behavior must add or update regression tests
  for the affected behavior, including the previously failing or at-risk case.
- Tests should exercise the component through user-visible behavior rather than
  implementation details and must include keyboard interaction when applicable.
- A component contribution is not complete until its relevant test suite and
  accessibility checks pass.

## Review Owner

The component maintainers own this policy and review component contributions.
They are responsible for checking the user story, accessibility requirements,
test coverage, public API compatibility, and regression risk before approval.
Changes to shared component primitives or exceptions to this policy require
approval from a component maintainer and a second reviewer familiar with the
affected product area.

## Success

This policy succeeds when reusable components have a clear user need, meet the
project's accessibility expectations, and ship with focused tests that protect
against regressions.
