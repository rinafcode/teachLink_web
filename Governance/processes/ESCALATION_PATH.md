# Escalation Path

## Purpose

This process defines how a concern in TeachLink Web moves up from the
thread where it started to the people with the authority to resolve
it. It names the escalation tiers, the contact at each tier, and the
response SLAs every tier commits to, so a contributor never has to
guess who to approach next or how long a reply should take.

## Scope

This process applies to concerns raised in issues, pull requests, and
community channels of this repository: unanswered reports, stalled
reviews, disputes, and conduct or safety matters.

It is the general escalation reference. The narrower documents stay
authoritative for their own paths: interpersonal and technical
disputes follow `Governance/processes/CONFLICT_RESOLUTION.md`,
appeals of conduct enforcement follow `Governance/COC_APPEALS.md`,
issue routing and first response follow
`Governance/processes/TRIAGE.md`, and vulnerability reports follow
`Governance/SECURITY_POLICY.md` and
`Governance/processes/VULN_DISCLOSURE.md`. Where this document and a
narrower one overlap, the narrower one governs its own path and this
document governs the tiers, contacts, and SLAs shared by all of them.

## Escalation Tiers

Escalation moves one tier at a time, and the record travels with it:
the new tier sees the same thread, the same evidence, and what has
already been decided, and does not restart the discussion.

### Tier 1. Working level

The contributor, reviewer, or issue triager already involved in the
thread. Every concern starts here, raised in the open in the same
issue, pull request, or channel where it arose.

### Tier 2. Maintainers

The maintainers, as defined in `Governance/roles/MAINTAINER.md`. They
review the record and answer with a recorded decision with reasoning,
or a dated commitment to act.

### Tier 3. Project leadership

The maintainers acting collectively as project leadership. A matter
reaches this tier when it involves a maintainer as a party, when the
maintainers cannot resolve it impartially, or when a Tier 2 decision
is contested with new evidence. This is the terminal tier: its
recorded decision closes the escalation path for that matter.

### Fast track. Security, privacy, and safety

Security, privacy, or safety concerns never queue in the tiers above.
They go straight to the private channel in
`Governance/SECURITY_POLICY.md` and are handled immediately by the
Security Response Team under `Governance/SECURITY_RESPONSE_TEAM.md`.
A report of self-harm or violence is redirected to appropriate help,
not processed as a repository defect.

## Contacts at Each Tier

Each tier has one named contact, reached as follows:

- **Tier 1.** The assignee, reviewer, or issue triager on the thread,
  reached by a reply in the same issue, pull request, or channel.
- **Tier 2.** Any maintainer, reached by a reply in the same thread
  requesting maintainer review.
- **Tier 3.** Project leadership, reached by a request in the thread;
  maintainers carry the matter to leadership on the requester's
  behalf.
- **Fast track.** The security contact for the current quarter,
  backed by the Security Response Team, reached through the private
  vulnerability reporting channel, with the fallbacks in
  `Governance/SECURITY_POLICY.md`.

No separate public list of personal contact details is maintained;
the maintainers' repository access list is the authoritative roster,
as `Governance/SECURITY_RESPONSE_TEAM.md` states. Conduct matters
that cannot be discussed in the open use the private conduct channel
named in the decision notice, as `Governance/COC_APPEALS.md`
describes, and a maintainer may escalate on behalf of a party who
cannot safely raise the matter alone.

## Response SLAs

Each tier commits to a first human response within its window. The
clock starts when the escalation is raised, not when it is read.

- **Tier 1.** First response in 3 business days: a reply, or a
  dated next step, in the thread.
- **Tier 2.** First response in 5 business days: a recorded
  decision with reasoning, or a dated commitment to act.
- **Tier 3.** Acknowledgement in 3 business days, then a recorded
  decision within 10 business days of the acknowledgement.
- **Fast track.** First response in 1 business day (24 hours),
  then the outcome deadlines in `Governance/SECURITY_POLICY.md`.

When a deadline cannot be met,
the person waiting is told before it passes, with the reason and a
new date. A missed deadline without notice is recorded in the thread
and counted in the quarterly review described in
`Governance/processes/TRIAGE.md`.

## Escalation Rules

- Escalate one tier at a time. A tier is skipped only for the fast
  track, and the reason for any skip is recorded in the thread.
- The record travels with the escalation; the new tier does not
  restart the discussion or ask the requester to restate it.
- A party may request re-review once, with new evidence. After that,
  the recorded decision stands unless new facts emerge.
- Escalation is about the matter, not the person. Retaliation against
  anyone for escalating, or for taking part in an escalation, is
  treated as a fresh conduct matter.
- A matter may be handed back to a lower tier when the higher tier's
  input resolves what was blocking; the hand-back and its reason are
  recorded in the thread.

## Ownership

- Maintainers own this process and are accountable for meeting the
  response SLAs at every tier, as set out in
  `Governance/roles/MAINTAINER.md`.
- Changes to this process are proposed in a pull request that touches
  only the `Governance/` folder.

## Success

This process succeeds when every contributor knows the next contact
before they need one; when each escalation has a named owner and a
deadline; when decisions are recorded with reasoning; and when
raising an escalation never leads to retaliation.

## Regression Tests

Coverage is provided by `Governance/processes/ESCALATION_PATH.test.ts`,
which pins the escalation tiers, the contacts at each tier, and the
response SLAs in this document.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-27 | Initial version. | TeachLink maintainers |
