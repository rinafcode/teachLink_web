# Code Review Etiquette Guide

## Purpose

This guide describes the tone and habits we expect in code review on TeachLink
Web. Review is how the project keeps quality high and how contributors learn
from each other; done well it is respectful, specific, and quick. It complements
the formal rules of the [Review Policy](../policies/REVIEW_POLICY.md).

## Scope

This guide applies to everyone who writes or reviews a pull request in this
repository: authors, reviewers, and maintainers, in comments, suggestions, and
review discussions. It covers behaviour; what must be checked, how many
approvals are needed, and reviewer independence are set out in the [Review
Policy](../policies/REVIEW_POLICY.md) and the approval requirements policy.

## Tone and Expectations

Review the code, not the person:

- Assume good intent and that the author did their best with what they knew.
- Be specific and kind: say what the issue is, why it matters, and, when you
  can, how to fix it. Prefer questions ("What happens if this is empty?") to
  commands.
- Separate required changes from preferences. Label optional comments (for
  example "nit:" or "optional:") so the author knows what blocks merge.
- Praise good work. A short "nice solution" costs nothing.
- Avoid sarcasm, absolutes, and personal remarks; follow the [Code of
  Conduct](../CODE_OF_CONDUCT.md) and [Communication
  Norms](../policies/COMMUNICATION_NORMS.md).
- Use inclusive wording and avoid assumptions about the author's background.

## Author and Reviewer Norms

**Authors**:

- Keep pull requests small and focused, describe the change and how you tested
  it, and link the issue.
- Review your own diff first, and answer comments or push fixes promptly; if you
  disagree, say why.
- Do not take comments personally and do not mark conversations resolved on the
  reviewer's behalf unless asked.
- **Reviewers**:
- Respond within the review window in the project's review SLA, or say that you
  cannot and release the review.
- Review the whole change, not only the part you know; say what you did not
  review.
- Approve when the change is good enough to merge, not when it is perfect;
  follow up on non-blocking points in an issue.
- Do not approve changes you do not understand, and do not hold a change up over
  style the linter already covers.

## Handling Disagreement

When author and reviewer disagree:

- Explain your reasoning with evidence (a test, a doc, a measurement) and listen
  to the other side.
- If a comment thread goes in circles after two rounds, move to a short call or
  ask a third maintainer for an opinion.
- For technical decisions that affect others, use the [RFC
  process](../processes/RFC_PROCESS.md); for stalled reviews use the [escalation
  path](../processes/ESCALATION_PATH.md).
- A maintainer decides when consensus cannot be reached and records the reason
  on the pull request.
- If a discussion becomes heated or disrespectful, pause it. Report concerns
  through [Code of Conduct reporting](../COC_REPORTING.md).

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- Contributors are invited to suggest improvements based on their review
  experience; the guide is revisited at least once a year.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This guide succeeds when reviews are timely and specific, when authors leave a
review feeling respected and more skilled, and when disagreements are settled
with evidence rather than friction.
