# Hotfix Process

## Purpose

This process defines when a hotfix is warranted for TeachLink Web, how it is
expedited through review, and what follow-up is required after it ships. It keeps
emergency changes safe and accountable without slowing them down.

## Scope

This process applies to fixes that must reach production outside the normal
release cadence because of severity.

## When a Hotfix Is Warranted

A hotfix is warranted when a defect is actively harming users or the service and
waiting for the next scheduled release is unacceptable. Signals include:

- A security vulnerability or data exposure.
- A service-wide outage or severe availability regression.
- A broken critical user flow (for example, sign-in, purchase, or core content).
- A legal or compliance issue requiring immediate action.

A hotfix must not be used to ship new features, non-critical changes, or work that
can safely wait for the regular release process.

## Expedited Review Path

- The hotfix change is small and targeted. If the change cannot be made small and
  targeted, an escalating hotfix that is deployed behind a safe rollback or flag
  is preferred.
- At least one maintainer must approve the change. The approval may be expedited
  but must still review the correctness of the fix and confirm it does not
  introduce unrelated changes.
- The fix must not require completing a full test suite to ship, but must pass the
  checks that are fast enough to be meaningful and that are most relevant to the
  change.
- Security and privacy-sensitive hotfixes follow the project's security
  disclosure and embargo policies in addition to this process.

## Post-Hotfix Follow-Up

- After the hotfix ships, the fix must be reconstructed as a proper, tested change
  and tracked back into the normal branch and release flow so it does not
  regress.
- The root cause and the reasons the hotfix was required are documented.
- The release process, tests, or guards that could have caught the issue earlier
  are reviewed and adjusted where valuable.
- Communication about the hotfix is published per the project's communication
  standards.

## Ownership

- Maintainers own this process and may act quickly under it when severity demands.
- Changes to this process are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This process succeeds when emergency fixes reach production promptly and safely,
and when each hotfix is followed by proper integration and prevention of
recurrence.