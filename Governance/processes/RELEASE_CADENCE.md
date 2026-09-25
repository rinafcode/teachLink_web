# Release Cadence Process

## Purpose

This process defines when TeachLink Web releases, how the work that is ready
becomes a release, and what is frozen while a release is being prepared. It
gives contributors a date they can plan against and gives maintainers a
predictable rhythm, so that shipping is routine rather than an event.

TeachLink Web has not cut a tagged release yet. The repository has no Git
tags and no release workflow, so this process sets the schedule the project
follows from the first release train onward, and says plainly which parts
stay manual until release automation is added.

## Scope

This process applies to releases of the web client cut from the protected
`main` branch in this repository: scheduled release trains, patch releases,
major releases, and the freeze around each of them. It also covers what
happens when a train cannot ship on time.

It does not cover emergency changes that must reach production ahead of the
schedule, which follow `Governance/processes/HOTFIX.md` and are cut out of
cycle; releases of `teachLink_backend` or of any private workspace package
under `packages/*`; or the approval requirements for a release, which are
defined in `Governance/processes/RELEASE_SIGNOFF.md`.

## Release Frequency

- **Minor train: every two weeks.** The train is cut on the second Tuesday of
  each month and released on the following Wednesday, so a version is in
  production at the start of a working period rather than at the end of one.
- **Patch release: on demand.** A backwards compatible fix may be cut as soon
  as it passes the required checks, at most once per calendar week, so users
  are not left behind by a fix that is already merged. Security fixes and
  hotfixes are exempt from that limit.
- **Major release: at most one per quarter.** A major train replaces a
  scheduled minor train rather than adding a date, and it carries the breaking
  changes accepted under `Governance/processes/RFC_PROCESS.md` whose
  deprecation notice has elapsed.
- **Security release: any time.** A security fix is never held for a train
  window and may trigger a release in the same week it is merged.
- **A missed date is not made up.** A train that cannot ship is reported as
  missed and the work moves to the next train; the project does not compress
  the following window to recover a release, and an empty train is not padded
  with low-value work to keep the calendar tidy.

## Release Train Model

- The train is what has landed on `main` by the cut. Its contents are defined
  by merge time, not by a plan, so the scope is knowable by anyone reading
  the closed issues for the window.
- The train is run by a release captain, a temporary duty held by a Maintainer
  named on the release tracking issue rather than a standing office. The
  captain opens the release pull request, writes the notes, proposes the
  version per `Governance/policies/VERSIONING.md`, creates the annotated `v`
  tag, and verifies the release in production.
- At the cut, the captain creates the release branch `release-vMAJOR.MINOR`
  from `main`, following the naming already used for release branches in
  `Governance/policies/BACKPORT.md`. Patch releases are tagged from `main`
  without a branch.
- Work that is not ready at the cut rolls to the next train. A single item
  does not hold a train unless it is a regression in the previous release, in
  which case it ships as a patch.
- Changes that arrived during a train carry into the next one and are not
  cherry-picked into the release branch, except security fixes and
  regressions, which may be backported through
  `Governance/policies/BACKPORT.md` with two maintainer approvals.
- The repository has no release automation today. The tag is created and
  pushed by the release captain after the sign-offs, and the image is built
  from the tagged commit. Adding a release workflow is tracked as its own
  issue and does not change this schedule.

## Release Gates

A train is not cut until the checks in
`Governance/processes/RELEASE_SIGNOFF.md` are met:

- The sign-offs are in place: Lead Maintainer, QA Lead, and Product Manager,
  with the Lead Maintainer holding final authority.
- The required checks configured in `.github/branch-protection.md` pass on
  `main` for the release commit: `type-check`, `lint`, `build` and `test`,
  together with the `validate` jobs in `.github/workflows/ci.yml` for the UI
  and web3 validators.
- The `security-audit` policy in `CONTRIBUTING.md` passes: no high or
  critical dependency vulnerability reaches the release, and a documented,
  maintainer-approved suppression in `package.json` is recorded in the
  release notes.
- The release pull request references its issues with a closing keyword, so
  the train is auditable from the pull request alone.
- Documentation for the changes in the train is updated in the same pull
  requests, as the documentation gate in
  `Governance/processes/RELEASE_SIGNOFF.md` requires.

## Freeze Windows

- **Scope freeze, from five business days before the cut.** Only work that is
  already accepted may merge to `main`; anything still in review at the
  freeze rolls to the next train. This is a review freeze, not a merge
  freeze.
- **`develop` is never frozen.** Contributors keep merging throughout the
  window and held work waits for the next train, which is why the freeze is
  scoped to the release rather than to the development branch.
- **Release freeze, from the cut until the release is verified.** Once
  `release-vMAJOR.MINOR` exists, only fixes, security updates and
  documentation corrections for that release may merge into it. Each needs
  one maintainer approval and must keep the `type-check`, `lint` and `test`
  checks green, in the spirit of the expedited review path in
  `Governance/processes/HOTFIX.md`.
- **Notes freeze, at the cut.** Release notes and advisory text are frozen
  at the cut and afterwards only corrected. New capability is not added to a
  release that has been cut.
- **Verification window, one business day.** After the release is deployed,
  the captain verifies the deployed version, a sign-in and a core content
  flow, the error tracker for new errors, and the performance budget in
  `Governance/domains/PERFORMANCE_BUDGET.md`, and records the result on the
  release issue.
- **Security exception.** A security fix may enter a train at any point,
  including after the cut, and may trigger an out-of-cycle release. Only the
  Lead Maintainer may break a freeze, and the reason is recorded on the
  release issue. The freeze normally ends within three business days of the
  cut; a longer freeze is a signal that the train should have been smaller.

## When a Train Cannot Ship

- If a required check fails at the cut, the train is held, not shipped with a
  waived check. The failure and the fix are recorded on the release issue,
  and the release is re-attempted within five business days.
- If the sign-offs are missing, the train slips to the next train, and the
  Lead Maintainer records why the sign-off was not available.
- If a release is found broken in production, a patch or minor release is
  cut within 24 hours of the report, following the expedited path, and the
  follow-up work in `Governance/processes/HOTFIX.md` is tracked on the
  release issue.
- The project publishes a short note when a release is late or pulled, and
  says when the next version is expected. Silence is treated as a failure of
  this process.

## Ownership and Review

- Maintainers own this process. The release captain is a Maintainer for the
  duration of a train and hands the captaincy over when they step down
  mid-train.
- The Lead Maintainer approves schedule changes, the break of a freeze, and
  any release that ships outside this process.
- Contributors are asked in a repository issue for the coming window, at the
  scope freeze, so they know what will ship before it does.
- Changes to this process are proposed in a pull request that touches only
  the `Governance/` folder, and a cadence change takes effect from the next
  full month after it is merged so no window is cut short.

## Success

This process succeeds when contributors can name the date their work will ship
on, when releases go out on the schedule without a fire drill, when freezes
are short and scoped to the release rather than the whole project, and when a
late or pulled release is always explained.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | akargi (@akargi) |
