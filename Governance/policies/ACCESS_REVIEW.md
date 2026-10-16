# Access Review Policy

## Purpose

This policy requires periodic review of who has access to what in the TeachLink
Web project, so that permissions match current roles and stale or excessive
access is removed. Regular review is the main defence against access that
outlives the need for it.

## Scope

This policy applies to every resource where access is granted to people or
automation: the GitHub organization and repository permissions and teams,
protected-branch and environment settings, CI/CD secrets and deploy keys,
package registry and hosting accounts, analytics and monitoring tools, and
shared mailboxes. Roles themselves are described in the [Maintainer
role](../roles/MAINTAINER.md) and the [Moderator role](../roles/MODERATOR.md).

## Review Cadence

Access is reviewed on a fixed schedule and on specific events:

- **Quarterly:** all administrative and write access, secrets, deploy keys, and
  bot or automation accounts.
- **Every 6 months:** read access to private resources and tool accounts with
  limited privileges.
- **On event:** a role change, a contributor leaving or becoming inactive, a
  suspected compromise, or a vendor change triggers an immediate review of the
  affected access.
- Each review is recorded with the date, reviewer, scope, and outcome in the
  project's private maintainer records.

## Scope per Resource

Reviewers check each resource against least privilege:

- **Repository and organization.** Every member's role matches their current
  governance role; teams, outside collaborators, and installed apps and tokens
  are still needed.
- **Protected branches and environments.** Who can push, merge, approve, and
  deploy matches the [Review Policy](../policies/REVIEW_POLICY.md) and release
  rules.
- **Secrets and keys.** Each secret has an owner and a purpose, was rotated
  within its period, and is not shared across environments without need.
- **Third-party tools.** Each tool account lists its administrators, and former
  contributors are removed.
- **Automation.** Tokens and apps have the narrowest scopes that work and an
  owner who can answer for them.
- Reviewers do not review their own access; another maintainer signs off.

## Revocation Process

Access that is not justified is removed:

- The reviewer lists the access to remove and the reason; the owner confirms or
  contests within 5 business days.
- Removal is carried out promptly, and anything that was shared (secrets, keys,
  tokens) is rotated rather than only deleted.
- Emergency revocation for a suspected compromise happens first and is explained
  afterwards; it is then handled under the [Security
  Policy](../SECURITY_POLICY.md).
- Role reductions follow the project's inactivity and emeritus practices, and
  the person is thanked and told how to regain access.
- Each revocation is logged, and the next review checks that the access really
  is gone.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- A maintainer is assigned to run each quarterly review and report the outcome
  to the other maintainers.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when reviews happen on schedule, when no one holds access
their role does not need, and when departures and compromises lead to prompt
revocation and rotation.
