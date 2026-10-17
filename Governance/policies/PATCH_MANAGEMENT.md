# Patch Management Policy

## Purpose

This policy defines how TeachLink Web applies patches to its dependencies and
its own code: how often patches are reviewed, how they are prioritized, and
the emergency path for patches that cannot wait. It gives contributors and
maintainers a single, versioned reference, so that a known vulnerability or
defect is fixed in a predictable time and nobody has to guess how urgent
it is.

## Scope

This policy applies to third-party packages and their transitive dependencies,
the framework, build tooling, and runtime versions the project relies on, CI
workflow actions, and vulnerabilities or defects in TeachLink Web's own
source. It does not set severity levels: those come from
`Governance/SECURITY_SEVERITY_RUBRIC.md`.

Where this policy and `Governance/SECURITY_POLICY.md` differ, the security
policy wins and this policy is corrected.

## Patch Cadence

Patches are reviewed on a fixed schedule so routine updates never pile up:

| Activity | Cadence |
| --- | --- |
| Dependency audit review | At least once a week |
| Routine patch and minor updates | Next scheduled release |
| Major version upgrades | Planned per release, tracked in an issue |
| Runtime and framework security releases | Reviewed within 2 business days |
| Review of this policy | Every 6 months |

- The automated dependency audit and the automated dependency update pull
  requests are the main sources of patches.
- Routine updates ship in the next scheduled release under
  `Governance/processes/RELEASE_CADENCE.md`.
- A major version upgrade that changes anything observable is a breaking
  change and follows `Governance/policies/BREAKING_CHANGES.md`.
- A security fix never waits for the routine cadence. It is prioritized as
  set out below.

## Prioritization

Every patch with security impact takes the level assigned under
`Governance/SECURITY_SEVERITY_RUBRIC.md`. The levels and deadlines are:

| Level | Patch deadline |
| --- | --- |
| `critical` | Mitigation in place within 72 hours of validation |
| `high` | Fix released within 7 calendar days of validation |
| `moderate` | Fix released within 30 calendar days of validation |
| `low` | Next scheduled release, within 90 calendar days |

- These deadlines match the rubric and `Governance/SECURITY_POLICY.md`. A
  change to one is made to all of them in the same pull request.
- A finding the project cannot yet classify is treated as `high` until it can
  be, so a missing answer never lowers urgency.
- Within a level, a dependency that is reachable in production is patched
  before one used only in development or build tooling.
- A patch with no security impact is a routine update and follows the
  cadence above.

## Emergency Patch Path

A patch takes the emergency path when it is `critical`, when it is `high`, or
when the vulnerability is being actively exploited. Emergency patches ship
through the expedited path in `Governance/processes/HOTFIX.md`, with these
requirements:

- **Declare.** A maintainer declares the emergency on the tracking issue and
  names one patch owner.
- **Smallest fix.** The patch is the smallest change that removes the risk. A
  temporary mitigation, such as pinning a safe version or disabling the
  affected feature, is acceptable while a full fix is prepared.
- **Review.** A maintainer other than the author approves the pull request,
  and a second maintainer reviews any assessment of `high` or above.
  Approvals are recorded on the pull request. A verbal or chat approval does
  not count.
- **Checks.** The checks most relevant to the change must pass, as set out in
  `Governance/processes/HOTFIX.md`. An emergency never skips review.
- **Release.** The patch is released outside the routine cadence as soon as it
  is approved, and `Governance/policies/VERSIONING.md` decides the version
  bump.
- **Backport.** The fix is backported to supported releases under
  `Governance/policies/BACKPORT.md`.
- **Confidentiality.** Until a fix is released, details of the vulnerability
  stay private under `Governance/processes/COORDINATED_DISCLOSURE.md`.
- **Follow-up.** Within 5 business days, the patch owner records a short note
  on the tracking issue: cause, timeline, fix, and how to prevent a repeat.
  The fix is also reconstructed as a tested change in the normal release flow.

## Exceptions

If a patch cannot be applied within its deadline, for example because no fixed
version exists, the patch owner records an exception on the tracking issue:

- The reason and the risk being accepted.
- The mitigation in place while the patch is pending.
- A review date no more than 30 days away.

A maintainer approves the exception, and the reporter is told before the
deadline passes, with the reason and a new date.

## Ownership and Review

- Maintainers own this policy, triage findings, and approve exceptions, as set
  out in `Governance/roles/MAINTAINER.md`.
- A change to this policy is proposed in a pull request that touches only the
  Governance/ folder.
- This policy is reviewed alongside `Governance/SECURITY_SEVERITY_RUBRIC.md`
  and `Governance/processes/HOTFIX.md` so the three stay consistent.

## Success

This policy succeeds when every patch is prioritized by a recorded level, when
no patch misses its deadline without a recorded exception, and when emergency
patches ship quickly without skipping review or checks.

## Regression Tests

Coverage is provided by `Governance/policies/PATCH_MANAGEMENT.test.ts`, which
pins the cadence, prioritization, and emergency-path guarantees in this
document.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-10-17 | Initial version. | TeachLink maintainers |
