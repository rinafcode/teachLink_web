# Changelog Policy

## Purpose

This policy defines how TeachLink Web records changes in its changelog. It fixes
the format entries are written in, the categories a change may be filed under,
and the conditions under which an entry is required, so that a reader can tell
from the changelog alone what changed, how it affects them, and which release
carried it.

The changelog is the human-readable companion to the version numbers defined in
`Governance/policies/VERSIONING.md`. A version number says how large a change
is; the changelog says what the change was. Without a fixed format and a fixed
set of categories, entries drift into prose that is either too vague to act on
or too detailed to scan, and the document stops being worth reading.

## Scope

This policy applies to the changelog of the web client in this repository: the
`CHANGELOG.md` file at the repository root, and the release notes published with
each Git tag. It covers every change that a consumer of the project can observe:
user-facing capabilities and pages, URL routes, components and their public
props, exported modules and utilities, API query and response shapes the
frontend consumes, configuration and environment variables, build and CI entry
points, and governance documents.

It does not cover the commit history, which is governed by the pull request
conventions in `CONTRIBUTING.md`; the version numbers themselves, defined in
`Governance/policies/VERSIONING.md`; the deprecation notice periods and removal
criteria, defined in `Governance/policies/DEPRECATION.md`; or the release
checklist steps, defined in `Governance/templates/RELEASE_CHECKLIST.md`. A
changelog entry records that a change shipped; it does not replace the process
that produced it.

## Changelog Format

The changelog is a single Markdown file, `CHANGELOG.md`, at the repository root.
It is written for a reader who wants to know what changed, not for a reader who
wants to know how it was implemented.

- **One section per release.** Each released version gets a heading of the form
  `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`, using the version format and date of
  the release. The version matches the Git tag and the `version` field in the
  root `package.json` exactly, without a `v` prefix.
- **Newest release first.** Releases are ordered from newest to oldest, so the
  top of the file is always the current release.
- **Unreleased section on top.** Work that has merged but not yet been released
  is collected under a `## [Unreleased]` heading above the newest release. The
  section is emptied into the release section when the release is cut, never
  deleted with its entries.
- **Categories within each release.** Each release section is divided into the
  categories below, in the order they are listed. A category with no entries is
  omitted rather than left empty.
- **One entry per change.** Each entry is a single line beginning with `- `,
  written in the past tense, and describes the observable change rather than the
  implementation. Entries name the affected surface (a page, route, component,
  export, configuration key, or command) so a reader can find it.
- **References are linked.** Where an entry corresponds to an issue or pull
  request, the entry ends with a link to it, so the reasoning behind the change
  is one click away.
- **Breaking changes are called out.** An entry for a breaking change is marked
  with a `**Breaking:**` prefix and states what a consumer must do to migrate,
  or links to the migration guidance that does.
- **Security fixes are attributed.** A security fix is listed under `Security`
  and follows the disclosure rules in
  `Governance/processes/VULN_DISCLOSURE.md`; it never reveals an unpatched
  defect or a reporter who asked not to be named.

The changelog is append-only in spirit: an entry for a released version is
corrected only to fix a factual error, and the correction is noted in the entry
rather than made silently.

## Change Categories

Every entry belongs to exactly one of the following categories, which are the
only categories the changelog uses:

- **Added** — new user-facing capabilities, pages, routes, components, props,
  configuration options, environment variables, or exported modules.
- **Changed** — changes to existing behaviour that are not fixes and not
  removals, including dependency upgrades that alter what users experience.
- **Deprecated** — interfaces that are still present but scheduled for removal
  under `Governance/policies/DEPRECATION.md`, with the replacement and the
  earliest removal release named.
- **Removed** — interfaces that have been removed, after any required
  deprecation notice period has elapsed.
- **Fixed** — bug fixes that correct behaviour without changing an interface.
- **Security** — fixes and hardening that address a vulnerability or reduce
  exposure, described without disclosing an unpatched defect.
- **Documentation** — changes to documentation, governance, or comments that do
  not change behaviour.

A change that fits more than one category is filed under the category that
matters most to a reader: a security fix that also changes behaviour is
`Security`, and a removal that also fixes a bug is `Removed`. Categories are
never invented ad hoc; a change that seems to need a new category is discussed
through `Governance/processes/RFC_PROCESS.md` before the category is added.

## When Entries Are Required

An entry is required for every change that a consumer of the project can
observe, and it is written in the same pull request that makes the change, not
in a follow-up:

- **Always required.** Any change that adds, changes, deprecates, or removes a
  user-facing capability, page, route, component, prop, export, configuration
  key, environment variable, or build or CI entry point. Any bug fix, security
  fix, or dependency upgrade that changes what users experience. Any change to a
  governance document.
- **Required at release time.** A change that is merged behind a default-off
  feature flag gets its entry when the flag is enabled for users, not when the
  flag is added, so the changelog never announces behaviour users cannot reach.
- **Not required.** Internal refactors with no observable change, test-only
  changes, comment and formatting fixes that change no behaviour, and
  dependency bumps within an existing range that change nothing users
  experience. These may still be listed under `Documentation` when they are
  worth recording.
- **Never omitted for convenience.** A change that is required but missing its
  entry is incomplete and is not merged. Reviewers check for the entry as part
  of the normal review, and the release checklist verifies that the `Unreleased`
  section is empty before a release is tagged.

When in doubt, an entry is written. A changelog entry that turns out to be
unnecessary costs a line; a missing entry costs a consumer the ability to know
what changed.

## Ownership and Review

- Maintainers own this policy, approve exceptions, and review the changelog for
  format and category drift on a regular cadence.
- The contributor who makes a change writes its entry. Reviewers verify the
  entry is present, correctly categorised, and written for a reader rather than
  for the author.
- A change to this policy is proposed in a pull request that touches only the
  `Governance/` folder, and the change is documented in the pull request
  description.

## Success

This policy succeeds when the changelog is accurate enough that a consumer can
decide whether to take an update by reading it, every observable change appears
in the release that shipped it, and no entry requires the reader to open the
source to understand what changed.
