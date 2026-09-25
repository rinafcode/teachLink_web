# Security Policy

## Purpose

This policy states how a security vulnerability in TeachLink Web is reported, who
is responsible for responding, and what a reporter can expect from the project in
return. It exists so that someone who finds a serious defect can reach the people
who can fix it without publishing it first, and so that the project's security
commitments are checkable rather than implied.

## Scope

This policy covers the TeachLink Web client in the `rinafcode/teachLink_web`
repository: its application code, its build and CI configuration, its
dependencies as they are vendored, and its documentation where a reader could be
misled into an unsafe action. It covers defects that would let an attacker read
or alter data, escalate privilege, or impersonate a user of the web client.

It does not cover the separate `teachLink_backend` service, the Stellar network,
wallet providers, or any third-party service. A defect in one of those is
reported to whoever operates it; if the defect is in how this client uses that
service, that part is in scope and is handled here.

## Supported Versions

The repository has not yet cut a tagged release, so a table of released version
numbers would describe a history that does not exist. Support is therefore
expressed in release lines, and this section is rewritten in terms of concrete
version numbers once the first release is published.

| Line | Supported | Security fixes |
| --- | --- | --- |
| Current release line, the tip of `main` | Yes | Yes |
| Previous release line | Yes, for 90 days | Yes, on request |
| Any line older than the previous one | No | No |
| Unreleased commits on `main` | Yes | Yes |

Notes on how to read this table:

- **The current line is the tip of `main`.** Security fixes are made on `main`
  and released from it; `develop` is not separately supported.
- **Until a tagged release exists**, every commit reachable on `main` is the
  supported line, and a report against a build is supported when that build can
  be matched to a commit on `main` or to a published build artifact.
- **The previous line is supported for 90 days** after a new line ships, which
  matches the deprecation notice period for developer-facing interfaces in
  `Governance/policies/DEPRECATION.md`. Fixes for the previous line are applied
  on request and land in the next patch of that line.
- **Anything older is not supported**, and a report against it is still answered
  and still assessed, but the project does not backport a fix to it. A report
  that also reproduces on the current line is treated as a report against the
  current line.
- **Unreleased commits are supported**, because that is where most reports are
  made. A defect that only affects a commit already rewritten on `main` is
  recorded as not affected and closed with the reason.

## Reporting a Vulnerability

Use the private channel. A vulnerability must not be described in a public
issue, a pull request, a discussion, a commit message, or a social post before a
fix has shipped.

1. **Preferred: private vulnerability reporting on the repository.** In
   `rinafcode/teachLink_web`, open the `Security` tab and choose `Report a
   vulnerability`. This creates a private GitHub Security Advisory that only
   maintainers and the reporter can read, and it carries the conversation
   through to resolution. If this option is not yet enabled on the repository,
   a maintainer enables it; the fallback below applies until then.
2. **Fallback: contact a maintainer directly.** Send the report to the security
   contact for the current quarter at the email address published on their
   GitHub profile, with the subject `Security report for teachLink_web`.
3. **Bootstrap fallback: ask for a private channel.** If no maintainer contact
   address is reachable, open a public issue titled `Security contact request`
   that contains no technical detail about any defect. A maintainer replies with
   a private route, and the report continues there. This is the only public issue
   about a security matter that is appropriate, and it carries no vulnerability
   information.

The reporter should include as much of the following as is available, and should
not delay sending a partial report in order to make it complete:

- The affected surface, with the route, component, or configuration involved.
- The impact, and what an attacker gains.
- Reproduction steps, a proof of concept, a request trace, or a failing test.
- The build or commit observed, the browser and platform, and the account role.
- Whether the issue is already being exploited, and any disclosure deadline the
  reporter is under.

A reporter may encrypt a report, may use a pseudonym, and may withhold a
working exploit. Maintainers will work with partial information rather than
pressuring a reporter to send more.

## Response Commitment

These are the project's commitments, and the same deadlines are used in
`Governance/processes/VULN_DISCLOSURE.md`.

| Commitment | Deadline |
| --- | --- |
| Acknowledgement by a maintainer, as a first human response in the private channel | 1 business day (24 hours) |
| Initial assessment: `valid`, `informative`, or `invalid`, with a severity of `critical`, `high`, `moderate`, or `low` | 3 business days (72 hours) after the acknowledgement |
| Progress update while the report is still open, with the current state and the next step | every 5 business days |
| Mitigation in place for a `critical` report | 72 hours from validation |
| Fix released for a `high` report | 7 calendar days from validation |
| Fix released for a `moderate` report | 30 calendar days from validation |
| Fix released for a `low` report | the next scheduled release, and no later than 90 calendar days from validation |

If a deadline cannot be met, the reporter is told before it passes, with the
reason and a new date. A missed deadline without notice is treated as an
incident against this policy and is recorded in the report.

## Severity Scale

The four levels match the levels the project's dependency audit reports, as
configured in `CONTRIBUTING.md`, so that a report and a CI finding are described
the same way.

- **Critical.** Remote code execution, an authentication or session bypass,
  cross-tenant access to another user's data, or a secret in the repository that
  is live. Actively exploited issues at any level are handled as `critical`.
- **High.** A read of restricted data, a stored cross-site scripting issue
  reachable without a special role, a privilege escalation, or a supply-chain
  compromise of a direct dependency.
- **Moderate.** A reflected injection, a denial of service limited to one
  user's session, an access-control gap with no sensitive data behind it, or a
  dependency advisory that the audit reports but does not treat as blocking.
- **Low.** Missing hardening with no demonstrated exploitation path, an
  information leak with no sensitive data, or a documentation defect that
  describes an unsafe default.

A report the project cannot classify is assessed as `high` until it can be, so
that a missing answer never lowers the urgency of a report.

## Disclosure

A report is handled under embargo. The default embargo is 90 calendar days from
validation, or until the fix is released, whichever comes first, and it is
lifted only by agreement with the reporter. The private channel, the triage steps
a report moves through, and the full disclosure timeline are set out in
`Governance/processes/VULN_DISCLOSURE.md`. Once a fix ships, the project
publishes a public advisory, credits the reporter unless they decline, and
records the affected lines and the fixed build.

Fixes for a `critical` or `high` report ship through the expedited path in
`Governance/processes/HOTFIX.md`, and the follow-up work that puts the fix back
into the normal branch and release flow is tracked to completion.

## What the Project Asks Reporters Not to Do

- Do not test against production user accounts, and do not access data belonging
  to anyone but yourself.
- Do not exfiltrate data, run a denial-of-service test, or use a social
  engineering or physical attack.
- Do not publish the defect, or a working exploit for it, before a fix has
  shipped and the embargo has been lifted.
- Do not submit automated scanner output, a missing security header, or a
  speculative finding with no demonstrated path to harm. Ask first; the project
  will confirm whether a finding is in scope and usually will.
- Do not disclose the private advisory URL, which grants access to the
  conversation.

In return, maintainers do not pursue action against good-faith research that
stays inside these limits, credit reporters by name or handle as requested, and
follow the assessment and disclosure timelines above.

## Automatic Reporting

Automated findings reach maintainers without being reported by hand. Dependabot
opens pull requests for dependency updates weekly, and the `security-audit` CI
job runs on every pull request to `main` and `develop` and fails the pipeline on
a `high` or `critical` finding. Both are described in `CONTRIBUTING.md`. A
researcher who wants to know whether a `moderate` or `low` dependency finding has
been considered and dismissed may report it through the private channel and will
receive an assessment.

## Ownership and Exceptions

- Maintainers own this policy, are the only people who may see a private report,
  and are accountable for meeting the deadlines in the response commitment table.
  The role is defined in `Governance/roles/MAINTAINER.md`.
- The security contact for the current quarter is a designated maintainer and the
  reporter's single point of contact. The designation is recorded in the
  quarterly review described in `Governance/processes/TRIAGE.md` and is not
  treated as a permanent assignment.
- Any maintainer who receives a report handles it under
  `Governance/processes/VULN_DISCLOSURE.md` without waiting for a hand-off, and
  passes it to the security contact only after acknowledging the reporter.
- **Exceptions.** A deadline in the response commitment table may be shortened
  by the project, never lengthened without telling the reporter first. A report
  that the project will not fix is closed as `wontfix` with the reasoning, and
  the reporter is told privately before any disclosure. A report of self-harm,
  violence, or an imminent risk to a person is not treated as a vulnerability and
  is redirected to the right kind of help within one business day.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This policy succeeds when every report receives a human response within one
business day, when no fix for a validated `critical` or `high` report takes
longer than the committed window, when reporters are satisfied with how they
were treated, and when the set of reports and their outcomes is small enough to
review honestly in the quarterly review.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | DevMuhdishaq (@DevMuhdishaq) |
