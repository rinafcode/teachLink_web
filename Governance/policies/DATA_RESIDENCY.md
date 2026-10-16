# Data Residency Policy

## Purpose

This policy defines where TeachLink Web data may be stored and processed, and
under what conditions it may cross a regional or national boundary. It lets
maintainers choose hosting and third-party services against a known rule instead
of deciding case by case, and lets users and institutions ask where their data
lives.

## Scope

This policy applies to personal data and learner, course, and account data
handled by the application, its databases, backups, logs, analytics, and the
third-party services that process them on the project's behalf. It does not
describe individual vendors (see the [Third-Party Scripts
governance](../domains/THIRD_PARTY_SCRIPTS.md) and the [Third-Party Licenses
policy](../policies/THIRD_PARTY_LICENSES.md)) or the deletion process (see the
record retention and legal hold policy).

## Where Data May Be Stored

Data may be stored and processed only in locations that the maintainers have
approved and recorded in the data-location register kept alongside the project's
operational documentation. The register lists, for each data category:

- the primary storage region and the backup region;
- the service provider that operates it and the legal entity responsible;
- the categories of data held and their classification (public, internal,
  personal, sensitive).
- **Default rule.** Personal data stays in the primary region recorded for its
  category. Backups stay in the same jurisdiction as the primary copy unless the
  register states otherwise.
- **Logs and analytics.** Logs and analytics must not contain personal data
  beyond what the [Analytics Data Collection](../domains/ANALYTICS_DATA.md)
  allows, and are stored in a region listed in the register.

## Transfer Restrictions

Moving data out of its approved region is a transfer and is restricted:

- A transfer needs a lawful transfer mechanism for the jurisdictions involved
  (for example an adequacy decision or approved contractual clauses), recorded
  in the register.
- Personal data is not sent to a new sub-processor or region until the vendor
  review is complete and the register is updated.
- Support and debugging access from outside the approved region is read-only,
  time-limited, logged, and limited to the data needed for the task.
- Contributors never copy production personal data to local machines, forks,
  issue trackers, or chat. Use anonymised or synthetic fixtures instead.

## Exception Process

When a transfer or new location is needed and the rules above do not allow it:

- The requester opens a private request describing the data, the destination,
  the purpose, and the duration.
- Two maintainers review it, one of them accountable for privacy or security,
  and consult counsel if the jurisdiction is new.
- An approved exception is time-limited, recorded in the register with its
  reason and expiry, and reviewed again before it is renewed.
- An unapproved transfer found after the fact is treated as an incident under
  the [Security Policy](../SECURITY_POLICY.md): it is contained, assessed for
  notification duties, and recorded.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The data-location register is reviewed at least once a year and whenever a
  provider or region changes.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when every data category has a recorded location, when no
transfer happens without a recorded mechanism and approval, and when exceptions
are rare, time-limited, and reviewed.
