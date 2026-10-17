# Git Tagging Policy

## Purpose

This policy defines how the project names, creates, and signs Git tags so that
a tag always points at a reviewed release and can be traced back to the commit
it marks. A tag is a public promise about a version; this policy keeps that
promise unambiguous.

## Scope

This policy applies to every tag pushed to this repository, including release
tags and pre-release tags. It does not define the version numbers themselves,
which follow the [Versioning Policy](VERSIONING.md), or the timing of releases,
which follows the [Release Cadence](../processes/RELEASE_CADENCE.md).

## Tag Naming Convention

Release tags are annotated and named `v` followed by the semantic version, for
example `v1.4.0`. Pre-releases append a hyphenated identifier to the version,
such as `v1.4.0-rc.1` or `v1.4.0-beta.2`. A tag never moves once it is pushed:
if a release is wrong, a new version is cut and tagged rather than re-pointing
the old tag. Lightweight tags may be used for local or scratch work but are
never pushed as releases.

## Who May Tag

Release tags are created by maintainers, or by the release manager named for a
given release. Automation may create a tag only when a maintainer has triggered
the release process it runs inside. Contributors do not push tags to this
repository; they propose a release through the normal review process.

## Signing Requirement

Release tags are signed with the same kind of key used for signed commits, so
that a consumer can verify a tag against a trusted key. Unsigned release tags
are rejected, and a tag whose signature cannot be verified is treated as if it
did not exist. The key used to sign a tag is registered with the maintainer's
account and follows the key rules in the governance folder.

## Ownership and Review

The maintainers own this policy and review it every six months. The review
checks that published tags follow the naming convention, that release tags are
signed, and that no tag has been moved. Changes are proposed as a pull request
that touches only the `Governance/` folder.

## Success

This policy succeeds when every release tag is annotated, signed, correctly
named, and immutable, and when a consumer can verify exactly which commit a
version refers to.
