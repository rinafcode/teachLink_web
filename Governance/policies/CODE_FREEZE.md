# Code Freeze Policy

## Purpose

This policy defines when the project freezes changes to a branch, what may
still change during a freeze, and how an exception is granted. A freeze trades
a short period of reduced throughput for a release that is stable and
predictable, so it needs clear rules about what stops and what does not.

## Scope

This policy applies to changes to the protected branches (`main` and `develop`)
and to any release branch that is being stabilized. It covers code, tests,
configuration, dependencies, and documentation. It does not replace the hotfix
process for a fault that is already affecting users, which follows the
[Hotfix Process](../processes/HOTFIX.md).

## When Freezes Apply

A freeze applies from the moment a release candidate is cut until the release
is published and announced. Additional freezes may be declared ahead of a large
migration, a security-sensitive change, or a period when maintainers are
unavailable. A freeze is announced on the repository with its start, its end,
the branches it covers, and the maintainer who may grant exceptions.

## What Is Allowed During a Freeze

Only changes that make the upcoming release safer are allowed during a freeze:
fixes for defects that block the release, security fixes, documentation and
release-note corrections for the release, and changes explicitly approved as
exceptions. Feature work, refactors, dependency upgrades that are not
release-critical, and cosmetic changes wait until the freeze is lifted. Every
change merged during a freeze is still reviewed and still needs its required
approvals and checks.

## Exception Process

An exception is requested on the pull request by naming the freeze, explaining
why the change must land now rather than after the freeze, and stating the risk
of taking it and the risk of leaving it. The maintainer named in the freeze
announcement grants or denies the exception, and a granted exception is
recorded on the pull request with the reason and the approver. An exception
never waives a required check.

## Ownership and Review

The maintainers own this policy and review it every six months, or after any
release where the freeze rules proved unclear. Changes are proposed as a pull
request that touches only the `Governance/` folder.

## Success

This policy succeeds when freezes have a clear start and end, when only
release-safety work lands during a freeze, when exceptions are rare and
recorded, and when a freeze ends with a release that matches what was frozen.
