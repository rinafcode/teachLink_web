# Coordinated Disclosure Process

## Purpose

This process defines how TeachLink Web handles a vulnerability report from the
moment it arrives to the moment it becomes public: who talks to the reporter,
what the project owes them while a fix is prepared, when the disclosure is
published, and how the reporter is credited.

A report handled this way protects users, because the fix and a description
of the problem reach them together, and it protects the reporter, because the
project's speed and tone are not a surprise. The process exists so that neither
party has to guess what the other will do next.

The companion documents in this area are authored in parallel: the reporting
channel and triage expectations are defined in
`Governance/processes/VULN_DISCLOSURE.md`, supported versions and reporting
contacts are defined in `Governance/SECURITY_POLICY.md`, the embargo terms
themselves are defined in `Governance/policies/EMBARGO.md`, and the advisory
template is defined in `Governance/templates/ADVISORY_TEMPLATE.md`. The
response windows below are this process's own floor, and they apply whether or
not those documents say anything on the point.

## Scope

This process applies to any report of a weakness in this repository or in the
web client it deploys: application code, client-side data handling and
storage, authentication and session logic, dependencies shipped to the
browser, build and deployment configuration, and documentation that leads
users into a security mistake. It also applies to non-security incidents the
project coordinates with the person who found them, such as exposure of
personal data.

It does not cover feature requests, ordinary bugs already visible in public,
spam or abuse reports, and reports about the `teachLink_backend` service or
the Starknet contracts, which are handed to the team that owns them with the
reporter's consent. It does not apply to a reporter who asks for the problem
to be published immediately: that is public disclosure, and this process
applies from the first reply onward.

## Roles in a Disclosure

- **Reporter.** The person who found and reported the problem. No affiliation,
  prior contribution, or financial arrangement is required.
- **Disclosure coordinator.** A Maintainer named on the report within one
  business day of acknowledgement, who is the single point of contact for the
  reporter. The Lead Maintainer coordinates severe issues and any case of
  conflict of interest, as `Governance/roles/MAINTAINER.md` requires.
- **Implementer and reviewer.** The maintainers who write and approve the
  fix. The reviewer of a security fix is not its implementer.
- **Publisher.** The coordinator, or a maintainer they name, who publishes the
  advisory once the release carrying the fix is in production.

## Coordination Steps With the Reporter

- **Acknowledge within one business day.** The coordinator replies on the
  channel the report arrived on, thanks the reporter, confirms the report has
  not been missed, and gives the date of the next update. A longer silence is
  a failure of this process.
- **Confirm scope within three business days.** The coordinator states whether
  the report is accepted as a vulnerability, what is affected, and what
  severity is provisionally assigned.
- **Agree the embargo in writing.** The default embargo and the planned
  publication date are stated in the reply and accepted by the reporter.
  Silence is not agreement to a date, and the project does not publish inside
  a window the reporter has not acknowledged.
- **Keep the reporter in the loop.** The reporter receives a status update at
  least every seven days until publication, including when the answer is "no
  change yet". No reporter waits without news.
- **Ask the reporter to validate the fix.** Where it is safe to do so, a fix
  branch or a deployed preview is shared under embargo so the reporter can
  confirm that the issue is resolved and the fix introduces no regression.
- **Show the reporter the advisory before publication.** The draft is shared at
  least 48 hours before publication and the reporter's factual corrections are
  made. The project's judgement is not up for vote, but the reporter's account
  of what happened is their call.
- **Let the reporter withdraw.** A reporter may publish, speak, or change
  their mind at any time, including on the day of publication. The project
  says this in the first reply and does not treat an early publication as a
  breach of trust. A reporter may also close the report or let it lapse, and
  the project records that as the reporter's decision.

## Public-Disclosure Timing

- **Default embargo: 90 days from acknowledgement.** The planned publication
  date is the acknowledgement date plus 90 days, stated as a date rather than
  as a duration alone.
- **Fix shipped: publish within 7 days.** Once the release carrying the fix is
  in production and verified, the advisory is published within 7 days, so the
  advisory, the release notes and the deployed fix reach users in the same
  week.
- **Publish earlier, without waiting for the deadline,** when any of the
  following holds: the vulnerability is being exploited, or credible evidence
  shows an attacker has the details; the fix or the details are already public
  anywhere; the reporter has not replied to two reminders over 14 days and
  the fix is ready; an upstream project or registry has published its own
  advisory; or a legal or regulatory deadline requires publication. The
  coordinator records which trigger applied.
- **Extend only in writing, up to 180 days total.** A longer window is
  granted when a mitigation is not yet complete, when a third-party dependency
  must be fixed upstream first, or when the reporter asks for more time. The
  extension, the reason and the new date are written to the reporter and to
  the report record. Silence never extends an embargo.
- **Never publish before the fix is in production,** except when an early
  publication trigger applies. A report that is a real risk without a fix
  available is published with the mitigation and the residual risk stated
  plainly, not withheld.
- **A severe issue ships under the expedited path.** When users are being
  harmed at the time of the report, the fix is released as a security release
  outside the schedule in `Governance/processes/RELEASE_CADENCE.md`, following
  `Governance/processes/HOTFIX.md`, and the advisory is published within 7
  days of the release.

## Credit Policy

- **Credit is the default.** A reporter is credited in the published advisory,
  in the release notes for the version carrying the fix, and in `CREDITS.md`,
  which is updated with each major release as `Governance/policies/CREDITS.md`
  describes.
- **The reporter chooses the form.** The default is name and handle, for
  example `Priya Raman (@priyaraman)`. A reporter may ask for a different
  name, an affiliation, or full anonymity published as "an anonymous
  reporter". The project's default never overrides that request.
- **Affiliation is a choice, not an inference.** A reporter may be credited as
  a named researcher at their organisation or at no organisation at all. The
  project does not publish an employer, a client, or a country without the
  reporter's written agreement.
- **Credit is not conditional on secrecy, and not on good behaviour.** A report
  that was public before the project learned of it is credited on the same
  terms, and a reporter who misses a deadline or is uncooperative is still
  credited. The project's disagreement is expressed in the advisory, not in
  the byline.
- **Consent before naming.** No report, thread, or advisory naming the
  reporter is made public without their written consent to that wording. Where
  a finding is first reported publicly by a third party, the project credits
  the public reporter of the finding.
- **The project does not claim sole authorship.** Where the reporter
  contributed material analysis or a reproduction, the advisory credits that
  contribution specifically.
- **No payment, bounty, or exclusivity.** The project offers no fee, bounty
  or promise of future work, and asks for no exclusivity: a reporter is free
  to disclose elsewhere, and the project records no complaint when they do.
  Security research is recognised as a contribution under
  `Governance/policies/CREDITS.md` and `Governance/RECOGNITION.md`, and taking
  part in it never affects a contributor's standing.

## Reports That Are Already Public

- A report that is already public starts at the publication step. The
  coordinator acknowledges the reporter the same day, states whether the
  project agrees with the analysis, and works to a fix on the security
  release path.
- Where the report is inaccurate, the project responds in public, factually
  and without disparaging the reporter, and the advisory states the project's
  position.
- Where the report is accurate and severe, it is treated as a live incident
  regardless of tone, and the release ships under
  `Governance/processes/HOTFIX.md` with the sign-off requirements in
  `Governance/processes/RELEASE_SIGNOFF.md`.

## Out of Scope and Declined Reports

- A report about something this repository does not own, such as the backend
  service or the contracts, is acknowledged within one business day, thanked,
  and forwarded to the owning team with the reporter's consent.
- A report that is not a weakness, such as a missing header, a version
  banner, or a feature request, is answered within five business days with
  the reasoning, is not published as an advisory, and is not credited as a
  security report.
- Automated scanner output with no demonstrated impact is triaged and closed
  with an explanation rather than treated as a coordinated disclosure.
- Reports about people, conduct, or content are handled under the project's
  conduct governance and do not run through this process.

## Records and Communication

- Each disclosure has a restricted record: the report, the coordinator, the
  severity, the agreed embargo and publication date, the status updates sent,
  the pull requests, the release, and the published advisory. The record is
  visible to maintainers only and is kept for the life of the project.
- Nothing about an unembargoed disclosure is posted to a public issue, a
  pull request, a commit message, or a release note. Work in progress is
  referenced by a neutral reference until the advisory is published.
- The advisory is published as a GitHub Security Advisory on this repository,
  carries the credit decided with the reporter, and points at the release
  that contains the fix. Its structure is defined in
  `Governance/templates/ADVISORY_TEMPLATE.md`.
- Maintainers keep this process honest: a missed response window, a broken
  embargo, or a missing credit is recorded and reviewed, and the process is
  adjusted when the same failure happens twice.

## Ownership and Exceptions

- Maintainers own this process. The Lead Maintainer may shorten an embargo or
  publish without the reporter's agreement when an early publication trigger
  applies, and records the reason on the report and in the advisory.
- A maintainer with a conflict of interest in a reporter or an organisation
  recuses from the coordination and discloses the recusal, following
  `Governance/policies/CONFLICT_OF_INTEREST.md`.
- The Treasurer is consulted where disclosure affects a bounty, a paid audit,
  or an external commitment, as set out in `Governance/roles/TREASURER.md`.
- Changes to this process are proposed in a pull request that touches only
  the `Governance/` folder and require a second maintainer review.

## Success

This process succeeds when every reporter hears back within a day, when fixes
ship and advisories are published on the schedule above, when no embargo is
broken without a recorded reason, when reporters are credited the way they
asked to be credited, and when a reporter would bring the next issue to this
project without hesitation.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | akargi (@akargi) |
