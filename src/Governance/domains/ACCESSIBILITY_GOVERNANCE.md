# Web Accessibility Governance

This document outlines the accessibility standards and practices for our web applications.

## Target WCAG Level

All new and updated web content and applications must conform to **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA**.

## Audit Cadence

- **Automated Audits:** Automated accessibility scans are run on every build.
- **Manual Audits:** Manual accessibility audits are conducted quarterly by a designated accessibility expert.
- **Third-Party Audits:** A comprehensive third-party accessibility audit is performed annually.

## Merge Gate for Regressions

No pull request will be merged if it introduces a new WCAG 2.1 Level A or Level AA violation. Automated checks will block any pull requests that introduce regressions.

## Regression Tests

Where applicable, automated regression tests will be added to prevent the reintroduction of known accessibility issues.
