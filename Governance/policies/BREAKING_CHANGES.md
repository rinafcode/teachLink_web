# Breaking Change Policy

## Purpose

This policy defines what counts as a breaking change for TeachLink Web, the
approvals a breaking change requires before it can merge, and the migration
guide that must ship with it. It gives contributors a single, versioned
reference for the highest-risk class of change, so that a consumer can tell
from the change itself whether taking an update will require work on their
side.

## Scope

This policy applies to every surface another party can depend on: user-facing
capabilities and pages, URL routes, components and their public props,
exported modules and utilities, API query and response shapes the frontend
consumes, configuration and environment variables, build and CI entry points,
and governance documents. It does not cover internal refactors with no
externally observable change, which follow the normal review process.

## What Counts as Breaking

A change is breaking when it requires someone outside the change to do work to
keep working. The following are breaking by default:

- **Removal or rename.** Removing or renaming a user-facing capability, a URL
  route, a component, an exported module or utility, a configuration key, or
  an environment variable.
- **Signature or behaviour change.** Changing a public prop signature, an
  exported function's behaviour, or the shape of an API query or response the
  frontend consumes, in a way that requires a consumer to change something.
- **Default change.** Changing a default value, a default route, or a default
  configuration in a way that alters observable behaviour for existing users.
- **Build and CI entry points.** Changing the meaning of `build`, `type-check`,
  `lint`, `test`, or another documented entry point so that existing
  invocations stop working.
- **Governance documents.** Removing or renaming a governance document, or
  changing a rule in a way that invalidates a decision made under the previous
  rule.

A change is **not** breaking when it only adds a new optional capability, fixes
a bug to match documented behaviour, or refactors internals without changing
anything observable. When a change is ambiguous, it is treated as breaking
until a maintainer records the opposite decision on the pull request.

## Required Approvals

A breaking change requires more review than an ordinary change:

- **Two maintainer approvals.** At least two maintainers from
  `Governance/roles/MAINTAINER.md` must approve the pull request, and the
  approving maintainers must not be the author.
- **RFC first.** A breaking change that removes or renames a public interface,
  or that has no reasonable migration path, requires an accepted RFC under
  `Governance/processes/RFC_PROCESS.md` before implementation begins.
- **Version bump.** The change is released as a major bump under
  `Governance/policies/VERSIONING.md`, and the pull request states the target
  version.
- **Deprecation where possible.** Where a deprecation cycle is feasible, the
  change follows `Governance/policies/DEPRECATION.md` instead of removing the
  surface outright.
- **Release sign-off.** The release carrying the change passes the sign-off
  gates in `Governance/processes/RELEASE_SIGNOFF.md`.

Approvals are recorded on the pull request. A verbal or chat approval does not
count.

## Migration Guide Requirement

Every breaking change must ship with a migration guide, in the same pull
request, before it can merge:

- **Location.** The guide lives in the pull request description and, for
  developer-facing interfaces, in the affected documentation under `docs/`.
- **Contents.** The guide names the affected surface, states what changed and
  why, and gives a before-and-after example a consumer can copy.
- **Effort estimate.** The guide states whether migration is mechanical or
  requires redesign, so consumers can plan.
- **Timeline.** The guide names the release that introduces the change and the
  earliest release in which the old surface stops working.
- **No guide, no merge.** A breaking change without a migration guide is
  incomplete and is not merged, regardless of approvals.

## Ownership and Review

- Maintainers own this policy, decide ambiguous cases, and approve exceptions
  with the reasoning recorded on the pull request.
- A change to this policy is proposed in a pull request that touches only the
  `Governance/` folder, and it follows the RFC process when it changes how
  breaking changes are approved.
- This policy is reviewed alongside `Governance/policies/VERSIONING.md` and
  `Governance/policies/DEPRECATION.md` so the three stay consistent.

## Success

This policy succeeds when no breaking change ships without the approvals and
the migration guide it promised, consumers can find out what a breaking change
means for them before they upgrade, and the decision to break something is
recorded and auditable.
