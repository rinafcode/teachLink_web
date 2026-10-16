# Vendor Risk Management Policy

## Purpose

This policy defines how TeachLink Web assesses and monitors the third-party
vendors and services it depends on. It gives maintainers a consistent way to
decide whether a vendor is acceptable, how closely to watch it, and when to stop
using it, so a dependency never becomes a hidden risk to users or contributors.

## Scope

This policy applies to any external service, platform, or supplier that
processes project or user data, runs project code, hosts project assets, or sits
in the build and release path: hosting and CDN providers, analytics and
error-tracking services, authentication and payment providers, CI services, and
package registries. Embedded browser scripts are additionally governed by the
[Third-Party Scripts governance](../domains/THIRD_PARTY_SCRIPTS.md) and
dependency licences by the [Third-Party Licenses
policy](../policies/THIRD_PARTY_LICENSES.md).

## Vetting Criteria

Before a vendor is adopted, a maintainer records an assessment in the pull
request or issue that introduces it, covering:

- **Necessity.** What the vendor does that the project cannot reasonably do
  itself, and the alternatives considered.
- **Data.** The categories of data the vendor will receive, where it is stored,
  and whether personal data is involved.
- **Security.** Published security practices and certifications, breach history,
  and how the vendor handles vulnerability reports.
- **Reliability.** Availability record, support terms, and how the project
  degrades if the vendor is down.
- **Legal.** Licence and terms of service compatibility with the project, data
  processing terms where personal data is involved, and the vendor's
  jurisdiction.
- **Exit.** How data and configuration can be exported and the vendor replaced.
- A vendor that fails a necessity, data, or security check is not adopted
  without an explicit, recorded exception approved by two maintainers.

## Risk Tiers

Each approved vendor is placed in a tier that sets how closely it is reviewed:

- **Tier 1 - Critical.** Handles personal data, credentials, or payments, or
  whose failure stops the product or release process. Requires the full
  assessment, a recorded owner, and a documented contingency plan.
- **Tier 2 - Important.** Has meaningful access to project systems or
  non-sensitive user data, or whose failure degrades the product. Requires the
  standard assessment and a recorded owner.
- **Tier 3 - Low.** Has no access to user data or credentials and is easily
  replaced (for example a development convenience tool). Requires a short note
  recording what it is used for.
- A vendor takes the highest tier of any role it plays. A change in how a vendor
  is used, such as sending it new data, triggers a re-tiering before the change
  ships.

## Review Cadence

Reviews keep assessments current:

- Tier 1 vendors are reviewed at least every 6 months, Tier 2 every 12 months,
  and Tier 3 every 24 months or when they change.
- An unscheduled review is triggered by a vendor security incident, an
  acquisition or change of terms, a loss of required certification, repeated
  outages, or a new type of data being sent.
- Each review confirms the tier, the data shared, the owner, the contingency
  plan, and whether the vendor is still needed; unused vendors are removed and
  their access revoked.
- A vendor that no longer meets the criteria is placed on a time-boxed
  remediation plan or replaced, and the decision is recorded.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- Each vendor has a named maintainer owner, and the vendor register is reviewed
  as a whole at least once a year.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when every vendor has a recorded assessment, tier, and
owner, when reviews happen on schedule, and when a vendor incident leads to a
prompt, documented decision rather than a surprise.
