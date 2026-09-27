# Approval Requirements Policy

## Purpose

This policy defines the minimum approvals a change must collect, by change
type, before it may merge into a protected branch (`main` or `develop`). The
Code Review Policy states that a change needs an independent review; this
document states how many approvals each kind of change requires, which checks
must pass alongside them, and when an override is permitted. It exists so a
contributor can predict what a merge costs before opening a pull request and
maintainers apply one consistent floor instead of negotiating per pull request.

## Scope

This policy applies to every change proposed to this repository: application
code, tests, configuration, dependencies, documentation, and the governance
documents themselves. It applies to human and automated contributions alike,
and to maintainers as much as to outside contributors. It does not replace the
project's scope statement, security policy, or code of conduct, and it does not
restate the reviewer-independence or review-scope rules of the Code Review
Policy. Where this policy and another governance document disagree about how
many approvals a change needs, the stricter requirement applies.

## Change Types and Minimum Approvals

The counts below are floors. A maintainer may always require more approvals, a
broader review, or a security review, and no change is exempt because it looks
small. An approval counts only when it is recorded on the pull request by a
reviewer who is independent of the change, as defined by the Code Review Policy.

- **Governance documentation.** A change that touches only `Governance/`
  requires **one maintainer approval**. The approval must confirm the document
  stays self-contained in the folder and consistent with the governance
  documents it references.
- **Documentation and non-code assets.** A change that touches only
  contributor-facing documentation, comments, or non-executable assets outside
  `Governance/` requires **one maintainer approval**.
- **Routine application change.** A change to application code, tests, or
  configuration that is backwards compatible requires **one maintainer
  approval and one additional independent approval** (either a second
  maintainer or a reviewer delegated by a maintainer).
- **Breaking change.** A change that alters a public API, an exported type or
  module boundary, a persisted format, or a documented workflow in a way that
  is not backwards compatible requires **two maintainer approvals** and must
  follow the breaking-change policy, including its migration notes.
- **Security-sensitive change.** A change that affects authentication,
  authorization, secret handling, payment or on-chain paths, input validation,
  or the dependency supply chain requires **two approvals, at least one of them
  from a maintainer accountable for security**.
- **Release and hotfix change.** A change that cuts or repairs a release
  requires **one maintainer approval** and must follow the release or hotfix
  process it invokes; an emergency hotfix follows the override rules below.
- **Dependency and build configuration change.** A change that adds, removes,
  upgrades, or reconfigures a dependency or build tool requires **two
  approvals** so that both the functional and supply-chain impact are reviewed.

A pull request that spans several change types collects the **highest** minimum
among its parts. Splitting such a pull request into smaller, single-type changes
is encouraged, but a split must not be used to route a governed change past the
approvals it would otherwise need.

## Required Checks

Approvals do not replace automated checks. The required checks (`type-check`,
`lint`, `build`, and `test`) must pass on the commit that is approved and again
on the head commit before merge; a failing, skipped, or missing check blocks
the merge at every approval level. The additional expectations are:

- A change that adds or alters behaviour brings a regression test where a test
  can express it; where it cannot, the gap is explained on the pull request.
- A change to a governance document that carries a companion test must keep
  that test passing, so the document's guarantees cannot silently regress.
- A change that cannot run a required check in CI states which check was not
  run, why, and what was done instead, and the reviewers decide whether to
  approve with that gap recorded.

## Override Rules

Overrides exist for emergencies and genuine unavailability, not for
convenience. Every override is recorded on the pull request with the reason,
the missing approval, and the follow-up it requires.

- **Emergency hotfix.** When a release-blocking or user-impacting fault must
  be fixed immediately, a hotfix may merge with **one maintainer approval**.
  The pull request must record that the normal floor was waived, and a
  retrospective independent review must be scheduled and completed after the
  fix ships.
- **Reviewer unavailability.** When the required number of independent
  reviewers cannot be reached within the project's review window, a maintainer
  may authorise a **single-approval merge** with the shortfall and its reason
  recorded on the pull request, followed by a retrospective review as soon as
  an independent reviewer is available.
- **Delegation.** A maintainer may delegate approval authority for a specific
  change to a named reviewer; the delegation and the delegate are recorded on
  the pull request, and the delegate must still be independent of the change.
- **Non-overridable rules.** No override may allow an author to approve their
  own pull request, waive the reviewer-independence rules, or merge a change
  with a failing required check. A security-sensitive change may not drop below
  two approvals, and an unapproved change may not be pushed directly to a
  protected branch.

## Ownership and Review

- Maintainers own this policy and are accountable for applying its floors
  consistently and for recording every override.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder, are subject to this policy's own floor, and are
  reviewed like any other governance change.
- This document is versioned with the repository and describes the approval
  requirements the project actually applies rather than an aspiration.

## Success

This policy succeeds when every merged change carries the approvals its type
requires, when contributors can predict a merge's cost before they open a pull
request, when overrides are rare, recorded, and followed by their retrospective
review, and when checks and approvals are treated as complementary gates rather
than substitutes for one another.
