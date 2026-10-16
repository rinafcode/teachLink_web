# Compatibility and Support Window Policy

## Purpose

This policy states which runtimes, tools, and platforms TeachLink Web supports,
how long each supported version stays supported, and when support is dropped.
Contributors need to know what they may rely on when writing code; users and
integrators need to know how much notice they get before a platform they depend
on stops working.

## Scope

This policy applies to the Node.js and package-manager versions used to build
and run the project, the browsers and operating systems the web application
targets, and the major versions of the framework and key runtime dependencies.
It does not set the project's release schedule (see the [release
cadence](../processes/RELEASE_CADENCE.md)) or its API stability rules (see the
[Versioning policy](../policies/VERSIONING.md) and [Deprecation
policy](../policies/DEPRECATION.md)).

## Supported Versions and Platforms

The authoritative record of what is supported is kept in the repository, not in
this document, so it cannot drift from what CI actually exercises:

- **Toolchain.** The Node.js and pnpm versions listed under Prerequisites in the
  repository `README.md` and pinned by `packageManager` in `package.json`. CI
  runs on those versions.
- **Browsers.** The current and previous major release of the evergreen desktop
  and mobile browsers (Chrome, Edge, Firefox, Safari). Older browsers are
  best-effort and are not a reason to block a change.
- **Frameworks and runtimes.** The current major version of the application
  framework, React, and TypeScript used by the repository, plus the previous
  major while a migration is in progress.
- A change that raises or lowers a minimum version updates the authoritative
  record in the same pull request.

## Support Window Length

Support windows are measured from the date a version becomes the project's
supported baseline:

- **Runtimes (Node.js).** Supported while the version is in upstream Active LTS
  or Maintenance LTS. The project never requires a version that upstream has
  already ended.
- **Browsers.** Supported for the current and previous major release; a browser
  version leaves the window when it is two majors behind.
- **Frameworks and libraries.** The current major is fully supported. The
  previous major is supported for a documented migration period of at least one
  release cycle after the new major is adopted.
- **Contributor tooling (pnpm, linters, test runners).** Only the pinned version
  is supported; contributors are expected to use it.

## Drop Criteria

A version, browser, or platform may be dropped when at least one of the
following holds:

- Its upstream vendor no longer provides security fixes for it.
- It falls outside the support window defined above.
- Supporting it blocks a security fix, a required dependency upgrade, or a
  feature the roadmap commits to, and no reasonable workaround exists.
- Its share of real users, as reported by the project's consented analytics (see
  the [Analytics Data Collection](../domains/ANALYTICS_DATA.md)), is too small
  to justify the maintenance cost.
- Dropping support is announced at least one release cycle in advance in the
  release notes and the pull request, uses the [Deprecation
  policy](../policies/DEPRECATION.md) for any user-visible behaviour, and is
  recorded through the [RFC process](../processes/RFC_PROCESS.md) when it
  affects many contributors or users.

## Exceptions

A maintainer may extend support for a version past its window when a documented
downstream user depends on it and the cost is small, or shorten it for an
actively exploited vulnerability. Every exception is recorded on the pull
request or issue with its reason and end date.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The release manager reviews the supported-versions record at the start of each
  release cycle and opens a pull request for any version that has left its
  window.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when contributors can tell from the repository which
versions they may rely on, when no supported version is one that upstream has
already abandoned, and when users receive advance notice before a platform they
use is dropped.
