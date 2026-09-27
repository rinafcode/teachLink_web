# Good First Issue Policy

## Purpose

This policy defines what the `good first issue` label means on TeachLink Web,
who may apply it, and what mentorship a contributor who takes one can expect. A
label is a promise: it tells a person who has never opened the repository
before that the work is bounded, verifiable, and supported. When that promise
is kept, the label is the project's most effective recruiting tool; when it is
not, newcomers spend their first evening on an authentication bug and leave.

The policy exists because unlabelled work is how newcomers are discouraged. It
sets a bar the label must clear, names the people responsible for the label,
and turns mentorship into commitments with deadlines rather than good
intentions.

## Scope

This policy applies to the `good first issue` label on issues and pull requests
in this repository, and to the mentor who is named when the label is applied. It
governs the label, the criteria behind it, the mentorship commitment, and the
conditions under which the label is removed.

It does not cover the mechanics of picking up work in general: who may
contribute, how to get assigned, and the quality gates every change must pass
are defined in `Governance/roles/CONTRIBUTOR.md` and `CONTRIBUTING.md`. It does
not change what a pull request must pass before merge, and it does not relax
branch protection. A first contribution faces the same review standards as any
other, with the difference being the support around it.

## What the Label Means

An issue labelled `good first issue` is work that a contributor who has never
contributed to TeachLink Web can find, understand, implement, and verify in a
single sitting, with a named person available to answer questions. The label
describes the issue, not the contributor. It is never applied to a person, to a
pull request on someone else's behalf, or to a vague "any help appreciated"
offer.

The label sits at the low end of the effort scale defined in
`Governance/LABEL_TAXONOMY.md` and is the label most newcomers filter by, so it
is held to a higher standard than the general `help wanted` label.

## Criteria for the Label

A maintainer may apply `good first issue` only when **all** of the following
hold. These are checked, not judged by impression.

- **The outcome is stated in the issue.** The issue says what should change and
  how a reader can tell that it changed, in terms that do not require reading
  the codebase first.
- **The work is small.** The expected change touches at most three files in one
  area, and is estimated at one to three hours for someone unfamiliar with the
  repository or under an hour for an experienced contributor.
- **A pattern exists to copy.** The issue links an existing, comparable file,
  component, or test. Work that requires inventing an approach is not a first
  contribution.
- **It is verifiable by the contributor alone.** There is a check the
  contributor can run: an existing test or suite, a documented manual check, a
  failing case to make pass, or a lint and build gate. Verification that depends
  on staging data, production configuration, or a second person's machine does
  not qualify.
- **No new dependency, configuration, or contract.** The change adds no
  package, no framework, no environment variable, and no API or query shape
  that other code must adapt to.
- **The description is complete enough to start.** Expected and actual
  behaviour are both written down, along with the environment or route where the
  behaviour is visible. Issues still carrying `question` or `needs-repro` are
  not ready.
- **No design decision is pending.** The change follows an existing decision, so
  it does not require an RFC under `Governance/processes/RFC_PROCESS.md` and
  does not depend on an unresolved debate in the thread.
- **A mentor is available.** The maintainer applying the label is, or has
  already named, the mentor who will support the contributor under the
  mentorship section below.
- **The effort label agrees.** The issue is not also labelled `effort: large`,
  `priority: high`, or any Disposition label such as `wontfix` or `invalid`.

## Disqualifying Criteria

An issue is **not** a good first issue if any of the following is true, however
small the individual edit looks. These are the areas where a mistake is hard to
reverse, hard to detect, or lands on users who cannot recover from it.

- **Authentication and sessions.** Login, logout, registration, password reset,
  token issuance and refresh, session storage, OAuth or any third-party sign-in,
  and any change to how identity is established or verified.
- **Payments and money movement.** Anything involving billing, subscriptions,
  invoices, refunds, wallets, credits, or transferring value, even for zero
  amounts or test data.
- **Security-sensitive code.** Cryptography, permission checks, input
  sanitisation of untrusted content, rate limiting, anything already labelled
  `security`, and any fix for a reported vulnerability.
- **Data migration and stored data.** Schema changes, backfills, migrations,
  rewrites of stored user content, and anything that changes the shape of data
  already in a database.
- **Build and delivery configuration.** `next.config.ts`, `tsconfig`, lint and
  formatting configuration, CI workflows, release and publish tooling, Docker
  and Kubernetes files under `infra/`, `k8s/`, `charts/`, and
  `infrastructure/`, and branch protection settings.
- **Dependency and version changes.** Adding, removing, or upgrading a package,
  and lockfile churn, even for a patch release.
- **Irreversible or wide blast radius.** Work that is hard to revert, touches
  more than one area of the product, or cannot be undone without a data
  restore. Reversibility is the same test used by
  `Governance/policies/DEPRECATION.md`.
- **Incomplete or ambiguous scope.** Work whose design is still being argued in
  the thread, or that depends on an upstream change that has not landed.

A maintainer who is unsure whether an issue qualifies splits it: the small,
self-contained part becomes a good first issue, and the rest stays unlabelled.
If no part qualifies, the issue stays `help wanted` or goes back to the
backlog, and the thread records why it was not offered to newcomers.

## Who Applies the Label

- **Maintainers apply the label, during triage.** The label is added in the
  triage pass described in the process in `Governance/processes/TRIAGE.md`, or
  when a contributor asks for it and a maintainer agrees. It is never added as a
  favour to a specific person.
- **The author never applies the label to their own issue.** Nobody labels their
  own issue or pull request, so that `good first issue` continues to mean what
  the criteria above say it means. A maintainer who wants their own issue
  considered asks another maintainer to assess it against the criteria.
- **A mentor may propose the label** for an issue they are already discussing,
  but a maintainer confirms it against the criteria before it is applied.
- **Two maintainers, not two opinions of the same person.** Requests to
  reconsider a label decision are resolved by a maintainer who did not apply
  the label.
- **Triage is weekly.** New issues are assessed at least weekly, and any
  candidate for the label is assessed within five business days of being raised
  as a candidate, so a newcomer is never left waiting on a decision.

## Mentorship Expectation

Taking the label is a commitment by the project, not only by the contributor.
The mentor named in the issue thread is accountable for the following.

- **A named mentor, within three business days.** Applying the label records one
  named mentor in the thread, with a one-line statement of how they will help.
  The mentor is a maintainer or a contributor who has at least five merged pull
  requests and is familiar with the area.
- **First contact within one business day.** The mentor replies within one
  business day of the label being applied, or of a contributor commenting on the
  issue, to confirm the scope, point at the pattern to copy, and confirm the
  check that proves the fix works.
- **A check-in every five business days.** While the contributor is working, the
  mentor asks how it is going at least every five business days. Silence from
  the contributor pauses the clock; silence from the mentor does not.
- **A first review within three business days of the pull request.** The mentor
  reviews the pull request within three business days of it being marked ready
  for review, with specific, actionable comments rather than an approval with no
  explanation. The full review cycle, from first review to a decision, closes
  within ten business days.
- **A real hand-off, not a name in a field.** Mentorship means one or more of:
  pointing at the existing code to copy, answering questions in the thread,
  reproducing the bug locally, suggesting the test to extend, and reviewing the
  pull request with substance. A mentor who wants to can pair with the
  contributor. A mentor does not have to be the author of the fix.
- **A warm hand-off if it is not working out.** If the contributor is stuck or
  the issue turns out to be larger than it looked, the mentor either splits the
  issue into smaller pieces or introduces the contributor to whoever is picking
  up the rest, in the thread, with context. The contributor is never left with
  an open pull request and no reply.
- **A replacement mentor if the mentor is unavailable.** If the named mentor is
  unavailable for more than five business days, maintainers reassign the issue
  and say so in the thread. An issue keeps the label only while it has a mentor;
  if no mentor is available, the label is removed and the reason is recorded,
  rather than leaving an unmentored promise.
- **Recognition.** The mentor's support is credited in the pull request, in line
  with `Governance/policies/ATTRIBUTION.md` and the recognition practice in
  `Governance/RECOGNITION.md`.

## Label Lifecycle

- **Applied** during triage once the criteria are met and a mentor is named.
- **Removed** when the issue is closed or its pull request is merged, or when
  the issue stops meeting the criteria, such as when the scope grows into
  disqualifying territory. Removal is recorded in the thread with a one-line
  reason; the label is never stripped silently.
- **Downgraded, not deleted, when it is outgrown.** An issue that turns out to
  need authentication work or a data migration keeps its history and moves to
  `help wanted` or a backlog label, with the reason stated.
- **Kept visible.** Issues labelled `good first issue` are listed in the
  newcomer view of the issue tracker, and the project aims to keep at least
  three open at all times so newcomers always have a choice.

## Ownership and Exceptions

- Maintainers own this policy and this label. They decide whether an issue
  qualifies, who mentors it, and when the criteria need to change. Standing
  responsibility for issue health sits with maintainers under
  `Governance/roles/MAINTAINER.md`.
- Contributors own their side of the commitment: picking up an assigned issue,
  asking when they are stuck rather than going quiet, and responding to review.
  The expectations on both sides are set out in `Governance/roles/CONTRIBUTOR.md`.
- **Exception: none for disqualifying criteria.** Auth, payments, security,
  data migration, and build configuration are never offered as a first
  contribution, regardless of how small the diff looks or how enthusiastic the
  volunteer is. A maintainer who wants to take one on takes it on as a regular,
  fully reviewed contribution.
- **Exception: urgent fixes.** A small, high-priority fix may be labelled
  `good first issue` when it meets the criteria and a mentor is named, but it
  is never labelled `priority: high` at the same time, because the two
  commitments conflict.
- Changes to this policy are proposed in a pull request that touches only the
  `Governance/` folder, as `Governance/README.md` requires.

## Success

This policy is working when:

- At least three issues are labelled `good first issue` and open at any time.
- Every labelled issue names a mentor within three business days of the label
  being applied, with no unmentored labelled issues older than five business
  days.
- The median time from the label being applied to the first mentor reply is
  under one business day, and the median time to a first pull request review is
  under three business days.
- At least half of the contributors whose first merged pull request closed a
  `good first issue` label go on to open a second issue, measured each quarter.
- No issue labelled `good first issue` has ever turned out to touch
  authentication, payments, security, data migration, or build configuration.
- Contributors report that the label accurately predicted the difficulty of the
  work, checked in the project's regular contributor feedback.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | memplethee-lab (@memplethee-lab) |
