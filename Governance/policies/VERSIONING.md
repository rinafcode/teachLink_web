# Versioning Policy

## Purpose

This policy defines how TeachLink Web versions its releases. It fixes the
version format the project publishes, states what constitutes a major, minor
and patch bump, and defines the pre-release identifiers the project uses, so
that a consumer can tell from the version number alone whether taking an
update is safe.

TeachLink Web has not published a tagged release yet: the repository carries
no Git tags, and the `version` field in the root `package.json` reads `0.1.0`
as a development version. This policy therefore defines the convention the
project follows from the first tagged release onward, rather than describing a
release history that does not exist.

## Scope

This policy applies to the web client in this repository: the `version` field
in the root `package.json`, the Git tag that names a release, and the release
notes published with it. It applies to every surface another party can depend
on: user-facing capabilities and pages, URL routes, components and their
public props, exported modules and utilities, API query and response shapes
the frontend consumes, configuration and environment variables, and build and
CI entry points.

It does not cover contract versioning of the backend API, defined in
`docs/API_VERSIONING_POLICY.md` as URL path segments (`/api/v1/*`); design
system and design token versioning, defined in
`Governance/domains/DESIGN_SYSTEM_GOVERNANCE.md`; the versions of private
workspace packages under `packages/*`, which move with the repository and are
never published on their own; or the `teachLink_backend` repository.

## Version Format

- Versions are written `MAJOR.MINOR.PATCH` with plain non-negative integers
  and no `v` prefix in `package.json` and in the release notes. Git tags use
  the same number with the prefix, for example `v0.2.0`, are annotated, and
  point at the release commit on the protected `main` branch.
- The `version` field in the root `package.json` is the single source of truth
  for the current development version. It is bumped in the same pull request
  that prepares the release, never in a separate commit.
- The root package is `private: true` and is not published to a registry. A
  release is identified by its Git tag, its release notes, and the image
  built from the tagged commit (`Dockerfile`), not by an npm version.

## What Constitutes Each Bump

### Major

A change is a major bump when it breaks an interface that someone outside the
change depends on:

- Removing or renaming a user-facing capability, a URL route, a component, an
  exported module or utility, a configuration key, or an environment
  variable.
- Changing a public prop signature, an exported function's behaviour, or the
  shape of an API query or response the frontend consumes, in a way that
  requires a consumer to change something to keep working.
- Changing a build or CI entry point (`build`, `type-check`, `lint`, `test`,
  `validate:ui`, `validate:web3`) so that existing workflows break.
- Removing an interface that was already deprecated, or reverting a previously
  released breaking change, provided the deprecation met
  `Governance/policies/DEPRECATION.md` first.

A backwards incompatible change with no reasonable migration path is not
released as a patch or a minor. It is rejected or redesigned through
`Governance/processes/RFC_PROCESS.md`.

### Minor

A change is a minor bump when a consumer gains capability without changing
anything of their own:

- A new user-facing capability, page, or route that does not alter an existing
  one.
- A new component, prop, configuration option, or environment variable, added
  alongside the existing surface rather than in place of it.
- A new additive subsystem or integration, or a dependency upgrade that
  changes what users experience but no existing interface.
- A new optional behaviour behind a default-off flag.

A minor bump must leave every interface from the previous version behaving as
documented. If it does not, it is a major bump.

### Patch

A change is a patch bump when it corrects behaviour and changes no interface:

- Bug fixes that leave every existing interface behaving as documented.
- Reliability, performance and accessibility fixes that add no new behaviour,
  and security fixes that change no interface.
- Dependency patches within an existing range.
- Documentation, governance and comment corrections.

Patch releases never add behaviour, never rename a configuration key or
environment variable, and never change a build command. A patch release that
does any of those is reclassified before it is tagged.

## While the Version Is 0.x

While `MAJOR` is `0`, the project treats `MINOR` as the compatibility axis,
as semver.org specifies for versions below `1.0.0`. A change that would be a
major break at `1.0.0` is released as `0.MINOR.0`, and the `PATCH` position
carries backwards compatible fixes only. A consumer therefore reads a minor
bump in the `0.x` series as the breaking-change boundary.

The project moves to `1.0.0` when the surfaces in Scope are documented well
enough for a consumer to rely on, the deprecation process in
`Governance/policies/DEPRECATION.md` has been used once end to end, and the
required checks (`type-check`, `lint`, `build`, `test`, plus the
`security-audit` policy in `CONTRIBUTING.md`) have passed cleanly on three
consecutive release trains.

## Pre-release Conventions

- Pre-release versions use the identifiers `-alpha.N`, `-beta.N` and
  `-rc.N`, where `N` starts at `1` and increments with each published build,
  for example `0.3.0-rc.2`. Identifiers are lowercase and the count is a
  positive integer.
- Precedence is `alpha` before `beta` before `rc` before the final release,
  so `0.3.0-rc.2` precedes `0.3.0`.
- Build metadata may be appended with a `+` and is ignored for precedence.
  When used, it carries the build date and the short commit SHA, for example
  `0.3.0-rc.2+20260925.a1b2c3d`.
- A pre-release is cut from the same branch as the final release, passes the
  same required checks, and is never deployed to production. It exists to
  validate a risky change, a migration, or a fix with maintainers and willing
  users.
- The final version equals the pre-release train that shipped: `0.3.0-rc.2` is
  promoted to `0.3.0`, and a promoted version is never re-tagged afterwards.
- Every pre-release ships notes listing what is in it, what is known to be
  broken, and how to roll back. A pre-release without those three sections is
  not published, and a pre-release never starts the notice clock in
  `Governance/policies/DEPRECATION.md`; only a stable release does.

## Version Changes and Approvals

- The release captain, defined in `Governance/processes/RELEASE_CADENCE.md`,
  prepares the pull request that bumps `version`, writes the release notes,
  and creates the tag.
- A version bump is part of a release, so it requires the sign-offs and
  gating checks in `Governance/processes/RELEASE_SIGNOFF.md`, with the Lead
  Maintainer holding final authority. Branch protection still applies: the
  release pull request merges with at least one maintainer approval and all
  required checks passing, as configured in `.github/branch-protection.md`.
- Releases cut outside the scheduled train, including hotfixes under
  `Governance/processes/HOTFIX.md`, follow the same bump rules and approvals
  on a shortened schedule.
- Contributors may propose a different classification in the release pull
  request by pointing at the interface that would break. The reasoning is
  recorded on the pull request either way.

## Exceptions and Corrections

- A published version is never re-tagged, moved, or deleted. A wrong or
  missing bump is corrected by publishing a new version that states the
  correction, and the mistake is recorded in that version's release notes.
- A security fix that must ship immediately may be released as a patch before
  the deprecation notice period has elapsed, as
  `Governance/policies/DEPRECATION.md` allows for security and legal reasons.
  The shortening is stated in the release notes.
- Where this policy and a subsystem's own versioning scheme conflict, the
  subsystem document governs its own surfaces and this policy governs the
  release as a whole.

## Ownership

- Maintainers own this policy and classify every bump. The Lead Maintainer
  resolves disagreements about classification at release time.
- Changes to this policy are proposed in a pull request that touches only
  the `Governance/` folder and require a second maintainer review, because
  they change what every future release is measured against.

## Success

This policy succeeds when a consumer can decide whether to upgrade from the
version number alone, when the bump level of a release matches the interfaces
it changed, when pre-releases are rare and clearly labelled, and when no
correction has ever required moving a published tag.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | akargi (@akargi) |
