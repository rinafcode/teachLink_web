# Core Web Vitals Governance Policy

## Purpose

This policy defines the performance expectations for TeachLink Web through Core
Web Vitals, the monitoring source used to enforce them, and the response required
when performance regresses and targets are missed.

## Scope

This policy covers the performance of the TeachLink Web user experience as
measured by Core Web Vitals metrics in production.

## Target Thresholds

- Production pages must meet the "good" thresholds for Core Web Vitals metrics,
  including Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and
  Interaction to Next Paint (INP).
- Thresholds are defined as fixed targets per metric and are enforced for real-user
  traffic on supported devices and connection conditions.
- New or significantly redesigned pages must meet the same targets before they are
  considered releasable.

## Monitoring Source

- Core Web Vitals are measured from real-user monitoring (RUM) data collected
  from production traffic.
- The monitoring configuration and thresholds are versioned in the repository so
  changes are reviewable and reproducible.
- Monitoring must cover representative page templates and geographic regions, with
  sufficiently large sample sizes to avoid noisy thresholds.

## Regression Response

- When a Core Web Vitals target is missed or a sustained regression is detected, a
  ticket is raised and an owner is assigned.
- The team investigates the cause, identifies the responsible change or
  interaction, and applies a fix.
- A fix must not trade one vital for another; any mitigation is validated against
  the full metric set.
- If a target cannot be met, the deviation is documented, approved, and tracked
  with a timeline to revisit.

## Ownership and Review

- The performance-focused team owns this policy and reviews thresholds and the
  monitoring setup on a regular cadence.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This policy succeeds when production Core Web Vitals consistently meet their
targets, regressions are detected quickly from real-user data, and performance
expectations are explicit and versioned.