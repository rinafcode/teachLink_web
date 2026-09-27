# Pull Request Review SLA

## Purpose

This policy sets service-level targets for reviewing TeachLink pull requests. The targets make review expectations visible and provide an escalation path when work is delayed. They are goals, not guarantees, and must not be used to bypass quality, security, licensing, or governance requirements.

## Scope and definitions

This policy applies to pull requests that are open, not draft, assigned to the appropriate reviewers, and ready for review.

- **Business day:** Monday through Friday, excluding maintainer-announced project holidays.
- **First response:** a maintainer acknowledges the pull request and either starts review, requests information, or states when review can begin.
- **Review completion:** a maintainer submits an approval or a consolidated review identifying the blocking changes required for the next decision.
- **Ready for review:** required metadata is present, the linked issue is assigned, the branch is reasonably current, and required author-run checks are reported.

Automated checks and bot comments do not count as the human first response.

## Service targets

For a ready pull request:

- **First response target:** within three business days.
- **Review-completion target:** within seven business days.
- **Follow-up review target:** within three business days after the author addresses the requested changes and re-requests review.

Maintainers should provide a short status update before a target is missed when a complete review is not yet possible.

## Priority

Review capacity is normally ordered as follows:

1. active security and production incidents;
2. release blockers and regressions;
3. small dependency-unblocking changes;
4. assigned program or milestone work with a published deadline;
5. other ready pull requests, generally oldest first.

Priority changes should be visible in the pull-request thread or project board. A higher priority does not remove required checks or approvals.

## When the clock starts, pauses, and resets

The first-response clock starts when a non-draft pull request requests review from the project.

The completion clock pauses while the pull request is:

- waiting for information or changes from the author;
- failing required checks for reasons attributable to the proposed change;
- blocked by a tracked dependency or maintainer decision;
- subject to coordinated security review; or
- marked as not ready or converted back to draft.

The clock resumes when the blocking condition is resolved and review is requested again. New commits that materially change the reviewed scope may restart the completion target because reviewers must assess a new risk surface.

Repository outages and unavailable CI pause the target for the affected period and must not count against the author.

## Reviewer responsibilities

The assigned reviewer should:

- acknowledge the request or reassign it promptly if unavailable;
- consolidate blocking feedback where practical;
- separate required changes from suggestions;
- explain security, correctness, accessibility, or governance concerns clearly;
- avoid requesting unrelated scope; and
- record approvals and unresolved blockers in GitHub.

If specialist review is required, the first reviewer remains responsible for identifying the specialist and communicating the dependency.

## Contributor responsibilities

The author should keep the pull request reviewable, answer questions, address or discuss feedback, and re-request review after updates. Authors should avoid repeatedly requesting review without material changes and should promptly disclose known test limitations or blockers.

## Escalation

If the first-response target is missed, the author may mention the repository's maintainer team or another listed maintainer and link to this policy.

If the review-completion target is missed:

1. the author posts a concise status request summarizing readiness and outstanding actions;
2. after two additional business days without a response, the author may request reassignment or a second reviewer; and
3. program or release work with a deadline may be escalated to the project lead or relevant program coordinator.

Escalation should remain in the pull-request thread unless security or conduct considerations require a private channel. Escalation does not imply approval and must not be used to pressure a reviewer to waive a requirement.

## Reporting and improvement

Maintainers may periodically review median first-response and completion times. Metrics should be used to improve capacity and documentation, not to rank or shame volunteer reviewers. Sustained misses should result in narrower assignments, additional reviewers, or updated published targets.
