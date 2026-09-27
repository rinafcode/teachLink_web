# Code of Conduct Reporting Process

## Purpose

This document defines how a possible breach of the TeachLink Web
Code of Conduct is reported, how quickly the project responds, and
how the reporter's information is protected. It gives anyone who
experiences or witnesses unacceptable behavior a clear, versioned,
and safe route to the people who can act on it.

## Scope

This process applies to reports of behavior that may breach
`Governance/CODE_OF_CONDUCT.md` in any space that document covers.

It does not cover vulnerability reports, which follow
`Governance/SECURITY_POLICY.md`, nor technical review disputes,
which follow `Governance/processes/TRIAGE.md`. What happens after a
report is confirmed is set out in `Governance/COC_ENFORCEMENT.md`.

## Reporting Channel

Reports are made privately. A conduct report must not be filed as a
public issue, pull request, or discussion.

1. **Preferred: email the conduct contact.** Send the report to the
   conduct contact for the current quarter at the email address
   published on their GitHub profile, with the subject
   `Conduct report for teachLink_web`.
2. **Alternative: contact any maintainer privately.** If the conduct
   contact is involved in the matter or cannot be reached, send the
   report privately to any other maintainer listed in
   `Governance/roles/MAINTAINER.md`.
3. **Bootstrap fallback: ask for a private channel.** If no private
   contact is reachable, open a public issue titled
   `Conduct contact request` that contains no details of the
   incident. A maintainer replies with a private route.

A report should include, where available:

- What happened, and where and when it happened.
- Who was involved, including any witnesses.
- Links or screenshots of the behavior.
- Whether the behavior is ongoing, and any immediate safety concern.

A report may be made anonymously or under a pseudonym, and a partial
report is always accepted. Anyone in immediate danger should contact
local emergency services first.

## Response Timeline

| Step | Deadline |
| --- | --- |
| Acknowledgement of the report | 2 business days |
| Initial assessment and scope decision shared with reporter | 5 business days |
| Progress update while the report is open | every 7 calendar days |
| Resolution or a stated reason for more time | 30 calendar days |

- An urgent safety concern, such as a threat of violence or ongoing
  harassment, receives immediate interim action, such as hiding
  content or pausing a participant, within 24 hours.
- If a deadline cannot be met, the reporter is told before it passes,
  with the reason and a new date.
- The reporter is told the outcome, subject to the privacy of the
  other people involved.

## Confidentiality

- **The reporter's identity is kept confidential.** It is shared only
  with the maintainers handling the report, and never with the
  reported person without the reporter's consent.
- **Report details are shared on a need-to-know basis.** Only the
  maintainers handling the report see its contents.
- **Conflicts of interest are declared.** A maintainer involved in
  the matter, or with a personal stake, steps aside under
  `Governance/policies/CONFLICT_OF_INTEREST.md` and does not see the
  report.
- **Records are kept private.** Reports and decisions are stored in
  the private conduct record, retained only as long as needed, and
  are not published without the consent of all affected parties.
- **Retaliation is prohibited.** Retaliating against anyone who
  reports in good faith is itself a Code of Conduct violation.

Confidentiality may be limited only where disclosure is required by
law or needed to prevent imminent harm to a person, and the reporter
is told when that happens.

## Ownership and Review

- Maintainers own this process and are accountable for meeting its
  deadlines, as set out in `Governance/roles/MAINTAINER.md`.
- The conduct contact for the current quarter is a designated
  maintainer and is recorded in the quarterly review.
- Changes to this process are proposed in a pull request that
  touches only the Governance/ folder.
- This governance document is versioned with the repository; it
  describes the process the project actually follows.

## Success

This process succeeds when every report is acknowledged within the
committed window, when reporters trust that their identity is
protected, and when no one is harmed for speaking up.

## Regression Tests

Coverage is provided by `Governance/COC_REPORTING.test.ts`, which
pins the reporting guarantees in this document.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-27 | Initial version. | TeachLink maintainers |
