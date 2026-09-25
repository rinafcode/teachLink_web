# Performance Budget

This document outlines the governance process for the performance budget.

## Budget Thresholds

The following performance budget thresholds must not be exceeded:

- First Contentful Paint (FCP): 2 seconds
- Largest Contentful Paint (LCP): 3 seconds
- Cumulative Layout Shift (CLS): 0.1

## Measurement in CI

The performance budget must be measured in Continuous Integration (CI).

## Response When Exceeded

If the performance budget is exceeded, the build must fail. The performance regression must be addressed before the build can be deployed.
