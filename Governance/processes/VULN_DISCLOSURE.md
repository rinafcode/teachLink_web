# Vulnerability Disclosure Process

## Purpose

`Governance/SECURITY_POLICY.md` tells a reporter where to send a vulnerability
and what response to expect. This process covers what happens next: how a report
is received and handled in private, the steps it moves through, who owns each
step, and the timeline that governs when the public learns about it. It exists so
that a report cannot sit unanswered, cannot leak through a branch or a pull
request, and cannot stay under embargo forever.

## Scope

This process applies to every vulnerability report concerning the TeachLink Web
client in the `rinafcode/teachLink_web` repository, however it arrives: through
the private channel, by direct message to a maintainer, or as a public issue
that a triager redirected. It covers a report from the moment it is received
until the public advisory is published and the follow-up work is tracked.

It does not cover the security review of a pull request, the dependency audit
policy in `CONTRIBUTING.md`, or defects in the separate `teachLink_backend`
service or in third-party services, which are reported to whoever operates them.

## The Private Reporting Channel

A vulnerability is reported privately, and never described in a public issue, a
pull request, a discussion, a commit message, or a social post before a fix has
shipped. The channel is the same one described in `Governance/SECURITY_POLICY.md`:

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

The first maintainer to receive a report owns it from that moment, whether the
report arrived by private advisory, by email, or through the triage queue
described in `Governance/processes/TRIAGE.md`. Ownership is transferred only by
a message in the private advisory that names the receiver and the reason, so the
reporter is never left with an unknown counterpart.

Encryption on the reporter's side is supported but not required. A reporter who
asks for a response outside the private channel is redirected back into it, and
an offer to accept a report in the clear is granted as a documented exception.

## Handling Steps

Each step has an owner and an exit criterion. A step is not complete because
time passed; it is complete when its exit criterion is recorded in the private
advisory, where the reporter can read it.

### 1. Receive and acknowledge

The receiving maintainer acknowledges the report in the private channel,
restating the affected surface and the reported impact, and names themselves as
the reporter's contact for the duration of the process.

- **Owner:** receiving maintainer.
- **Exit criterion:** acknowledgement sent within 1 business day (24 hours).
- **Timing:** within 1 business day (24 hours) of the report arriving.

### 2. Assess validity

The maintainer reproduces the report, or works through it against the affected
code where reproduction is impractical, and records a verdict: `valid` when the
described behaviour exists, `informative` when it is real but has no security
consequence, or `invalid` with the specific reason. A verdict is never `invalid`
because the reporter has not supplied a working exploit.

- **Owner:** receiving maintainer, escalating to the security contact for a
  second opinion on anything `high` or above.
- **Exit criterion:** a verdict and a one-paragraph rationale are in the
  advisory, and the verdict has been sent to the reporter.
- **Timing:** within 3 business days (72 hours) of the acknowledgement.

### 3. Assign severity and check scope

Severity is one of `critical`, `high`, `moderate`, or `low`, using the scale in
`Governance/SECURITY_POLICY.md`, and the scale is the one the dependency audit
reports. The maintainer records which release lines are affected, following the
supported-versions table in that policy, and whether the defect crosses the
boundary to `teachLink_backend`. A report that cannot be classified is assessed
as `high` until it can be.

- **Owner:** security contact for the current quarter.
- **Exit criterion:** a severity, the affected lines, and the fix target are
  recorded and communicated to the reporter.
- **Timing:** with the assessment in step 2.

### 4. Agree the fix plan and target date

The maintainer proposes a fix, a target date drawn from the response commitment
below, and the lines the fix will ship on, and asks the reporter to confirm that
the plan meets their needs, including any deadline they are under. A disagreement
about severity or timing is recorded rather than smoothed over.

- **Owner:** security contact, with the reporter.
- **Exit criterion:** the target date and embargo are agreed in the advisory.

### 5. Implement under embargo

The fix is developed on a branch that does not reference the advisory, the
private vulnerability, or the reporter in its name, its branch name, or its
commit messages. The pull request is opened with a neutral title and a
description that explains the change in terms of the behaviour it corrects. A
`critical` or `high` report uses the expedited review path in
`Governance/processes/HOTFIX.md`; every other report uses the normal review
path. A second maintainer reviews every security fix, and the second reviewer is
never the sole person who knew about the vulnerability beforehand where the
project has more than two maintainers to choose from.

- **Owner:** the implementer, which may be a contributor, paired with a
  maintainer.
- **Exit criterion:** a reviewed, merged fix, or a documented decision not to
  fix, in both cases recorded in the advisory.

### 6. Release and notify

The fix is released, the reporter is told on the day it ships, and the reporter
is asked to verify the fix against the affected build. The advisory stays
private until the embargo is lifted, and the reporter is reminded that the public
advisory will follow.

- **Owner:** security contact.
- **Exit criterion:** the fix is in a release, and the reporter has been
  notified and asked to retest.

### 7. Publish the advisory

The embargo is lifted and a public GitHub Security Advisory is published in the
repository, naming the severity, the affected release lines, the fixed build, and
the mitigation for anyone still on an older line. The reporter is credited by
name or handle unless they ask otherwise, and the advisory links back to the
private advisory without exposing its contents. If the report is one the project
will not fix, the advisory says so, states why, and states the workaround.

- **Owner:** security contact.
- **Exit criterion:** the public advisory is published and the private advisory
  is closed with a link to it.

### 8. Follow up

The root cause is recorded, and any change that would have caught the defect
earlier — a test, a check, a lint rule, a CI gate, or a doc correction — is filed
as a tracked issue and closed. Where a release slipped or a deadline was missed,
that is stated plainly in the advisory or in the release notes rather than left
for a reader to infer.

- **Owner:** maintainer who owned the report.
- **Exit criterion:** follow-up issues are filed and the post-incident note is
  published.

## Response and Fix Targets

These are the same commitments published in `Governance/SECURITY_POLICY.md`.

| Commitment | Deadline |
| --- | --- |
| Acknowledgement by a maintainer, as a first human response in the private channel | 1 business day (24 hours) |
| Initial assessment: `valid`, `informative`, or `invalid`, with a severity of `critical`, `high`, `moderate`, or `low` | 3 business days (72 hours) after the acknowledgement |
| Progress update while the report is still open, with the current state and the next step | every 5 business days |
| Mitigation in place for a `critical` report | 72 hours from validation |
| Fix released for a `high` report | 7 calendar days from validation |
| Fix released for a `moderate` report | 30 calendar days from validation |
| Fix released for a `low` report | the next scheduled release, and no later than 90 calendar days from validation |

Fix targets run from validation, not from the first report, because a report that
cannot be reproduced yet has no fix to ship. A target that cannot be met is
renegotiated with the reporter before it passes, never after.

## Coordinated Disclosure Timeline

The embargo is the interval between validation and publication. Its default term
is 90 calendar days from validation, or until the fix is released, whichever
comes first.

- **Day 0.** Validation. The embargo starts, its end date is written into the
  advisory, and the reporter is told the date.
- **Before the fix ships.** No public detail. No branch, pull request, issue,
  commit message, changelog entry, or social post reveals the defect or the
  reporter. The 5-business-day progress updates are the only outward signal.
- **At the embargo end date, or when the fix ships.** If the fix shipped, the
  advisory is published and the embargo ends. If it did not, the embargo is
  renegotiated in writing with a new date, or the report is closed as an
  accepted risk with the reasoning recorded and the reporter told privately
  before anything is published.
- **Extensions.** A reporter may ask for up to 14 additional calendar days. The
  project may grant an extension when there is real progress and a named date,
  and may not grant one repeatedly to avoid starting the work.
- **Disclosure without a fix.** The embargo is lifted early, and the defect is
  published even if no fix exists, in exactly three cases: the reporter agrees in
  writing; the vulnerability is being exploited in the wild, in which case it is
  treated as `critical` and the 72-hour mitigation target applies; or a legal or
  regulatory obligation requires disclosure, in which case the obligation and
  its scope are described in the advisory.
- **Scope of the embargo.** It covers the project and its maintainers. A
  reporter who wants an earlier publication, or a third party who learns of the
  defect from another source, is told to raise it with the security contact
  rather than publish unilaterally.

The mechanics of requesting, extending, and lifting an embargo are set out in the
embargo policy at `Governance/policies/EMBARGO.md`, and the publication step
follows the coordinated disclosure process at
`Governance/processes/COORDINATED_DISCLOSURE.md`. Where those documents add
requirements to this timeline, they tighten it; the timings here are the
minimums, not the ceiling. Before they exist, the terms in this section govern.

## Reports That Are Not Vulnerabilities

- **Informative.** Real behaviour with no security consequence, such as a missing
  hardening header with no exploitation path. It is assessed and credited, filed
  as an ordinary issue if it is worth fixing, and closed in the advisory.
- **Invalid.** The described behaviour does not exist, or the report targets a
  service the project does not operate. The verdict is sent with the specific
  reason, and the reporter is invited to respond once.
- **Out of scope.** Automated scanner output with no demonstrated impact, issues
  in `teachLink_backend` or a third party, and social engineering or physical
  attacks. The verdict names the right recipient where there is one, which is
  more useful to the reporter than a bare refusal.
- **Abuse and good faith.** A report that is used to attack the service, to
  access another user's data, or to extort the project is closed immediately, the
  facts are recorded, and the conduct expectations in the project's code of
  conduct apply. A report that is careless but good faith is treated as good
  faith: it is assessed on the same deadlines as any other report.

## Ownership and Exceptions

- Maintainers own this process, are the only people with access to a private
  advisory, and are accountable for the timelines above, as set out in
  `Governance/roles/MAINTAINER.md`. The security contact for the current quarter
  is a single point of contact for the reporter and the owner of the advisory.
- The implementer of a fix may be a contributor; the maintainer who validated
  the report remains responsible for the report until the advisory is published.
- **Exceptions.** A maintainer may act before every step is complete when a
  report is being exploited, recording the reason in the advisory afterwards, as
  the decision-authority rules in `Governance/roles/MAINTAINER.md` allow. A
  deadline may be shortened by the project at any time; it may be extended only
  with the reporter's agreement. A report the project will not fix is closed as
  an accepted risk, with the reasoning recorded, the reporter told privately, and
  the embargo lifted on the agreed date.
- Nothing in this process prevents a reporter from disclosing a defect. A
  reporter who decides to publish early is asked to say so privately first, so
  the project can shorten its own response rather than be surprised by it.
- Changes to this process are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This process succeeds when every report is acknowledged within one business day
and never goes quiet for five, when no `critical` or `high` report ships a fix
later than its target date without the reporter knowing in advance, when every
published advisory credits a reporter who feels the process was fair, and when
the quarterly review can state how many reports arrived, how they were handled,
and what changed as a result.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | DevMuhdishaq (@DevMuhdishaq) |
