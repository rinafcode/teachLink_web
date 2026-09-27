# Code of Conduct Appeals Process

## Purpose

This document defines how Code of Conduct enforcement decisions
for TeachLink Web may be appealed. It gives every affected party
a clear, fair, and versioned path from an enforcement decision
to an independent review with a recorded outcome, so conduct
enforcement stays consistent, accountable, and trusted.

## Scope

This process applies to enforcement decisions made under the
project's community and conduct standards, including warnings,
temporary restrictions, and permanent removals from project
spaces for this repository.

It covers appeals of conduct enforcement only. It does not
cover technical review disputes, which follow
`Governance/processes/TRIAGE.md`, moderation of
individual comments, which follows
`Governance/domains/COMMENT_MODERATION.md`, nor vulnerability
reports, which follow `Governance/SECURITY_POLICY.md`.

## Who May Appeal

The following parties may file an appeal:

- **The reported person.** Any person subject to an enforcement
  decision may appeal that decision.
- **The reporter.** The person who made the original conduct
  report may appeal when they believe a decision was incorrect,
  disproportionate, or missed material facts.
- **An affected contributor.** Any contributor directly affected
  by the enforcement outcome may appeal with an explanation of
  how the outcome affects them.

A maintainer may also request review on behalf of an affected
party who cannot safely file alone. Appeals may use a pseudonym
where safety requires it.

## Appeal Steps

Every appeal moves through the following steps in order:

### 1. File an appeal

The appellant files an appeal within 14 calendar days of the
enforcement decision being communicated. The appeal states
which decision is appealed, why it should be reconsidered,
and any new evidence. Appeals are filed in the private conduct
channel named in the decision notice.

- **Owner:** the appellant.
- **Exit criterion:** appeal received with the decision, the
  grounds for reconsideration, and any supporting evidence.

### 2. Acknowledgement and triage

A maintainer acknowledges the appeal within 3 business days,
confirms it is in scope for this process, and assigns an
independent reviewer. Out-of-scope matters are redirected with
the reason recorded.

- **Owner:** maintainers, as defined in
  `Governance/roles/MAINTAINER.md`.
- **Exit criterion:** acknowledgement sent and an independent
  reviewer assigned, or a redirection recorded.

### 3. Independent review

The independent reviewer examines the original report, the
evidence, the enforcement decision, and the appeal grounds,
then decides to uphold, amend, or overturn the decision.

- **Owner:** independent reviewer.
- **Exit criterion:** review completed within 10 business days
  of assignment.

### 4. Written decision with reasoning

The outcome is communicated to the appellant as a written
decision with reasoning. The decision states what was decided,
why, and what, if anything, can reopen it.

- **Owner:** independent reviewer; maintainers ensure delivery.
- **Exit criterion:** written decision with reasoning shared
  with the appellant.

### 5. Record and follow up

The decision and its reasoning are recorded in the private
conduct record. When the appeal exposed a gap in docs or
process, a follow-up issue is opened without disclosing
private details. Retaliation for filing or participating in
an appeal is treated as a fresh conduct matter.

- **Owner:** independent reviewer records; maintainers ensure
  follow-up.
- **Exit criterion:** record complete and any follow-up issue
  linked.

A party may request re-review once with new evidence; after
that the appeal decision stands unless new facts emerge.

## Independent Review

Independent review is what makes an appeal fair, and it is
required for every appeal under this process:

- The reviewer must be uninvolved in the substance of the
  original matter and did not make the original decision.
- The reviewer must not have authored or approved the decision
  under appeal, and must not have been directed by any party
  on the conclusion to reach.
- The reviewer must disclose any personal stake (a conflict
  of interest) under
  `Governance/policies/CONFLICT_OF_INTEREST.md` and step aside
  when one exists.
- When no uninvolved maintainer is available, the appeal is
  escalated to project leadership or a trusted contributor
  agreed by the parties, as described in
  `Governance/roles/CONTRIBUTOR.md`.
- A review that merely restates the original decision without
  engaging the appeal grounds is not an independent review.

When independence cannot be met immediately, the appeal waits
and the appellant is told why. If the project must proceed
without one for safety reasons, the exception is recorded and
a retrospective independent review is scheduled as soon as an
eligible reviewer is available.

## Confidentiality and Records

Conduct appeals are handled in a private channel. Only the
appellant, the reporter where safe, the original decision
makers, and the independent reviewer take part. Public spaces
carry only the fact that an appeal was decided, never names
or private details, unless all affected parties agree.

Records are kept to the minimum needed for accountability:
the decision, the reasoning, and any follow-up. Records are
retained by maintainers and are not disclosed beyond those
named above.

## Ownership and Review

- Maintainers own this process and hold final say on its
  operation, as set out in `Governance/roles/MAINTAINER.md`.
- Changes to this process are proposed in a pull request that
  touches only the Governance/ folder.
- This governance document is versioned with the repository;
  it describes the process the project actually follows.

## Success

This process succeeds when every enforcement decision names
its appeal route; when every appeal receives an independent
review with a written decision with reasoning; when appeals
are acknowledged promptly and decided within the committed
windows; and when contributors trust that appealing will not
lead to retaliation.

## Regression Tests

Coverage is provided by `Governance/COC_APPEALS.test.ts`, which
pins the appeal guarantees in this document.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-27 | Initial version. | TeachLink maintainers |
