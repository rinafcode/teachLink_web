# Deprecation Policy

## Purpose

This policy defines how TeachLink Web deprecates and removes public interfaces,
user-facing capabilities, configuration, and documentation. It sets a minimum
notice period, the channels through which deprecations are announced, and the
criteria that must be met before a deprecated item is removed, so that
contributors and consumers can rely on a predictable, versioned removal process.

## Scope

This policy applies to anything the project exposes for others to depend on:
user-facing capabilities and pages, URL routes, components and their public
props, exported modules and utilities, API query shapes the frontend consumes,
configuration and environment variables, build and CI entry points, and
governance documents. It does not cover internal refactors with no externally
observable change, which follow the normal review process without a deprecation
cycle.

## Deprecation Notice Period

- The minimum notice period is **one minor release cycle for user-facing
  capabilities and two minor release cycles for developer-facing interfaces**
  (components, exports, configuration, and build entry points).
- The notice period starts when the deprecation is announced through the channels
  below and lands in a released version, not when the decision is made.
- Breaking changes with no reasonable migration path are not deprecated and
  removed; they are rejected or redesigned under the RFC process in
  `Governance/processes/RFC_PROCESS.md`.
- The notice period may be shortened only for security or legal reasons, and the
  shortening must be justified in the deprecation announcement.

## Communication Channels

Deprecations are announced through all of the following, in the same release
that first ships the deprecation:

- **Release notes.** Every deprecation appears in the release notes of the
  version that introduces it, with the affected item, the replacement, and the
  earliest release in which removal may occur.
- **Deprecation log.** The item is recorded in the deprecation section of the
  affected documentation so the outstanding deprecations are listed in one
  place.
- **Console or runtime warnings.** Where the deprecated surface is reachable at
  runtime (for example a component or utility), the code emits a warning that
  names the replacement. Warnings are dev-only where production noise would
  harm users.
- **Migration guidance.** The announcement documents how to move to the
  replacement, including a code example for developer-facing interfaces.

Direct messages to individual consumers (chat, email, issue threads) may
supplement these channels but never replace them.

## Removal Criteria

A deprecated item may be removed only when all of the following hold:

- **Notice period elapsed.** The notice period defined above has elapsed since
  the first release carrying the deprecation.
- **Replacement available.** A documented replacement exists, or the item is
  genuinely obsolete with no remaining supported use.
- **Migration path documented.** Migration guidance was published with the
  deprecation and is still accurate at removal time.
- **No blocking usage.** Known internal usages are migrated, and open issues
  reporting an unresolved dependency on the item are addressed or explicitly
  waived by maintainers with reasoning recorded on the tracking issue.
- **Tracking issue exists.** Removal happens through an issue that lists the
  item, the release that deprecated it, and the removal checklist, so the
  decision is auditable.
- **Removal is complete.** The change that removes the item also removes its
  documentation, dead configuration, redirects, and test scaffolding, and
  updates the deprecation log.

Removals follow the release process; they are never shipped as unannounced
drive-by changes.

## Ownership and Review

- Maintainers own this policy, approve exceptions, and review the outstanding
  deprecation log on a regular cadence so items do not linger indefinitely.
- A deprecation is proposed in a pull request that touches only the
  `Governance/` folder when it changes this policy; deprecating an individual
  surface follows the normal issue and pull request flow and must reference this
  policy.

## Success

This policy succeeds when deprecated items are announced where users actually
look, no capability or interface disappears without its promised notice, and
removals are complete, auditable, and boring.
