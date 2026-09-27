# Roadmap Governance Process

## Purpose

This process defines how the TeachLink Web roadmap is proposed, how roadmap
changes are approved, and how often the roadmap is reviewed. The roadmap is the
project's public statement of where it is going, so it must be shaped by
evidence, decided by accountable people, and corrected when reality moves
faster or slower than the plan.

## Scope

This process applies to every item that appears on the roadmap, from the initial
proposal through to the item being declared shipped, deferred, or declined. It
covers the horizons, the proposal format, approval, and the review cadence. It
does not govern the work inside a roadmap item: execution is planned in
milestones under `Governance/processes/MILESTONE_GOVERNANCE.md`, structural
changes are designed under `Governance/processes/RFC_PROCESS.md`, and releases
follow `Governance/processes/RELEASE_SIGNOFF.md`.

## Horizons and Item States

Roadmap items are grouped into three horizons, each with a defined time window
and capacity limit:

- **Now** — the current quarter. At most **five** items at a time, so that the
  near-term plan stays small enough to be credible.
- **Next** — the following two quarters. At most **ten** items.
- **Later** — anything beyond that. Directionally described, no dates, and
  capped at **25%** of all items so the list cannot grow without limit.

Every item carries one of five states: **Proposed**, **Planned**, **In
progress**, **Shipped**, or **Declined**. An item also carries a **Deferred**
marker naming the horizon it was pushed to, so nothing disappears quietly. Items
move to Shipped only when the work is merged and announced; an item whose work
stalled is marked Deferred with a reason, not left In progress forever.

## Proposing a Roadmap Item

Any contributor may propose an item. Proposals are filed as GitHub issues with
the `roadmap` label and contain:

- **The problem and the users affected,** stated in terms from the project's
  scope in `Governance/SCOPE.md` and its values in `Governance/VALUES.md`.
- **The proposed outcome,** not the solution, plus at least one alternative
  that was considered and why it was not chosen.
- **Evidence,** such as issue counts, contributor reports, or a measurable
  signal from the project's own metrics.
- **A size estimate** and the **maintenance cost** the item creates after it
  ships.
- **The requested horizon** and the reason for that placement.

A maintainer who supports a proposal opens the tracking issue as **Proposed**
and schedules it for the next roadmap review. Proposals with no evidence and no
maintainer sponsor are closed with a short explanation rather than left open.

## Approving Roadmap Changes

Roadmap changes are approved at a roadmap review by maintainers. A change is
approved when:

- At least **two** maintainers approve it, and at least one of them is not the
  proposal's sponsor.
- The item fits a horizon that is below its capacity limit, or the review
  explicitly moves an item out of that horizon to make room.
- The item is within the project scope and does not conflict with an accepted
  RFC or an existing commitment in another horizon.
- For items that add a permanent capability, the ongoing ownership and
  maintenance commitment is named with the item.
- Security-sensitive items are reviewed by the maintainer acting as security
  contact, and any item that would require early disclosure follows
  `Governance/policies/EMBARGO.md`.

Items that miss these criteria are Declined, with the reasoning recorded on the
tracking issue. Contributors may revise a Declined item and repropose it; the
decision record from the first attempt is kept. Roadmap approval is not a
commitment to a date, and a date is only stated for items in the Now horizon.

## Review Cadence

- **Fortnightly maintainer sync.** Roadmap is a standing agenda item. The sync
  reviews state changes, items that have not moved, and anything that has
  slipped out of the Now horizon.
- **Quarterly roadmap review.** A scheduled session held in the first two weeks
  of each quarter. It re-prioritises the Now and Next horizons, moves or
  declines items that no longer deserve their place, and publishes the outcome.
- **Monthly roadmap publication.** The roadmap is republished at the end of each
  month from the tracking issues, so the public view does not drift from the
  issue state.
- **Off-cycle reviews.** A roadmap review is convened within **five working
  days** when a material change is needed: a security event, a loss or gain of
  maintainer capacity, a dependency change that invalidates a direction, or a
  request from a funding or treasury decision. An off-cycle review records the
  same approvals as a scheduled one.

## Ownership and Exceptions

- **Maintainers** own this process, call reviews, approve changes, and are
  accountable for keeping the published roadmap honest, as set out in
  `Governance/roles/MAINTAINER.md`.
- **The roadmap editor** is a maintainer named in each quarterly review. The
  editor records decisions, maintains horizon limits, and publishes the monthly
  view.
- **Item sponsors** are the maintainers who placed an item on the roadmap. A
  sponsor whose item has not moved for two consecutive syncs is asked to
  rescope, re-justify, or release the slot.
- **Contributors** may propose items, and may ask for a review when a proposal
  has sat in Proposed for more than **30 days**.
- **Treasury** decisions that commit funds affect roadmap capacity, and are
  recorded per `Governance/roles/TREASURER.md`.
- **Exceptions.** A maintainer may place an urgent item outside the capacity
  limits when waiting for the next review would harm users, provided the reason
  is recorded on the tracking issue and the horizon is restored at the next
  scheduled review. No exception may be granted silently or renewed twice
  without a full review.

## Success

This process succeeds when the roadmap reflects what maintainers actually
intend to build, when every item is traceable to an issue and a decision, when
items that stopped mattering are removed in the open rather than quietly, and
when contributors can see why a request is on the roadmap, or why it is not.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | Aliyu Ibrahim (@ykargeee-bit) |
