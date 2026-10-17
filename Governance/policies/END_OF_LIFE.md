# TeachLink Web - End-of-Life (EOL) Policy

This document defines how the TeachLink Web project decides on and announces the end of life of a release line, the support reduction stages that apply during that period, and the migration guidance that is provided to consumers.

It is part of the Governance folder and is versioned alongside the rest of the governance documents.

## 1. Scope

This policy applies to the TeachLink Web application, release lines (e.g. major versions), and the associated support artifacts (source branches, container images, documentation, and security advisories).

It does not cover third-party dependencies, which follow their own EOL policies.

## 2. How EOL is Decided

A release line reaches end-of-life when any of the following conditions is met:

1. A new major release line has been generally available for at least 12 months.
2. The release line has received no security or bug fixes for 6 months and the maintainers agree that further fixes are not practical.
3. A superseding release line requires breaking changes that cannot be backported safely.
4. A severity-1 security issue is discovered that cannot be fixed without a breaking change and the affected line is already outside its active support window.

The decision is made by the maintainers of the TeachLink Web repository and recorded in the EOL announcement described in Section 3.

## 3. How EOL is Announced

Every EOL decision must be announced at least 90 days before the EOL date. The announcement must include:

-  The affected release line and its last supported version.
-  The scheduled EOL date.
-  The support reduction stages that will apply and their dates.
-  The migration path to a supported release line.
-  A link to this policy document.

The announcement is published in the repository release notes and in the project changelog. A link to the announcement is added to the readme of the affected release line.

## 4. Support Reduction Stages

During the EOL window, support is reduced in three stages:

### Stage 1 - Full Support (default)

- Bug fixes and security fixes are provided.
- New features may be added at the maintainers' discretion.
- All release artifacts are published.

### Stage 2 - Security-Only Support

- Only security fixes and critical regression fixes are provided.
- No new features are added.
- Release artifacts are published only for security and critical fixes.

### Stage 3 - End-of-Life

- No fixes of any kind are provided.
- The release line is marked as EOL in the repository and in the changelog.
- Support channels for the line are closed.

Stage transitions are announced in the same manner as the initial EOL announcement.

## 5. Migration Guidance

Every EOL announcement must include migration guidance that covers:

1. The supported release line to migrate to and its support window.
2. A list of breaking changes between the EOL line and the supported line.
3. Step-by-step instructions for upgrading deployments, including any required configuration or data migrations.
4. Known issues and workarounds for the migration path.

Migration guidance is maintained in the repository documentation and is linked from the EOL announcement.

## 6. Responsibilities

- Maintainers: decide on EOL, publish announcements, and maintain migration guidance.
- Contributors: follow the stages defined here when submitting changes to an EOL line.
- Consumers: migrate to a supported release line before the EOL date.

## 7. Changes to This Policy

Changes to this policy are made through the standard pull request process and must be recorded in the Governance changelog.
