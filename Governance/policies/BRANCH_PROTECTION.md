# Branch Protection Policy

This document defines the branch protection policy for the TeachLink repository. It specifies which branches are protected, the required checks and approvals before merging, and the rules under which those requirements may be overridden.

This policy is part of the `Governance/` folder and is maintained under the same rules as the rest of the governance documents: changes are made only inside `Governance/` and are versioned in git.

## Scope

This policy applies to all branches in the `TeachLink/TeachLink-Web` repository. It defines the protection rules for long-lived branches and the expectations for merging into them.

## Protected Branches

The following branches are protected. Direct pushes to these branches are disallowed except through the override process described below.

| Branch | Purpose | Protection level |
| -------- | ------- | ----------------- |
| `main` | Production-ready code. All releases are cut from this branch. | Strict |
| `develop` | Integration branch for work targeted at the next release. | Strict |
| `release/*` | Release stabilisation branches created from `main` or `develop`. | Restricted |

All feature and fix work must be done on a short-lived branch and integrated via pull request. Branch naming conventions follow the contribution governance guidance (e.g. `feat/`, `fix/`, `docs/`, `chore/`).

## Required Checks and Approvals

Before a pull request can be merged into a protected branch, all of the following conditions must be met.

### Required status checks

The following checks must pass and are required to be up to date with the latest commit on the pull request head:

- `build` -- project builds successfully.
- `lint` -- linting and formatting checks pass.
- `test` -- the test suite passes.
- `typecheck` -- type checking passes (where applicable).
- `code-scan` -- static analysis and security scanning report no new blocking issues.

Additional checks may be added by maintainers as the project evolves; additions are documented here and in the repository settings in the same change.

### Required approvals

| Branch | Required approvals | Dismiss stale approvals | Require Code Owners review |
| -------- | ------------------- | ------------------------ | ------------------------- |
| `main` | 1 approval from a maintainer | Yes | Yes |
| `develop` | 1 approval from a reviewer or maintainer | Yes | Yes |
| `release/*` | 1 approval from a maintainer | Yes | Yes |

Further rules:

- Approvals come from individuals other than the author of the last push.
- Approvals are dismissed when new commits are pushed to the pull request.
- Conversations on the pull request must be resolved before merging.
- Force pushes and branch deletions are disallowed on protected branches.
- Merge commits are allowed but squash merges are preferred for feature branches to keep history readable.

## Override Rules

Overrides are exceptional and must be justified, recorded, and reviewed. They exist to unblock urgent fixes or incident response without weakening the default protections.

### Authorised overriders

- Only maintainers with administrative access may override branch protection.
- Overrides must be limited to the minimum set of rules needed to unlblock the change.
- Overrides must not be used to bypass required security scans or to merge changes that touch `Governance/` without a recorded review.

### Required process

1. Open an issue or comment on the pull request describing the reason for the override and the rules being bypassed.
2. Obtain approval from at least one other maintainer when time permits; for incident response, approval may be given retroactively within one business day.
3. Record the override in the pull request description or in a linked issue, including the justification and the follow-up action taken to restore compliance.
4. Follow up with a post-merge review to confirm the change is sound and that any skipped checks pass on the resulting branch.

### Emergency fixes

In a security incident or other urgent situation, a maintainer may merge a minimal fix directly to `main` via the override process. The fix must be followed by a post-incident review and, where applicable, a retrospective documented in the Governance folder.

## Enforcement

- Branch protection settings in the repository must match this document.
- Changes to the settings or to this document must be made through a pull request that touches only the `Governance/` folder (at most two files).
- Repeated or unjustified overrides are a governance violation and are reviewed by the maintainers.

## Change Log

| Date | Change | Author |
| ------ | ------ | ------ |
| 2025-01-01 | Initial branch protection policy added. | Governance maintainers |
