# Stale Pull Request Policy

## Purpose

This policy keeps the pull-request queue reviewable while giving contributors a predictable opportunity to resume paused work. Closing a stale pull request is an administrative action, not a rejection of the contributor or the underlying idea.

## When a pull request becomes stale

An open pull request is considered stale after 14 consecutive days without meaningful activity.

Meaningful activity includes:

- a new commit that addresses the change;
- a substantive author or reviewer update;
- a completed review or response to requested changes;
- movement in a documented external dependency; or
- a maintainer decision that changes the next action.

Automated status updates, label changes, bot comments, and repeated messages that do not change the work do not reset the clock.

Draft pull requests follow the same threshold unless the author and maintainer agree to a documented longer checkpoint.

## Exemptions and pauses

The stale clock is paused while:

- the pull request is waiting on a maintainer decision or requested review;
- required CI or repository infrastructure is unavailable;
- the work is blocked by another tracked issue or pull request;
- an approved security process requires limited public activity; or
- the author has documented a return date that a maintainer accepted.

Release, dependency-update, and incident-response pull requests may use a different lifecycle when their automation or runbook defines one. Maintainers should label or comment on exemptions so the reason is visible.

## Nudge process

When the 14-day threshold is reached, a maintainer or approved automation posts a single reminder that:

1. identifies the unresolved next action;
2. asks whether the author intends to continue;
3. provides a seven-day response window; and
4. links to this policy.

The reminder should mention the author and, where the next action belongs to a reviewer, the responsible maintainer. A pull request must not be closed as stale while the outstanding action belongs solely to the project.

If the author responds with a concrete plan or requests help, the maintainer should confirm the next checkpoint and remove or defer any stale label.

## Closing a stale pull request

If there is no meaningful response within seven days of the nudge, the pull request may be closed. The closing comment must:

- state that the closure is due to inactivity;
- summarize the unresolved work;
- confirm that closure does not prohibit a future contribution; and
- explain the reopen path.

Branches must not be deleted by stale-policy automation unless a separate, documented retention policy permits it.

Maintainers may close earlier only when another policy requires it, such as a security, licensing, spam, duplicate, or Code of Conduct determination. The applicable reason should be recorded rather than labeling that closure as stale.

## Reopening or replacing the work

The original author may request reopening by commenting with:

- confirmation that they can continue;
- an updated implementation plan or response to outstanding feedback; and
- a current branch that can be reviewed.

A maintainer should reopen the pull request when the branch remains viable and the scope is still needed. If the branch is no longer mergeable, the base has materially changed, or another contribution has superseded it, the maintainer may ask for a new pull request and should link the old and new discussions.

A new contributor may take over only after assignment through the normal issue process. Credit and attribution for reusable prior work must be preserved.

## Repeated inactivity

Repeated stale cycles may lead maintainers to release the linked issue assignment sooner, but each decision should consider the contributor's communication, the project's delays, and the urgency of the work. Staleness must not be used to pressure contributors into unsafe work or bypass required review.
