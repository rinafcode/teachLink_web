# CODEOWNERS Policy

## Purpose

This policy defines how the repository's `CODEOWNERS` file assigns ownership of
paths, what that ownership means for review, and how ownership is kept current.
A CODEOWNERS entry is not decoration: it decides who is asked to review a
change, so an out-of-date entry routes reviews to the wrong people.

## Scope

This policy applies to the `CODEOWNERS` file and to every path it covers in
this repository. It works alongside the [Code Review Policy](REVIEW_POLICY.md)
and the [Approval Requirements Policy](APPROVAL_REQUIREMENTS.md), which set how
many approvals a change needs; CODEOWNERS decides who is eligible to give them.

## Ownership Assignment

Every top-level area of the repository has at least one owner listed in
`CODEOWNERS`, and the newest, most specific pattern wins when several entries
match a file. Owners are teams or individual maintainers with standing to
review the area they own, not the author of the most recent change to it. A
path with no owner is treated as a gap: it is assigned to a maintainer and
recorded until a durable owner is named.

## Required-Review Implications

When branch protection requires code-owner review, a pull request that touches
an owned path needs an approval from one of that path's owners before it can
merge. The owner's approval counts as the independent review required by the
review policy only when the owner did not author the change. CODEOWNERS cannot
bypass required checks, and it does not lower the approval floor set by the
approval requirements policy.

## Update Process

Ownership changes are made by a pull request that edits `CODEOWNERS` and
explains the change. The pull request needs an approval from a maintainer and
from the current owner of the path, when that owner still exists. Ownership is
reviewed when a team is reorganised, when a maintainer steps down, and at least
every six months, so that every entry still names someone who can review.

## Ownership and Review

The maintainers own this policy and the `CODEOWNERS` file. This document's
review follows the repository review. Changes to this policy are proposed as a
pull request that touches only the `Governance/` folder, and changes to
`CODEOWNERS` itself follow the update process above.

## Success

This policy succeeds when every owned path routes to a live owner, when
required code-owner reviews are satisfied before merge, and when `CODEOWNERS`
reflects the project's current maintainers rather than its history.
