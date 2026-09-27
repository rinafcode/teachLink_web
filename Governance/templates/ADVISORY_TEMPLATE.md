# Security Advisory Template

## Purpose

This template is the fillable form for a TeachLink Web security advisory. It
fixes the sections every published advisory carries, the severity and CVSS
fields so ratings are comparable across advisories, and the remediation guidance
field that tells an affected reader exactly what to do about it.

Security reports handled by this project are not a stream of ad-hoc issue
comments. A confirmed vulnerability is written up once, in this shape, reviewed,
and then published in a form people can search, subscribe to, and act on. An
advisory that omits a field cannot be published; the fields are the checklist.

## Scope

This template applies to every security advisory the project publishes for
TeachLink Web: vulnerabilities in the web client's own code, in the
dependencies it ships, in its build and runtime configuration, and in the
architectural choices behind all three. It covers the structure of the written
advisory, the severity rating, the remediation guidance, and where the advisory
is published.

It does not cover how a report is received, triaged, embargoed, or credited,
which is set out in the process in `Governance/processes/VULN_DISCLOSURE.md`,
and it does not apply to findings in the separate `teachLink_backend` service,
which are published by the team that owns it. It does not change the
`security-audit` gate described in `CONTRIBUTING.md`, which blocks merges for
high and critical dependency findings on every pull request; that gate is how
known dependency problems are prevented from reaching an advisory in the first
place.

## How to Use This Template

- Copy this file into a draft advisory, replace every `<placeholder>` with real
  content, and delete every `*Guidance:*` line before publication.
- Fields are either **Required** or **Optional**. A required field that cannot
  be filled in, because the information is not known, is written `TBD` with the
  reason and the date it is expected; it is never left as a placeholder.
- Use `Not affected` rather than an empty section when a section genuinely does
  not apply, so a reader can tell the difference between "no" and "not checked".
- Keep the order of the sections. Consumers parse advisories by section, and
  the CVSS vector and remediation sections are expected where they are.
- Drafts are written in a private draft GitHub Security Advisory or a private
  issue, never on a public issue, until the disclosure date below. The handling
  rules, embargo windows, and credit decisions come from the process in
  `Governance/processes/VULN_DISCLOSURE.md`; this template records the outcome
  of that process rather than replacing it.

## Advisory Identification

- **Advisory ID:** `<TLWEB-YYYY-NNN>`
  *Guidance:* Required. Sequential identifier in the form `TLWEB-` plus the year
  of disclosure plus a three-digit sequence for that year. The ID never changes
  once published, and it is what the fixing release notes, the fixing commit,
  and any follow-up discussion refer to.
- **Title:** `<short, specific title>`
  *Guidance:* Required. One line naming the weakness and the affected surface,
  for example "Server-side request forgery in lesson media proxy". Do not put
  exploit details or user data in the title.
- **Status:** `<draft | in review | published>`
  *Guidance:* Required. Every advisory is drafted as `draft` and only reaches
  `published` once the disclosure date has passed or the fix has shipped.
- **Reported:** `<YYYY-MM-DD>`
  *Guidance:* Required. The date the report reached the project through the
  private channel, not the date this document was written.
- **Advisory type:** `<application | dependency | configuration | design>`
  *Guidance:* Required. `dependency` means the project code is not at fault and
  the fix is a version bump; `design` means the behaviour is intentional and
  the advisory documents the risk and the mitigations.

## Affected Versions

- **Affected versions:** `<range, for example >=4.2.0 <4.5.1>`
  *Guidance:* Required. Use a version range, not a single version. List the
  first affected release and the first release that is not affected.
- **Fixed in:** `<version>`
  *Guidance:* Required. The first release containing the fix. If the fix is not
  yet released at publication time, write `TBD` and name the expected release
  or milestone; do not publish an advisory without either.
- **Not affected:** `<versions and why, for example 4.5.0 introduced the fix>`
  *Guidance:* Optional. State why adjacent versions are safe when a reader is
  likely to ask, such as a version that predates the affected feature.
- **Affected deployments:** `<self-hosted, SaaS, or both>`
  *Guidance:* Required. TeachLink Web is consumed in more than one way; say
  plainly which deployments are affected and which are not.
- **Impact surface:** `<which code paths, routes, or data are reachable>`
  *Guidance:* Required. Name the entry point, such as the route, component, or
  dependency, so a reader can confirm whether their deployment is affected.

## Severity and CVSS

- **Severity:** `<Critical | High | Medium | Low | None>`
  *Guidance:* Required. Taken from the CVSS v3.1 base score bands below. Severity
  and score must agree; a Critical rating with a 6.8 score is rejected at
  review.
- **CVSS version:** `<3.1>`
  *Guidance:* Required. Rate with CVSS v3.1. Record the version explicitly so
  ratings stay comparable when the scheme is updated.
- **CVSS vector:** `<CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N>`
  *Guidance:* Required. The full base metric vector string, copied from the
  calculator and not retyped by hand. Every metric must have a value.
- **CVSS base score:** `<0.0-10.0>`
  *Guidance:* Required. The numeric score produced by the vector above, to one
  decimal place.
- **Temporal metrics:** `<C:/I:/A: and R/E/A, or Not scored>`
  *Guidance:* Optional. Add only if the exploit is in the wild, if a public
  exploit exists, or if remediation is not available. Do not change the base
  score because of a temporal metric.
- **Scoring rationale:** `<two or three sentences on why this score and not the
  adjacent band>`
  *Guidance:* Required. Name the deciding metric, such as whether user
  interaction is required, whether privileges are needed, or whether
  availability is affected. This is the part reviewers argue about, so it is
  written down.

Score bands from CVSS v3.1, used to set the severity rating:

| Score | Severity | Meaning for a reader |
| --- | --- | --- |
| 9.0 - 10.0 | Critical | Act now; exploitation is likely or impact is severe |
| 7.0 - 8.9 | High | Fix in the current cycle, ahead of planned work |
| 4.0 - 6.9 | Medium | Fix in a planned cycle, with the workaround applied meanwhile |
| 0.1 - 3.9 | Low | Fix when convenient; the workaround is usually sufficient |
| 0.0 | None | Informational; no vulnerability |

## Description

### Summary

`<Two or three sentences: what the weakness is, where it lives, and what an
attacker gains. Written so a reader who does not read further still knows
whether they are affected.>`

*Guidance:* Required. No exploit code, no real user data, and no detail that
makes the weakness trivially automatable against an unpatched deployment while
the advisory is still embargoed.

### Impact

`<What an attacker can read, change, or deny: the data classes involved, the
actions available, whether user interaction is required, and what the blast
radius is for a single user versus all users.>`

*Guidance:* Required. Describe impact in terms of the affected deployment, not
in theoretical terms. State explicitly what is **not** affected when a reader
could reasonably assume otherwise.

### Reproduction Steps

`<Numbered steps that reproduce the issue, written for a reader running a
known-good version.>`

1. `<Step one: the starting state, version, and configuration.>`
2. `<Step two: the action or input that triggers the behaviour.>`
3. `<Step three: the observable result, including the expected result.>`

*Guidance:* Required. Steps must be complete enough to reproduce on a fresh
setup, and must not require production data, real credentials, or a third-party
service. A proof-of-concept attachment is published only with the reporter's
consent.

## Remediation and Fix Guidance

- **Remediation summary:** `<one sentence: what the fix does>`
  *Guidance:* Required. The reader should be able to tell from this sentence
  whether the fix closes the issue or only narrows it.
- **Required action:** `<upgrade to version X | apply configuration Y | apply
  the patch at commit Z>`
  *Guidance:* Required. The concrete action. If upgrading is not the only
  option, say which option applies to which deployment.
- **Fix location:** `<pull request, commit, and release link>`
  *Guidance:* Required. Links to the change that closes the issue, so the fix
  can be reviewed and backported by operators who run their own builds.
- **Fix completeness:** `<complete | partial>`
  *Guidance:* Required. A partial fix states what remains open, why it could not
  be closed now, and which release closes it. Partial fixes are published with
  the open part tracked by an issue.
- **Breaking changes in the fix:** `<none | describe>`
  *Guidance:* Required. Any behaviour change an operator must act on, including
  configuration that must be added, values that must be rotated, or data that
  must be reissued. Write `none` when there are none.
- **Detection:** `<how an operator can tell whether they were affected, such as
  a log line, a metric, or an audit query>`
  *Guidance:* Optional but expected for Medium and above. If there is no way to
  detect exploitation, say so plainly.

## Workarounds

- **Workaround:** `<the mitigation a reader can apply before the fix exists>`
  *Guidance:* Optional. If no workaround is possible, write `No workaround` and
  say so in the summary as well. A workaround is a real, tested mitigation
  available in a released version, not a configuration guess.
- **Workaround tested in:** `<version the workaround was verified against>`
  *Guidance:* Optional. Required when a workaround is published, so a reader
  knows the mitigation was not theoretical.
- **Temporary measure:** `<an operator-side mitigation, such as restricting a
  route or disabling a feature flag>`
  *Guidance:* Optional. Used when the project cannot ship a code-level
  mitigation before the fix. Name the flag or setting and the downside of using
  it.

## Disclosure and Credit

- **Discoverer:** `<name, or "Reported by an external researcher">`
  *Guidance:* Required. Credit exactly as the reporter asked to be credited.
  Do not add a surname, a handle, or an employer that the reporter did not
  supply.
- **Coordinated disclosure:** `<date the fix shipped or the advisory was
  published>`
  *Guidance:* Required. For a privately reported issue this is the end of the
  embargo agreed under `Governance/processes/VULN_DISCLOSURE.md`; record the
  date it was actually reached.
- **Disclosure date:** `<YYYY-MM-DD>`
  *Guidance:* Required. The date the advisory becomes public. The advisory is
  not published before this date, and the fixing release notes do not link to it
  before this date either.
- **Reporter acknowledgement:** `<whether the reporter reviewed the text before
  publication>`
  *Guidance:* Optional. Record `yes`, `no`, or `declined to review`; a declined
  review is a normal outcome and is not a blocker.
- **CVE:** `<CVE-YYYY-NNNN | Not assigned>`
  *Guidance:* Optional. Filled in when an identifier has been requested or
  assigned. State `Not assigned` rather than leaving the field empty.

## References

- **Fixing pull request:** `<link>`
  *Guidance:* Required. The primary technical reference for the advisory.
- **Fixing commit:** `<link>`
  *Guidance:* Optional. The commit that a reader running a fork can apply.
- **Related issue:** `<link>`
  *Guidance:* Optional. The internal tracking issue, which may be private and
  is never published if it contains unreleased detail.
- **Upstream references:** `<CVE, vendor advisory, or research links>`
  *Guidance:* Optional. Cite upstream advisories, research, or disclosure
  write-ups that informed the assessment.
- **Previous advisories:** `<links>`
  *Guidance:* Optional. Earlier advisories for the same weakness, so a reader
  can see whether a fix was incomplete.

## Publication

A completed advisory is published through the following channels, in this
order:

1. **GitHub Security Advisory.** The advisory is drafted as a private advisory
   for the repository, reviewed by at least one maintainer who did not write
   the draft, and published on the disclosure date. Draft and review happen
   before the fix is merged, so the advisory is ready to go out the moment the
   release lands.
2. **Release notes.** The advisory ID, title, severity, and a link appear in the
   release notes of the release that contains the fix, as described in
   `Governance/policies/DEPRECATION.md` for how a change reaches a release
   publicly.
3. **Commit and pull request references.** The fixing commit message names the
   advisory ID, and the pull request closes the internal tracking issue. The
   advisory itself is not detailed in either, so an embargoed issue stays
   embargoed.
4. **Advisory record.** The published advisory is retained as the record of the
   issue, its rating, and its remediation. It is never edited to remove content;
   a correction is published as a new revision with a note explaining what
   changed.

This template does not define how a report is received, triaged, embargoed, or
credited. Those rules live in the process in
`Governance/processes/VULN_DISCLOSURE.md`, and an advisory is published only
after that process has produced a fix and agreed the disclosure date. Where the
two documents disagree on timing or credit, the process in that document
governs and this template is corrected in the same pull request.

## Ownership

- Maintainers own this template and the published advisories. They set the
  severity bands, approve the CVSS rating and its rationale, and decide the
  disclosure date, as part of their security response responsibility in
  `Governance/roles/MAINTAINER.md`.
- The reporter owns the accuracy of the reproduction steps and the description
  of what they found, and may review the text before publication.
- **No required field is optional in practice.** An advisory published with a
  placeholder, a missing CVSS vector, or a missing remediation section is taken
  down and republished; a withdrawn advisory is as much a governance failure as
  an unpublished one.
- Changes to this template are proposed in a pull request that touches only the
  `Governance/` folder, as `Governance/README.md` requires.

## Success

This template is working when:

- Every advisory published for the repository uses this structure, and a reader
  can find the severity, the CVSS vector, and the remediation action without
  reading past the second section.
- No published advisory contains an unresolved `<placeholder>`, and no advisory
  ships with a severity that disagrees with its CVSS score.
- Every Medium-or-higher advisory states a concrete remediation action and, when
  possible, a detection method.
- Disclosure dates are met: the advisory and the fixing release become public on
  the same day, and the embargo length agreed with the reporter is recorded
  rather than improvised.
- Reported vulnerabilities are credited as the reporter asked, in every
  published advisory.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | memplethee-lab (@memplethee-lab) |
