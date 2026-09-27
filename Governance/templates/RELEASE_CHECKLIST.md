# Release Checklist Template

## Purpose

This template is the fillable checklist for a TeachLink Web release. It fixes
the pre-release steps, the sign-off gates, and the post-release steps that every
release carries, so that a release captain works from one ordered list instead
of reconstructing the process from memory.

A release is not a single merge. It is a sequence of checks that must all hold
before a version reaches users, and a short set of follow-ups that must happen
after it does. This checklist records that sequence in the order it is performed
and names the document that governs each step, so a reader can tell what was
done and what was skipped.

## Scope

This template applies to every release of the TeachLink Web client cut from the
protected `main` branch: scheduled minor trains, patch releases, major releases,
and security releases. It covers the steps taken before the cut, the sign-offs
that gate the cut, and the follow-up after the release is verified.

It does not define the release schedule, which is set by
`Governance/processes/RELEASE_CADENCE.md`; the approval requirements themselves,
which are defined by `Governance/processes/RELEASE_SIGNOFF.md`; the version
number, which follows `Governance/policies/VERSIONING.md`; or emergency changes
that reach production ahead of the schedule, which follow
`Governance/processes/HOTFIX.md`. Where this checklist and one of those documents
disagree, the process document governs and this template is corrected in the same
pull request.

## How to Use This Checklist

- Copy this file into the release tracking issue or the release pull request and
  work through the sections in order. Do not reorder them: the sign-off gates
  depend on the pre-release steps being complete.
- Mark each item `[x]` when it is done, `[ ]` when it is not, and `[n/a]` with a
  one-line reason when it genuinely does not apply. An unchecked item is a
  blocker, not a note.
- Replace every `<placeholder>` with real content and delete every `*Guidance:*`
  line before the release is cut.
- Record the release captain, the version, and the release tracking issue at the
  top, so the checklist is auditable on its own.
- A release that ships with an unchecked gate is treated as a governance
  failure and is corrected in the next release, with the reason recorded on the
  tracking issue.

## Release Identification

- **Version:** `<vMAJOR.MINOR.PATCH>`
  *Guidance:* Required. Proposed per `Governance/policies/VERSIONING.md` and
  confirmed by the Lead Maintainer. The version is not final until the cut.
- **Release type:** `<minor train | patch | major | security>`
  *Guidance:* Required. Determines which parts of
  `Governance/processes/RELEASE_CADENCE.md` apply and whether a release branch is
  created.
- **Release captain:** `<maintainer handle>`
  *Guidance:* Required. A Maintainer named on the release tracking issue, as
  `Governance/processes/RELEASE_CADENCE.md` requires.
- **Release tracking issue:** `<link>`
  *Guidance:* Required. The issue the checklist and the release pull request
  reference, so the train is auditable from one place.
- **Cut date:** `<YYYY-MM-DD>`
  *Guidance:* Required. The date the release branch is created and the notes are
  frozen.

## Pre-Release Steps

Complete every step before requesting sign-off. Each step names the document that
governs it.

- [ ] **Scope is frozen.** Only work already accepted has merged to `main` since
  the scope freeze, per `Governance/processes/RELEASE_CADENCE.md`.
- [ ] **Release branch exists.** `release-vMAJOR.MINOR` is created from `main`
  for a minor or major train, or the patch is tagged from `main`, following the
  branch naming in `Governance/policies/BACKPORT.md`.
- [ ] **Version is proposed.** The version follows
  `Governance/policies/VERSIONING.md` and matches the contents of the train.
- [ ] **Required checks pass on the release commit.** `type-check`, `lint`,
  `build`, and `test` are green, together with the `validate` jobs for the UI and
  web3 validators, as configured in `.github/branch-protection.md`.
- [ ] **Security audit passes.** No high or critical dependency vulnerability
  reaches the release, per the `security-audit` policy in `CONTRIBUTING.md`. Any
  documented, maintainer-approved suppression in `package.json` is recorded in
  the release notes.
- [ ] **Deprecations are announced.** Every deprecation in the train names the
  affected item, its replacement, and the earliest release in which removal may
  occur, per `Governance/policies/DEPRECATION.md`.
- [ ] **Documentation is updated.** Documentation for every change in the train
  is updated in the same pull requests, as the documentation gate in
  `Governance/processes/RELEASE_SIGNOFF.md` requires.
- [ ] **Release notes are drafted.** The notes list the changes, the version, any
  security advisory IDs, and any recorded suppressions, and are frozen at the
  cut.
- [ ] **Release pull request references its issues.** The pull request uses a
  closing keyword for each issue in the train, so the train is auditable from the
  pull request alone.
- [ ] **Rollback path is known.** The previous release's image and tag are
  identified, so a failed verification can be rolled back without improvising.

## Sign-Off Gates

A release is not cut until every gate below is satisfied. The gates are defined
by `Governance/processes/RELEASE_SIGNOFF.md`; this section records them in the
order they are collected.

- [ ] **Lead Maintainer sign-off.** Confirms that all technical requirements
  have been met. Holds final authority to approve or reject the release.
- [ ] **QA Lead sign-off.** Verifies that all testing has been completed and
  passed, including the automated unit, integration, and end-to-end suites.
- [ ] **Product Manager sign-off.** Confirms that the release aligns with the
  product roadmap.
- [ ] **Code review gate.** Every change in the train is reviewed and approved.
- [ ] **Security scan gate.** A security scan has been performed and any
  findings are addressed or explicitly accepted by a maintainer.
- [ ] **Documentation gate.** All new features and changes are documented.
- [ ] **Freeze respected.** No change entered the release branch after the cut
  except a fix, security update, or documentation correction approved under
  `Governance/processes/RELEASE_CADENCE.md`.

## Release Steps

- [ ] **Tag is created.** The release captain creates and pushes the annotated
  `v` tag on the release commit.
- [ ] **Image is built from the tagged commit.** The deployed artifact is built
  from the tag, not from a moving branch.
- [ ] **Release is published.** The release notes are published with the tag, and
  any advisory is published on its agreed disclosure date per
  `Governance/templates/ADVISORY_TEMPLATE.md`.

## Post-Release Steps

Complete every step after the release is deployed. The verification window is one
business day, per `Governance/processes/RELEASE_CADENCE.md`.

- [ ] **Deployed version is verified.** The running version matches the released
  tag.
- [ ] **Core flows are verified.** A sign-in and a core content flow are checked
  in production.
- [ ] **Error tracker is checked.** No new error class appears after the
  release; any new error is triaged and either fixed or tracked.
- [ ] **Performance budget is checked.** The release stays within
  `Governance/domains/PERFORMANCE_BUDGET.md`.
- [ ] **Verification result is recorded.** The outcome of the verification window
  is recorded on the release tracking issue.
- [ ] **Release issue is closed.** The tracking issue is closed with a link to
  the tag and the published notes.
- [ ] **Follow-ups are filed.** Any deferred fix, documentation gap, or process
  change found during the release is filed as its own issue rather than left in
  the release thread.
- [ ] **Next train is unblocked.** Work held by the freeze is confirmed to be
  moving to the next train, per `Governance/processes/RELEASE_CADENCE.md`.

## Ownership

- The release captain owns this checklist for the release they run and is
  responsible for completing it and recording the result on the tracking issue.
- Maintainers own this template. They may add a step when a release exposes a
  gap, and they remove a step only when the document that governs it changes.
- Changes to this template are proposed in a pull request that touches only the
  `Governance/` folder, as `Governance/README.md` requires.

## Success

This template is working when:

- Every release has a completed checklist on its tracking issue, and a reader can
  tell from it which gates were satisfied and which were not.
- No release is cut with an unchecked sign-off gate, and no release ships with a
  placeholder or an unresolved `<placeholder>` in its checklist.
- The post-release verification window is completed and recorded for every
  release, including releases that are rolled back.
- Follow-ups found during a release become tracked issues rather than being lost
  in the release thread.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | memplethee-lab (@memplethee-lab) |
