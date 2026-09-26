# Security Response Team Charter

## Purpose

The Security Response Team coordinates the assessment and handling of security
reports and incidents affecting TeachLink Web. It works to reduce risk to users
and the service while preserving confidentiality and communicating responsibly.

## Membership

- The team consists of all active TeachLink Web maintainers with repository
  write or administrator access, excluding bot accounts.
- Maintainers may invite contributors with relevant security expertise to assist
  with a specific incident. The incident lead is responsible for limiting access
  to sensitive information to people who need it.
- The maintainers' current repository access list is the authoritative team
  roster. A separate public list of personal contact details is not maintained.

## Responsibilities

The team is responsible for:

- Receiving and privately triaging vulnerability reports and suspected security
  incidents.
- Assessing severity, affected systems, user impact, and whether an incident is
  ongoing.
- Coordinating containment, remediation, verification, and recovery with the
  relevant maintainers and service owners.
- Preserving relevant logs and other evidence while limiting exposure of
  sensitive data.
- Coordinating an appropriate disclosure timeline, user or stakeholder
  notification, and any security advisory. Public disclosure must follow the
  applicable disclosure and embargo requirements.
- Recording decisions and maintaining a post-incident review with corrective
  actions after significant incidents.

## On-Call Rotation

- The active maintainers share a weekly rotation. Each shift begins Monday at
  00:00 UTC and ends the following Monday at 00:00 UTC.
- Maintainers take turns as primary on-call in alphabetical order by GitHub
  username. The next maintainer in that order is the backup. After each shift,
  the primary moves to the end of the order; the backup becomes the next
  primary.
- The outgoing primary hands open reports and incident context to the incoming
  primary at the shift change. The maintainers publish the current primary and
  backup assignment in their private coordination channel and keep it current
  when the rotation changes.
- A maintainer who cannot cover a shift arranges a swap with another team member
  and updates the assignment before the shift starts. If the primary is
  unavailable, the backup takes over; if both are unavailable, any active
  maintainer may lead until coverage is restored.
- The primary coordinates the response and keeps the backup informed. The
  backup supports triage and may take over when needed. Both should acknowledge
  incoming reports promptly and escalate urgent or unresolved issues to the
  rest of the team.

## Reporting and Confidentiality

Use the repository's private vulnerability reporting channel when available. If
it is unavailable, contact a maintainer privately. Do not post suspected
vulnerabilities, exploit details, credentials, or personal data in a public
issue. The team shares report details only with people who need them to respond.

## Governance

Maintainers own this charter and the on-call rotation. Changes to this charter
are proposed in a pull request that touches only the `Governance/` folder.
