# Error Tracking Governance Policy

## Purpose

This policy defines how TeachLink Web uses error tracking: how the credentials
that connect the app to the tracking service are protected, what personal data
must be removed before an event leaves the browser or server, and how long
captured events are kept.

## Scope

This policy covers every error, exception, and breadcrumb the application sends
to an error tracking service (for example Sentry-compatible SDKs), and the
configuration, credentials, and dashboards used to collect and review them.

## DSN Secrecy

The Data Source Name (DSN) identifies the project events are sent to and, in
combination with other project settings, can be abused to flood or pollute it.

- The DSN is treated as a secret. It must never be committed to the repository,
  including in code, tests, fixtures, documentation, examples, or lockfiles.
- The DSN is supplied only through environment configuration or the deployment
  platform's secret store, and is scoped per environment (development, staging,
  production). Environments must not share a DSN.
- The DSN must never be written to logs, console output, error messages, build
  output, or CI logs. Code that initialises error tracking must not log the DSN
  or any value derived from it.
- Only the minimum set of maintainers may view or rotate the DSN. Auth tokens
  used for source-map upload or the tracking API are secrets under the same rule
  and are never exposed to the client bundle.
- If a DSN is exposed (committed, logged, or shared), it is treated as
  compromised: it is rotated promptly, the exposure is recorded, and the
  exposed value is removed from any place it appears.

## PII Scrubbing

Error events must not carry personal data. Scrubbing happens before an event is
sent (in the SDK or reporting layer), not only after it is stored.

- The following must be removed or masked: email addresses, names, phone
  numbers, IP addresses, authentication tokens, session identifiers, cookies,
  `Authorization` and other credential headers, passwords, wallet or payment
  details, and any free-form user-entered content.
- Request and response bodies, form values, and query-string parameters are
  excluded by default and are only included through an explicit allowlist.
- Users are identified by an opaque, non-reversible identifier only. Raw
  emails, usernames, or account names must not be used as the user identifier.
- URLs, breadcrumbs, and error messages are scrubbed of tokens and identifiers
  before sending. Default SDK capture of personal data stays disabled.
- Session replay or screen recording, if ever enabled, must mask all text and
  inputs by default and requires an approved change to this policy.
- New fields added to error context must be reviewed for personal data in the
  pull request that introduces them.

## Retention Period

- Error events, breadcrumbs, and attachments are retained for a maximum of
  **90 days**, after which they are deleted automatically.
- The retention setting is configured in the tracking service and reviewed at
  least once a year to confirm it still matches this policy.
- Events tied to an open incident or security investigation may be held longer
  only for as long as the investigation requires, then deleted.
- Data subject deletion requests apply to error tracking data; maintainers must
  be able to locate and delete events that relate to a given request.
- Any change to the retention period requires an update to this policy.

## Enforcement and Review

- Pull requests that add or change error tracking configuration, context, or
  logging are checked against this policy by reviewers.
- Violations, such as an exposed DSN or unscrubbed personal data, are raised as
  issues, fixed, and, where personal data or secrets were exposed, handled under
  the security disclosure process.

## Ownership and Review

- The maintainers responsible for reliability and security own this policy and
  review it on a regular cadence.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This policy succeeds when the DSN and related tokens are never exposed, error
events contain no personal data, captured data is deleted on schedule, and the
rules for all three are explicit and versioned.
