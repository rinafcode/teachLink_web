# URL and Redirect Governance Policy

## Purpose

This policy defines how URLs are created and how redirects are handled on
TeachLink Web. It ensures redirects are approved, are safe against open-redirect
abuse, and are audited so the URL structure stays trustworthy and predictable.

## Scope

This policy covers URL conventions, redirect configuration, and the rules that
prevent redirects from being abused.

## Redirect Approval

- New redirects must be approved before they go into production.
- The approval records the reason for the redirect, the source and destination,
  and the expiry or review date where applicable.
- Redirects must use permanent (301) for permanent moves and temporary (302) for
  transitional moves, matching the intended semantics.
- Redirect chains must be avoided; a redirect should resolve to the final
  destination directly rather than chaining through intermediates.

## Open-Redirect Prevention

- Redirect targets must be validated so that only permitted domains and schemes
  are accepted.
- User-influenced redirects must never be able to send a user to an unapproved
  external destination.
- Redirect handling must not allow control characters, whitespace tricks, or
  scheme confusion to bypass validation.
- Internal paths must remain internal; redirects must not expose internal network
  targets or open the service to open-redirect attacks.

## Audit Cadence

- The redirect configuration is audited on a regular cadence for stale,
  unintended, or abused entries.
- Old redirects drive cleanup: resolved, expired, or no-longer-needed redirects
  are removed or consolidated.
- Logs or metrics that surface redirect activity are reviewed as part of the audit
  to identify unexpected destinations or volumes.

## Ownership

- The team responsible for web infrastructure and SEO owns this policy.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This policy succeeds when redirects are approved, safe, and audited, and when the
URL structure remains stable, predictable, and free of open-redirect risk.