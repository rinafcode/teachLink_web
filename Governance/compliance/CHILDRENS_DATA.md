# Children's Data Policy

## Purpose

This policy sets how TeachLink Web handles personal data about children. As an
education-focused project, it may be used by or on behalf of young learners, and
children deserve extra care. The policy defines the age thresholds, how parental
consent is handled, and how data collected about children is kept to a minimum.
This document is a governance statement, not legal advice; maintainers consult
qualified counsel before relying on it for a legal decision.

## Scope

This policy applies to any feature or integration that collects, processes, or
shares personal data from or about people under the age of majority or digital
consent in their jurisdiction. It is applied together with the [Privacy Notice
governance](../domains/PRIVACY_NOTICE.md), the [Cookie and Consent
governance](../domains/COOKIE_CONSENT.md) and the [Analytics Data
Collection](../domains/ANALYTICS_DATA.md).

## Age Thresholds

The project uses age thresholds that follow the applicable law:

- **Under 13** is treated as a child everywhere; no personal data is collected
  from these users without verifiable parental consent, in line with laws such
  as COPPA.
- **13 to 15** is treated as a child in jurisdictions where the age of digital
  consent is higher (for example up to 16 under the GDPR, which member states
  may lower to 13), and parental consent is required there.
- **16 and over** is treated as an adult for consent purposes unless local law
  says otherwise.
- Where the user's location is not known, the stricter threshold applies. The
  product does not target children under 13 for general use; features designed
  for children are introduced only through the project's [RFC
  process](../processes/RFC_PROCESS.md) with a privacy review.
- Age is asked for in a neutral way, without encouraging users to misstate it,
  and the answer is used only to apply this policy.

## Parental Consent Handling

Where parental consent is required:

- Consent is requested from a parent or guardian, not the child, in plain
  language that explains what is collected and why, and how to refuse or
  withdraw.
- The method of verifying the parent is proportionate to the risk (for example a
  confirmation sent to a parent email address for limited data, stronger checks
  for riskier uses). Verification data is used only for verification and deleted
  afterwards.
- Consent is recorded as set out in the consent management policy, and a parent
  can review the child's data, ask for it to be deleted, and withdraw consent at
  any time. The right-to-erasure policy applies, and the deletion is completed
  promptly.
- Where a school or institution gives consent on behalf of parents, the
  agreement says so and limits the use to the educational purpose.
- If it comes to light that data was collected from a child without valid
  consent, collection stops, the data is deleted unless the law requires
  otherwise, and the family is told.

## Data Minimisation

Children's data is held to a higher standard:

- Collect only what is strictly needed to provide the educational feature; no
  profiling, behavioural advertising, or sale of children's data.
- No optional analytics, third-party trackers, or public profiles for children
  by default (see the [Third-Party Scripts
  governance](../domains/THIRD_PARTY_SCRIPTS.md)), and default settings are the
  most private ones.
- Do not publish children's names, photos, or contributions with identifying
  details without parental consent, and never display contact information.
- Retention is as short as possible, and data is deleted when the purpose ends
  or when the account is closed, following the record retention and legal hold
  policy.
- Maintainers must not copy children's data into issues, chats, or test
  fixtures; use synthetic data.
- A privacy review is required before any feature that could be used by children
  is released.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The privacy owner reviews this policy once a year and whenever laws on
  children's data change.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when no personal data is collected from a child without the
consent the law requires, when parents can see and control what is held, and
when the project holds as little about children as it can.
