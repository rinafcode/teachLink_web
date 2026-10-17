# Monthly Maintainer Report Policy

## Purpose

This policy defines the mandatory monthly maintainer report for the TeachLink Web repository. It establishes what must be reported, at what cadence, to whom, and how the report is stored and reviewed. The goal is to give contributors and maintainers a clear, versioned reference for maintainer activity and project health.

## Scope

This policy applies to all maintainers of the TeachLink Web repository, regardless of team or area of ownership. It covers maintainer activity within the repository and the associated Governance processes.

## Cadence

1. Reports are produced **monthly**, covering the previous calendar month.
2. The report must be completed and merged by the **fifth (5th) business day** of the following month.
3. If the fifth business day falls on a holiday, the deadline moves to the next business day.
4. Missed reports are recorded in the following month's report under the "Exceptions" section.

## Audience

1. **Contributors** - to understand priorities, review turnaround, and open opportunities.
2. **Maintainers** - to coordinate work and track own and peer activity.
3. **Project leadership/stewards** - to assess project health and decision-making needs.
4. **Community members** - to understand how the project is being governed.

## Report Fields

Every monthly maintainer report MUST include the following fields:

| Field | Description | Required |
| --- | --- | --- |
| Reporting period | The calendar month covered (e.g., 2025-01). | Yes |
| Preparer | Name/handle of the maintainer who prepared the report. | Yes |
| Maintainers active | List of maintainers active during the period. | Yes |
| Pull requests reviewed | Count of PRs reviewed, with average review time. | Yes |
| Pull requests merged | Count of PRs merged, grouped by area if possible. | Yes |
| Issues triaged | Count of issues triaged, closed, and newly opened. | Yes |
| Releases | Any releases cut during the period, with version tags. | Yes |
| Notable changes | Summary of significant changes to code or governance. | Yes |
| Risks and blockers | Ongoing risks, blockers, or areas needing attention. | Yes |
| Exceptions | Missed reports, deadline breaches, or process deviations. | Yes |
| Next month priorities | Top items the team intends to focus on. | Yes |
| Attestation | Confirmation that report data is accurate as of submission. | Yes |

## Storage and Versioning

1. Reports are stored in `governance/reporting/reports/<YYYY-MM>.md` in the repository.
2. Each report is a versioned file committed via pull request; historical reports are never deleted.
3. Corrections to a published report are made in a new commit that references the original report file.

## Review and Approval

1. The report is opened as a pull request against the Governance folder.
2. At least one other maintainer must approve before merge.
3. Merge is allowed only after the cadence deadline has been met or the report has been explicitly marked as delinquent.

## Regression Considerations

This document is purely governance documentation. It introduces no runtime code changes and therefore cannot affect existing functionality. The addition is self-contained within the Governance folder and does not require test modifications.

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2025-01-01 | Initial addition of the monthly maintainer report policy. | TeachLink Maintainers |
