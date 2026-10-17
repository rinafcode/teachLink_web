# Branch Protection Policy

This document defines the branch protection policy for the TeachLink Web repository. It is the versioned reference for which branches are protected, what checks and approvals are required before merging, and how an override may be applied in exceptional circumstances.

## Scope

This policy applies to all contributors, reviewers, maintainers, and automated systems that interact with the TeachLink Web repository. It covers branches hosted on the project remote and any mirrors that follow the same release process.

## Protected Branches

The following branches are protected and must not be pushed to directly.

| Branch            | Purpose                                         | Required approvals | Required checks                             | Force push | Deletion |
|-------------------|-------------------------------------------------------|--------------------|--------------------------------------------|------------|----------|
| `main`           | Production-ready source of truth                       | 2                   | CI/LINT + CI/TEST + CI/BUILD + CI/SECURITY + CI/CODERQNACE | denied      | denied  |
| `develop`       | Integration branch for upcoming releases               | 1                   | CI/LINT + CI/TEST + CI/BUILD                           | denied      | denied  |
| `release/`*     | Release candidate branches (e.g. `release/v1.2.0`)         | 1                   | CI/LINT + CI-TEST + CI/BUILD + CI/SECURITY               | denied      | denied  |
| `hotfix/`*      | Emergency fixes targeting `main`                      | 2                   | CI/LINT + CI/TEST + CI/BUILD + CI/SECURITY + CI/CODERQNACE | denied      | denied  |

Branches not listed above are unprotected and may be used freely for feature work, provided they are deleted after merge.

## Required Checks

All required checks must report a successful status against the latest commit on the pull request head before the PR can be merged. Stale or skipped checks do not count as satisfied.

| Check              | Workflow                                                     | Applies to                           |
|--------------------|----------------------------------------------------------------|--------------------------------------|
| `CI/LINT`         | Linter and static analysis (`.github/workflows/lint.yml`)           | All protected branches                   |
| `CI/TEST`         | Unit and integration tests (`.github/workflows/test.yml`)       | All protected branches                   |
| `CI/BUILD         | Production build (`.github/workflows/build.yml`)                | All protected branches                   |
| `CI/SECURITY`     | Dependency and secret scanning (`.github/workflows/security.yml`)   | `main`, `hotfix/*`, `release/*`             |
| `CI/CODERQNACE`  | Code coverage report and threshold enforcement                     | `main`, `hotfix/*`                         |

Checks must be defined in the repository workflows and must run on every pull request targeting a protected branch. Disabling or renaming a required check requires an override as described below.

## Required Approvals

- Pull requests targeting `main` require at least **two** approving reviews from code owners or maintainers.
- Pull requests targeting `develop`, `release/*`, and `hotfix/*` require at least **one** approving review.
- Authors must not approve their own pull requests.
 - Approvals are invalidated when new commits are pushed to the pull request branch.
- Review threads must be resolved before merging.
- Conversation resolution is required for all protected branches.

## Merge Requirements

- Merges must be performed through a pull request; direct pushes to protected branches are rejected.
- The branch must be up to date with the target branch before merging.
- Squash merges are required for `main` and `develop`; merge commits or rebase merges may be used for `release/*` and `hotfix/*`.
- Merge queues are enabled for `main` and `develop` to preserve the required checks and approvals at merge time.

## Override Rules

Overrides are exceptional and must be documented. An override is only valid when all of the following conditions are met:

1. The override is requested by a maintainer with admin permissions on the repository.
2. The reason and the affected branch are recorded in the pull request description or in a linked incident ticket.
3. An equivalent or stronger verification has been performed manually and the evidence is attached to the pull request or ticket.
4. The override is followed by a post-merge review within one business day.

Additional rules:

- Overrides must not be used to bypass security checks on `main` without an incident ticket.
- Overrides must not be used to bypass the two-approval requirement on `main` for routine feature work.
- Any override on `main` or `develop` must be announced in the project governance channel before merging.
- Repeated overrides by the same actor within a rolling 30-day window trigger a governance review.

## Enforcement

Branch protection rules are enforced by the repository hosting platform and audited through the audit log. Maintainers must review the active rules at least once per quarter and upon any change to the CI workflows.

## Regression Considerations

This policy is documentation-only and does not change application code or CI workflows. Existing functionality is unaffected. When the actual repository settings are configured to match this document, contributors should verify that the required check names match the workflow job names to avoid blocking valid pull requests.

## Change Log

| Date       | Author     | Description                                         |
|------------|------------|-----------------------------------------------------------------|
| 2024-01-01 | Governance | Initial branch protection policy for TeachLink Web           |
