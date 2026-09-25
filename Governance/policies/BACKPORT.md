# Backport Policy

This document outlines the process and criteria for backporting changes to previously released versions of TeachLink Web.

## Branching Strategy

TeachLink Web maintains a `main` branch for active development and creates release branches (e.g., `release-v1.2`) for each major and minor version.

## Eligibility Criteria

Only critical bug fixes and security patches are eligible for backporting. Feature enhancements and non-critical bug fixes will be included in the next scheduled release.

## Approval Process

1.  **Request:** A backport request must be submitted as a GitHub issue, clearly explaining the need for the backport and referencing the original pull request.
2.  **Review:** The issue will be reviewed by the project maintainers.
3.  **Approval:** At least two maintainers must approve the backport request.
4.  **Implementation:** Once approved, a maintainer will create a new pull request targeting the release branch.

## Regression Tests

All backported changes must include comprehensive regression tests to ensure that the fix does not introduce new issues.
