# Code Review Policy

## Purpose

This policy defines how TeachLink Web changes are reviewed before they are
merged. It states what must happen before a change lands, who may review it,
and what a review must cover, so contributors and maintainers share one
predictable standard instead of relying on individual judgement.

## Scope

This policy applies to every change proposed to this repository: pull requests
that add, modify, or remove application code, tests, configuration,
documentation, or governance documents. It applies to human contributors and
to automated contributions alike, and it does not replace the project's scope
statement, security policy, or conduct expectations.

## Review Requirements Before Merge

No change reaches a protected branch (`main`, `develop`) without a completed
review:

- Every pull request requires at least one approving review from a maintainer
  or a reviewer delegated by them before it is merged.
- Reviews are recorded on the pull request. Approval given privately, in chat,
  or in person does not replace a recorded review.
- The branch must be up to date with its base and all review conversations
  resolved before merge; unresolved questions are not merged around.
- Changes may only be merged through a pull request. Direct pushes to a
  protected branch are not an accepted path for reviewed work.
- A change that touches a governed area must also follow the process that area
  defines (for example the RFC, security disclosure, or licensing policy).

## Reviewer Independence

Review is a separate act from authoring, and the reviewer must be independent
of the change:

- The author of a change must not approve their own pull request, and must not
  be its sole reviewer.
- A reviewer who contributed materially to a change is treated as an author for
  that change and does not count as its independent review.
- An independent reviewer must not have been directed by the author on the
  conclusion to reach; a review that merely restates the author's intent is not
  an independent review.
- When no independent reviewer is available, the change waits. If the project
  must proceed without one, the exception is called out on the pull request,
  the reason is recorded, and a retrospective review is scheduled with an
  independent reviewer as soon as one is available.
- A maintainer who is also the author follows the same rule: they may merge
  their own change only after another maintainer or delegate approves it.

## Review Scope

A review covers the whole change, not only the lines that look risky:

- **Correctness.** The change does what the linked issue asks, handles the
  relevant edge cases, and does not regress existing behaviour.
- **Tests.** New behaviour is covered by tests, and existing tests still
  represent the intended contract. Missing or weakened tests block a merge.
- **Security and privacy.** Authentication, authorization, input validation,
  secret handling, and data exposure are considered; anything that weakens
  them is raised even when the change is not labelled a security change.
- **Maintainability.** The change fits the existing structure, avoids
  unnecessary duplication, and leaves the code base easier or no harder to
  change.
- **Documentation and configuration.** User-facing or contributor-facing
  changes are documented, and configuration, dependencies, and migrations are
  reviewed with the same care as code.
- **Accessibility and performance.** Changes that affect the user interface or
  the runtime path respect the project's accessibility and performance
  expectations.

Reviewers state which parts of the change they reviewed and raise concerns as
specific, actionable comments rather than silent requests for changes.

## Required Checks and Regression Testing

Reviews are supported by automated checks, not replaced by them:

- The required checks (`type-check`, `lint`, `build`, and `test`) must pass on
  the review commit before merge; a failing or skipped check blocks the merge.
- New behaviour is expected to bring its own regression test where a test can
  express it. A change that cannot be tested is explained on the pull request
  so the gap is deliberate and recorded.
- A reviewer who cannot see a check run must ask for it before approving
  rather than assuming it passed.

## Addressing Requested Changes

- Every requested change is answered on the pull request: either it is made, or
  the reviewer and author agree on why it is not needed. Silently dismissing a
  concern is not a resolution.
- After the requested changes are made, the change is reviewed again by the
  same or another independent reviewer. Approval applies to the reviewed
  commit; material edits after approval require a fresh review.
- A pull request is ready to merge when it has an independent approval, all
  required checks pass, its conversations are resolved, and it is up to date
  with its base.

## Ownership and Review

- Maintainers own this policy and are accountable for applying it consistently
  to every contributor.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder, and are reviewed like any other governance change.
- This document is versioned with the repository; it describes the process the
  project actually follows rather than an aspiration.

## Success

This policy succeeds when every merged change has a recorded, independent
review; when reviewers know what they are expected to check; when authors can
predict what a merge requires; and when security, tests, and documentation are
considered before a change reaches users rather than after.
