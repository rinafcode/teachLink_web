# Embargo Policy

## Purpose

This policy defines the embargo applied to unreleased security work in TeachLink
Web: how long the embargo lasts, who is allowed to know about a vulnerability
before it is public, and when the embargo may be broken early. It exists so that
fixes can be prepared, reviewed, and shipped before attackers have time to use a
known weakness, without turning that preparation into a leak.

## Scope

This policy applies to every vulnerability, security weakness, and undisclosed
exposure in this repository and in the web client it ships, from the moment a
reporter or a maintainer suspects one until the advisory is public. It covers
fixes, mitigations, pull requests, tests, and advisory drafts. It does not
apply to already public information, to performance issues, or to ordinary bugs
with no security impact, which follow the normal release flow.

Reporting is handled by the vulnerability disclosure process, and the timing of
the public announcement is handled by the coordinated disclosure process. Those
details are defined in `Governance/processes/VULN_DISCLOSURE.md` and
`Governance/processes/COORDINATED_DISCLOSURE.md`; this policy is self-contained
and takes effect whether or not either document has been adopted yet.

## Embargo Duration

- The default embargo is **90 days** for high and critical severity findings.
- Moderate severity findings carry a default embargo of **60 days**, and low
  severity findings a default embargo of **30 days**.
- The embargo starts on the earlier of the date the advisory draft is created or
  the date the security contact accepts the report, and never before a reporter
  has agreed to the disclosure date.
- The public disclosure date is set explicitly at the start of the embargo, and
  the embargo may not be extended past it more than **three** times.
- An extension is granted in increments of **30 days** or less, is recorded in
  the embargo tracking issue with its reasoning, and requires the security
  contact's agreement. A total embargo beyond **180 days** requires a written
  justification approved by two maintainers.
- The embargo is lifted on the agreed disclosure date even if the fix is not
  finished. A delayed fix is disclosed with the mitigation, and the fix ships
  under the expedited path in `Governance/processes/HOTFIX.md` where severity
  warrants.
- An embargo on a dependency or third-party component follows the upstream
  project's own schedule where one exists, and is never shorter than the
  upstream embargo.

## Who Is on the Embargo List

The embargo list is kept in the private tracking issue for the vulnerability. It
is limited to people who have a working need to know:

- **The reporter**, once they have agreed to the disclosure date.
- **The fix author** and any contributor who writes or reviews the fix.
- **The security contact** for the repository.
- **Maintainers** who review or merge the fix, and who coordinate the release.
- **Upstream maintainers** whose component must be patched, where no public
  information is required to act.
- **Named third parties** such as a hosting provider or an infrastructure
  operator, listed by name and organisation with a stated reason.

The following are not on the embargo list and are never given advance notice:
the wider maintainer group without a working need to know, contributors at
large, community channels, and the project's public channels. Broad internal
announcements do not take place while an embargo is active. Fix branches are
private, embargoed work is not referenced in public issues, and no advisory
detail appears in a commit message, branch name, or pull request title on a
public branch. The list is reviewed at every status update and people are
removed as soon as their involvement ends.

## Early-Disclosure Exceptions

The embargo is broken early, and the advisory published without further delay,
when any of the following applies:

- **Active exploitation or imminent harm.** Evidence that the weakness is being
  exploited, or that waiting would expose users to further harm. Disclose
  immediately; do not wait for a fix or for the next review.
- **A legal or regulatory obligation.** A court order, regulator request, or
  statutory duty compels disclosure. Disclose no further than the obligation
  requires, and tell the security contact the same day.
- **The reporter discloses first.** If the reporter publishes, or a third party
  publishes, the embargo is treated as void and the project publishes the
  advisory within **24 hours**.
- **The work is already public.** A fix, advisory draft, or vulnerability
  detail appears in a public commit, branch, fork, release, or log. Notify the
  embargo list immediately and publish the advisory within **24 hours**.
- **An upstream fix is public.** If the vulnerable dependency has already
  shipped a public fix or advisory, the embargo on this project is dropped.
- **The embargo can no longer be held.** A member of the embargo list has
  leaked the details, or the project can no longer rely on the list. Maintainers
  assess the remaining exposure and publish rather than risk a longer embargo
  that has already failed.

In every case the security contact records the exception, the date, and the
reason on the tracking issue, and a summary of the response is published with
the advisory.

## Lifting the Embargo

- The advisory is published on the agreed disclosure date, the fix is merged and
  released under the normal or expedited path, and the embargo tracking issue is
  closed with a short factual summary.
- The embargo list is retained for **12 months** so the response can be audited,
  then deleted. Nothing identifying a reporter is retained beyond that period.
- Follow-up work (hardening, detection, additional affected versions) is filed
  as tracked issues, following
  `Governance/policies/DEPRECATION.md` where any public surface changes.

## Ownership and Enforcement

- **Maintainers** own this policy, staff the security contact role, and decide
  the disclosure date and any exception. Maintainer authority is bounded as
  described in `Governance/roles/MAINTAINER.md`.
- **The security contact** maintains the embargo list, sets and extends the
  embargo, and is the single point of contact for reporters and for maintainers
  who need to check whether something is embargoed.
- **Contributors** who work on an embargoed fix follow this policy, and may ask
  the security contact whether a topic is embargoed before discussing it.
- **A leak is handled as an incident, not as a fault.** When the embargo is
  broken unintentionally, maintainers move to public disclosure as soon as
  possible, document what happened and what is being changed, and review the
  process. People who disclose in good faith are not penalised.
- **Exceptions** to the durations above are granted only by the security
  contact, are recorded with reasoning, and are reported to the maintainers in
  the same update that lifts the embargo.

## Success

This policy succeeds when fixes reach users before attackers reach them, when
nobody learns about a vulnerability by accident, when a leak produces a fast and
honest publication rather than a scramble, and when reporters and contributors
can tell without asking whether the work they are looking at is embargoed.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | Aliyu Ibrahim (@ykargeee-bit) |
