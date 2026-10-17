# Monthly Maintainer Report Policy

## Purpose

This policy defines the mandatory monthly maintainer report for the TeachLink Web repository. The report provides a consistent, versioned record of maintainer activity, project health, and governance decisions so that contributors, maintainers, and stakeholders have a shared source of truth.

## Cadence

- **Reporting period:** one calendar month (the first day through the last day of the month, UTC)
- **Publication deadline:** within the first *five (5) business days* of the following month
- **Publication location:** committed to this repository under `Governance/reporting/reports/` as `YYYY-MM.md` (e.g. `2025-01.md`)
- **Missed deadline:** the report must be published as soon as possible and the delay must be noted in the report itself and in the next maintainer meeting notes

## Audience

The report is written for, and is publicly readable by:

- **Contributors** - to understand priorities, review turnaround, and how to get involved
- **Maintainers** - to track workload, review backlog, and ownership of open items
- **Project stakeholders and sponsors** - to verify progress against commitments and reported metrics
- **Auditors and governance reviewers** - to confirm that reporting obligations are being met

## Report Fields

Every monthly report MUST contain the following fields, in this order:

1. **Reporting period** - the month and year covered (`YYYY-MM`), plus the UTC date range.
2. **Report authors** - the maintainer(s) who prepared the report, by GitHub handle.
3. **Executive summary** - a short prose summary of the month's highlights, risks, and blockers.
4. **Merged pull requests** - count of merged PRs, with links to notable changes.
5. **Opened and closed issues** - counts of issues opened and closed during the period.
6. **Review turnaround** - median time from PRtas to first maintainer review and to merge.
7. **Open review backlog** - number of PRs awaiting review at the end of the period, with ageing notes for PRs older than 14 days.
8. **Releases** - any releases or version tags published during the period.
9. **Security and dependency updates** - security advisories addressed, dependency bumps, and any outstanding risks.
10. **Governance decisions** - decisions made under the Governance folder during the period, with links to relevant documents.
11. **Contributor recognition** - new contributors and notable contributions.
12. **Next month priorities** - the top priorities and any anticipated blockers.
13. **Attestation** - a statement that the report is complete and accurate to the best of the author's knowledge, with the date of publication.

## Report Template

A new report can be started from the following skeleton:

```markdown
# Monthly Maintainer Report - YYYY-MM

## Reporting Period
YYYY-MM, UTC range: YYYY-MM-01 to YYYY-MM-DD

## Report Authors
- @handle

## Executive Summary

## Merged Pull Requests

## Opened and Closed Issues

## Review Turnaround

## Open Review Backlog

## Releases

## Security and Dependency Updates

## Governance Decisions

## Contributor Recognition

## Next Month Priorities

## Attestation
I attest that this report is complete and accurate to the best of my knowledge.

_Published on: YYYY-MM-DD
_
```

## Responsibility and Escalation

- The report is owned by the current mainter on rotation for the reporting period.
- **Escalation:** if the report cannot be published by the deadline, the maintainer must notify the remaining maintainers in the project channel and record the delay in the next report.

## Review and Versioning

- **Review:** the report is subject to at least one other maintainer review before merge, except when there is only one maintainer active.
- **Versioning:** reports are immutable once merged. Corrections are made in a follow-up commit that adds a `Changelog` section rather than rewriting history.
- **Changes to this policy:** any change to this document must be made via a pull request that is reviewed by at least one maintainer.

## Compliance

A report is considered completant when all required fields are present and the report is committed to the correct location within the publication deadline. Missing or incomplete reports are recorded as a governance gap and addressed in the following month's report.
