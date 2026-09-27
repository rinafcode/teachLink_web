# Security Severity Rubric

## Purpose

This rubric defines how the severity of a security vulnerability in
TeachLink Web is assessed, the criteria for each level, and the
response SLA each level carries. It turns the severity scale in
`Governance/SECURITY_POLICY.md` into a checkable rubric, so that two
maintainers assessing the same report reach the same level.

## Scope

This rubric applies to every vulnerability report handled under
`Governance/SECURITY_POLICY.md` and
`Governance/processes/VULN_DISCLOSURE.md`, and to findings from the
automated dependency audit.

Where this rubric and `Governance/SECURITY_POLICY.md` differ, the
security policy wins and this rubric is corrected.

## Severity Levels

There are four levels, matching the levels used by the security
policy and the dependency audit:

| Level | Summary |
| --- | --- |
| `critical` | Full compromise of users, data, or the application |
| `high` | Significant compromise with limited preconditions |
| `moderate` | Limited impact, or impact that needs user interaction |
| `low` | Hardening gaps with no demonstrated exploitation path |

## Criteria per Level

A report is assigned the highest level whose criteria it meets.

### Critical

- Remote code execution in the client or its build pipeline.
- Authentication or session bypass.
- Cross-tenant access to another user's data.
- A live secret committed to the repository.
- Any vulnerability that is being actively exploited.

### High

- Read access to restricted data.
- Stored cross-site scripting reachable without a special role.
- Privilege escalation.
- Supply-chain compromise of a direct dependency.

### Moderate

- Reflected injection that needs user interaction.
- Denial of service limited to one user's session.
- An access-control gap with no sensitive data behind it.
- A dependency advisory the audit reports but does not block on.

### Low

- Missing hardening with no demonstrated exploitation path.
- An information leak with no sensitive data.
- A documentation defect that describes an unsafe default.

### Adjusting the level

- A report the project cannot yet classify is assessed as `high`
  until it can be, so a missing answer never lowers urgency.
- Active exploitation raises any report to `critical`.
- A level is lowered only with a recorded reason, such as a
  precondition that makes exploitation impractical.

## Response SLA per Level

Every report is acknowledged within 1 business day (24 hours) and
receives an initial assessment within 3 business days (72 hours) of
the acknowledgement, whatever its level. After validation:

| Level | Response SLA |
| --- | --- |
| `critical` | Mitigation in place within 72 hours of validation |
| `high` | Fix released within 7 calendar days of validation |
| `moderate` | Fix released within 30 calendar days of validation |
| `low` | Next scheduled release, within 90 calendar days |

- Fixes for `critical` and `high` reports ship through the expedited
  path in `Governance/processes/HOTFIX.md`.
- If an SLA cannot be met, the reporter is told before it passes,
  with the reason and a new date.
- These deadlines match `Governance/SECURITY_POLICY.md`, and a change
  to one is made to both in the same pull request.

## Ownership and Review

- Maintainers own this rubric and assign severity, as set out in
  `Governance/roles/MAINTAINER.md`.
- A second maintainer reviews any assessment of `high` or above.
- Changes to this rubric are proposed in a pull request that touches
  only the Governance/ folder.
- This governance document is versioned with the repository; it
  describes the process the project actually follows.

## Success

This rubric succeeds when every report receives a level with its
reasoning, when two maintainers reach the same level for the same
report, and when no report misses the SLA for its level.

## Regression Tests

Coverage is provided by `Governance/SECURITY_SEVERITY_RUBRIC.test.ts`,
which pins the severity guarantees in this document.

## Revision History

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-27 | Initial version. | TeachLink maintainers |
