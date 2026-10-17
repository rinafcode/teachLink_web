# CI/CD Governance Policy

## Purpose

This policy defines who may change the project's pipelines, what secrets and
permissions those pipelines may hold, and which checks are required before a
change can merge. Pipelines are part of the trusted computing base: a change to
them can alter what runs, so they need the same governance as the code they
build.

## Scope

This policy applies to every continuous integration and delivery configuration
in this repository, including workflow definitions, reusable actions, build and
deploy scripts, and the environments the pipelines deploy to. It complements
the [Approval Requirements Policy](APPROVAL_REQUIREMENTS.md), which sets how
many approvals a change needs.

## Who May Change Pipelines

Pipeline changes are proposed like any other change and need an approval from a
maintainer responsible for CI. A change that adds or widens a secret, grants a
new permission, or alters a deploy step needs an additional approval from a
maintainer accountable for security. Contributors may propose pipeline changes
but may not merge them, and the workflows on a protected branch may be changed
only through a pull request.

## Secret and Permission Rules

Pipelines receive the smallest set of secrets and permissions they need, scoped
to the job that uses them rather than to the whole workflow. Secrets are stored
in the provider's secret store, never in the repository or a workflow file, and
are not printed to logs. A token used by a pipeline is read-only or scoped
wherever possible, expires when its purpose ends, and follows the secret
rotation policy. Pull requests from forks do not receive secrets.

## Required-Check Policy

The checks that gate a merge (`type-check`, `lint`, `build`, and `test`) are
required on the protected branches. A required check is not removed, renamed,
or made optional by a pipeline change without a maintainer approval that
records why. A new required check is added through a change that updates branch
protection in the same review, and skipped or missing checks block the merge
rather than passing silently.

## Ownership and Review

The maintainers own this policy and review it every six months. Changes to this
policy are proposed as a pull request that touches only the `Governance/`
folder.

## Success

This policy succeeds when pipeline changes are reviewed like code, when
pipelines hold only the secrets and permissions they need, and when the
required checks cannot be weakened by the change that would benefit from it.
