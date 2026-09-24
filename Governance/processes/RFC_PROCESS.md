# RFC Process

## Purpose

This process defines when an RFC (Request for Comments) is required for TeachLink
Web, the stages a proposal moves through, and the criteria used to accept or
reject it. It gives contributors a predictable path to propose design changes and
gives maintainers a structured way to evaluate them before implementation work
begins.

## Scope

This process applies to design changes to this repository and to governance
changes proposed through the `Governance/` folder. Small, bounded fixes follow
the normal issue and pull request flow and do not need an RFC.

## When an RFC Is Required

An RFC is required before implementation when a change is structural, costly to
reverse, or affects how contributors work:

- A change to public or internal API contracts, response shapes, or the data
  paths the frontend relies on from `teachLink_backend`.
- A new subsystem or architectural direction (state management, realtime
  delivery, offline behavior, rendering strategy) that will span multiple areas
  of the codebase.
- A change to governance, roles, or the contributor workflow that lives in the
  `Governance/` folder and changes how the project is run.
- A change with a material effect on security, privacy, accessibility, or the
  availability of the service.
- A change that removes or renames a user-facing capability or a public
  interface that other contributors depend on.

An RFC is **not** required for bug fixes, small UI changes, dependency updates,
or incremental improvements that follow an established pattern already covered by
an accepted design. When in doubt, a one-paragraph outline in the issue is
enough for a maintainer to confirm whether an RFC is required.

## RFC Lifecycle

An RFC moves through the following stages. Each stage has a clear owner and an
exit criterion.

### 1. Idea

The author describes the problem and the proposed direction in a GitHub issue.
The exit criterion is confirmation that the change is in scope and that an RFC is
required.

- **Owner:** author.
- **Exit criterion:** a maintainer confirms the RFC is warranted, or the idea is
  closed.

### 2. Draft

The author writes the RFC using the RFC template, including the metadata header
(stage, author, owners, creation date) and the required sections. The draft is
open for early, low-volume feedback but is not yet a call for review.

- **Owner:** author, with early feedback invited.
- **Exit criterion:** the author considers the draft complete and requests
  review.

### 3. Open for Comment

The RFC is shared for community and maintainer review. Discussion happens in the
RFC's own thread so the full reasoning is preserved. The author updates the RFC
in response to feedback and records unresolved objections rather than silently
dropping them.

- **Owner:** author and reviewers; maintainers steer the discussion.
- **Exit criterion:** a review period has elapsed and open questions are either
  answered or explicitly marked as unresolved objections.

### 4. Decision

Maintainers decide to accept or reject the RFC using the acceptance and rejection
criteria below. The decision is recorded in the RFC's thread.

- **Owner:** maintainers.
- **Exit criterion:** a written decision with reasoning.

### 5. Implemented or Ended

Accepted RFCs are implemented through the normal issue and pull request flow,
referencing the RFC. Rejected, superseded, or withdrawn RFCs are marked with
their terminal state and kept as a record.

- **Owner:** author and implementers for accepted RFCs; maintainers for terminal
  states.
- **Exit criterion:** the change ships with the RFC referenced, or the RFC is
  closed in a terminal state.

## Acceptance and Rejection Criteria

An RFC is **accepted** when:

- It states the problem, the proposed change, and the alternatives considered.
- It explains how the change serves the project's values and measurable outcomes
  from the governance foundations.
- It identifies the affected areas, the integration seam with the backend and
  contract layers, and any migration or compatibility cost.
- Open objections that materially affect users or maintainability are resolved.
- The scope of the RFC is confirmed to be within the project's scope statement.

An RFC is **rejected** when:

- The problem it addresses is out of scope or already covered.
- The reasoning relies on assumptions that reviewers demonstrate to be unsafe or
  unsupported.
- The change cannot be migrated safely or lands without a compatibility path.
- Maintainable alternatives exist that better serve users or the long-term
  health of the project.
- The discussion reaches a decision consistent with the project's decision-making
  governance that does not support the proposal.

## Ownership

- Maintainers own this process and make the final decision on acceptance and
  rejection.
- Authors own the RFC document through its lifecycle and the issue or pull
  request that implements an accepted RFC.
- Changes to this process are proposed in a pull request that touches only the
  `Governance/` folder.

## Success

This process succeeds when significant changes are designed and reviewed before
large implementation effort is spent, when decisions are recorded with their
reasoning, and when authors can predict with confidence whether their proposal
will be accepted.