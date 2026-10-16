# Consent Management Policy

## Purpose

This policy defines when TeachLink Web must ask for consent before processing
personal data, how that consent is recorded, and how a person can withdraw it.
It makes consent specific, provable, and as easy to withdraw as it was to give.

## Scope

This policy applies to every feature that processes personal data on the basis
of consent: optional analytics and error reporting, non-essential cookies and
local storage, marketing and notification messages, optional profile data, and
sharing of data with third parties. Cookie categories are detailed in the
[Cookie and Consent governance](../domains/COOKIE_CONSENT.md) and analytics
events in the [Analytics Data Collection](../domains/ANALYTICS_DATA.md).

## What Requires Consent

Consent is required before the project:

- sets or reads non-essential cookies or similar storage (anything outside the
  strictly necessary category);
- collects analytics or error-reporting data tied to a person or device;
- sends marketing or optional notification messages;
- shares personal data with a third party for that party's own purposes;
- processes data of a child, which also needs the parental authority described
  in the [Privacy Notice governance](../domains/PRIVACY_NOTICE.md) and the
  children's data policy.
- Consent is not used where another lawful basis applies (for example data
  strictly necessary to provide the service the user asked for), and consent is
  never bundled as a condition of using the core service when it is not needed
  for it.

## How Consent Is Recorded

A valid consent is freely given, specific, informed, and unambiguous. Each time
consent is given the record keeps:

- a pseudonymous identifier for the user or browser;
- the purpose or category consented to, and the wording and version of the
  notice shown;
- the date and time, and the mechanism (for example banner choice or settings
  toggle);
- later changes, so the history of grant and withdrawal can be shown.
- Defaults are off. Pre-ticked boxes, scrolling, or continued use do not count
  as consent. Declining must be as easy as accepting, and the service works
  without optional consent.

## Withdrawal

People can withdraw consent at any time:

- A visible control in the application settings, reachable from every page,
  withdraws consent per category without needing an account to be contacted.
- Withdrawal takes effect immediately for new processing: the relevant scripts
  stop loading and queued sends stop.
- Data already collected on that basis is deleted or anonymised within 30 days
  unless another lawful basis requires keeping it, following the record
  retention and legal hold policy.
- Consent is re-requested when the purpose or wording changes materially and
  after the expiry period set in the [Cookie and Consent
  governance](../domains/COOKIE_CONSENT.md).

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- Changes to consent wording or categories are reviewed by a maintainer
  accountable for privacy before they ship.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when no optional processing starts without a recorded
consent, when withdrawal works immediately from the settings, and when the
project can show on request what a person agreed to and when.
