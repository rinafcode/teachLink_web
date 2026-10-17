# Release Branching Policy

## Purpose

This policy defines the branching model the project uses for releases, how a
release branch is cut and stabilized, and how fixes flow back from a release to
active development. A clear model keeps `main` moving while a release is
stabilized, and makes it obvious where a fix belongs.

## Scope

This policy applies to the branches used to prepare and ship releases. It does
not define version numbers, which follow the
[Versioning Policy](VERSIONING.md), the timing of releases, which follows the
[Release Cadence](../processes/RELEASE_CADENCE.md), or the criteria for
backporting a fix, which follow the [Backport Policy](BACKPORT.md).

## Branching Model

`main` is the integration branch and always holds the next release. Each
release is prepared on a release branch named with the `release-v` prefix and
the major and minor version, such as `release-v1.4`, cut from `main` when the
release is scoped. Feature branches are short-lived and target `main`; a
release branch receives only the changes that stabilize the release it carries,
and never routine feature work.

## Cut and Stabilization

Cutting a release branch marks the start of stabilization, during which only
release-blocking fixes, security fixes, and release documentation changes land
on it. Each stabilization change is merged to the release branch and, unless it
is release-specific, is also merged or cherry-picked to `main` so the fix is
not lost in the next release. A release is tagged only after its required
checks pass on the release branch.

## Backport Flow

A fix for an already-released version starts on `main` and is then backported
to the affected release branch following the backport policy. A backport is
proposed as its own pull request against the release branch, references the
original change, and passes the same checks as any other change. When a release
line is no longer supported, its branch is frozen and no further backports are
accepted.

## Ownership and Review

The maintainers own this policy and review it every six months, or after any
release where the branching model caused confusion. Changes are proposed as a
pull request that touches only the `Governance/` folder.

## Success

This policy succeeds when `main` keeps moving during stabilization, when every
release branch carries only stabilization changes, and when fixes reach both
the release and active development without being lost.
