# End-to-End Test Governance

- **Policy ID:** E2E-001
- **Version:** 1.0
- **Status:** Active
- **Owner:** QA and Developer Experience maintainers
- **Review cadence:** At least once per quarter and whenever a critical user flow changes

## Purpose

This policy defines the minimum end-to-end (E2E) coverage, reliability expectations, ownership, and regression requirements for TeachLink. It is the versioned reference for maintaining the Playwright suite in `e2e/`.

## Scope

This policy applies to browser-visible journeys that cross a page boundary, authentication boundary, API boundary, or important user state. Unit and integration tests remain appropriate for isolated business logic and component behavior; they do not replace the critical-flow coverage below.

## Required Critical Flows

The following flows must have at least one deterministic Playwright test. Tests should verify the user-visible outcome and the relevant URL, state, or server response rather than implementation details.

1. **Authentication and account access**
   - Login success redirects to the dashboard.
   - Login validation and failed authentication show an actionable error.
   - Signup success creates an account and redirects to the dashboard.
   - Signup rejects invalid or already-registered account data.
   - Logout or expired authentication cannot expose protected content.
   - Supported third-party authentication, currently Discord, remains covered when enabled.
2. **Course discovery and enrollment**
   - Course listing loads and exposes usable course data.
   - Course detail pages render pricing, features, and enrollment controls.
   - Enrollment or purchase sends the intended request and gives the user a clear result.
   - Public course previews and authenticated restrictions behave as intended.
3. **Learner and instructor workflows**
   - An authenticated learner can reach the dashboard and access enrolled learning content.
   - An instructor can access the intended teaching workflow, subject to the available role fixtures.
   - Unauthorized users are redirected or denied without leaking protected data.
4. **Resilience and accessibility-critical behavior**
   - Required loading, empty, error, and retry states do not leave the page unusable.
   - Keyboard-accessible primary actions and meaningful form labels remain available on critical flows.
   - Responsive behavior is checked on the supported mobile project for flows that are used on mobile.

When a flow is not implemented or is feature-flagged off, its test may be marked as pending with a linked issue. The pending test must be enabled in the same change that enables the feature.

## Test Design Standards

- Prefer user-facing locators such as roles, labels, and visible text.
- Keep tests isolated: create or mock only the data they need, and do not depend on test order.
- Use stable fixtures and dedicated test accounts; never use personal or production credentials.
- Assert the outcome that matters to the user, including navigation, visible feedback, and important API status where appropriate.
- Keep network mocks narrow and realistic. A mock must preserve the contract that the browser relies on.
- Do not use arbitrary sleeps. Wait for a locator, URL, response, or other explicit condition.
- A new user journey must include its E2E test in the same pull request, or document why coverage is not applicable.

## Execution and Quality Gates

The canonical commands are:

```text
pnpm test:e2e
pnpm exec playwright test --project=chromium
```

The full suite runs against the configured Chromium, Firefox, and mobile Chrome projects. Pull requests must pass the full suite before merge. A focused project or spec run is acceptable during development, but it does not replace the full pull-request check.

CI must collect Playwright traces on first retry and screenshots on failure. Failure artifacts should be retained with the CI run long enough to support diagnosis.

## Flake Policy

- A test is considered flaky when it fails intermittently without a confirmed product defect, including two failures in five repeated runs or one failure that passes on retry.
- Retries are diagnostic only. A retry-passing test is still reported as unstable and does not count as clean evidence of reliability.
- The author or owning team must triage a flaky test within two business days and either fix the cause or quarantine it with a tracking issue, owner, reason, and expiry date.
- Quarantine may last at most ten business days. It must not silently remove coverage; the test stays runnable locally and remains visible in reporting.
- Do not increase retries, add sleeps, weaken assertions, or disable a browser project to hide flakiness.
- A quarantined test may return to the required gate only after five consecutive clean CI runs, including all applicable browser projects.

## Ownership and Review

The QA and Developer Experience maintainers own this policy, the Playwright configuration, and suite-level reliability. Feature maintainers own the E2E tests for their user journeys and must review failures affecting those journeys. Pull requests that change a critical flow must request review from the relevant feature maintainer and the policy owner.

When ownership is unclear, the author is responsible for triage until an owner is assigned. Changes to this document require review from the QA and Developer Experience maintainers and must update the policy version when requirements change.

## Regression Requirements

Every confirmed browser-visible defect must add or update a focused E2E regression test when the defect crosses a supported user journey. The test should reproduce the defect before the fix and protect the expected outcome afterward. If an E2E test is not the right layer, the pull request must record the reason and place the regression test at the appropriate unit or integration layer.

## Change Record

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-09-24 | Initial E2E governance policy |
