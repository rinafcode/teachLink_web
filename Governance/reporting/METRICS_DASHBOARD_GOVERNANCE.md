# Metrics Dashboard Governance Policy

## Overview
This document defines the governance policy for metrics dashboards maintained for **TeachLink Webrinafcode/teachLink_web**. It establishes clear standards for data integrity, metric definitions, data sources, and operational ownership to ensure accurate project tracking.

---

## 1. Tracked Metrics
The project metrics dashboard monitors key performance indicators across three primary areas:
- **Development & Velocity Metrics**:
  - Open vs. closed PR lead time.
  - Issue cycle time and closure rate.
  - CI pipeline pass/fail rates and build execution times.
- **Community & Contributor Health**:
  - Active monthly contributors count.
  - New contributor onboarding time.
  - First-response time on public issues and pull requests.
- **System Performance & Reliability**:
  - Application response times and latency SLAs.
  - Error rates and availability uptime percentage.

---

## 2. Authorized Data Sources
Metrics rendered on governance dashboards must originate exclusively from verified, automated data streams:
- **GitHub API & Actions**: Repository activity, workflow execution telemetry, and issue/PR metadata.
- **Prometheus / Grafana Telemetry**: Runtime application performance metrics, error rates, and system uptime.
- **Code Climate / SonarQube**: Automated code quality, test coverage, and security vulnerability metrics.

---

## 3. Ownership & Maintenance Responsibilities
- **Primary Owner**: Project Infrastructure & DevOps Maintainers.
- **Access Control**: Dashboard configuration edits are restricted to repository maintainers with write/admin access. Public read-only views are provided for open community transparency.
- **Review Cadence**: Dashboard accuracy, data pipeline connections, and metric relevance are audited quarterly during the State-of-the-Project review.