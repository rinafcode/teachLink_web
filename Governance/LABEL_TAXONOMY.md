# Label Taxonomy

## Purpose

This document defines the label system for TeachLink Web: the categories labels
belong to, the meaning of every label, and the rules for applying, keeping, and
removing them. Labels are how the project says what an issue is, where it lives,
how urgent it is, and whether someone new can pick it up. Without a shared
taxonomy, a contributor cannot tell a two-line documentation fix from an
authentication rewrite, and the same issue gets triaged two different ways by
two different maintainers.

The taxonomy covers all 36 labels that currently exist in the repository, plus
the proposed labels marked "(to be created)" in the tables below. Proposed
labels are named here so that discussion is concrete; a proposed label takes
effect when maintainers create it and update this document in the same pull
request.

## Scope

This taxonomy applies to issues and pull requests opened in this repository. It
covers the labels maintainers attach during triage, the labels that are removed
when they stop being true, and the naming and cardinality rules that keep the
label set usable as it grows.

It does not cover pull requests or issues in other TeachLink repositories, the
separate `teachLink_backend` service, or GitHub's built-in state such as open,
closed, and draft. It does not grant permissions: GitHub's repository
permissions decide who is able to write a label at all, and the tables below
record who is *expected* to write it. Label choices never change the review,
merge, or branch-protection rules, which are set out in `CONTRIBUTING.md` and
`Governance/roles/MAINTAINER.md`.

## Category Overview

Every label belongs to exactly one category, and every category has a fixed
cardinality so that a label filter returns a meaningful set.

| Category | Cardinality | Question it answers | Exists? |
| --- | --- | --- | --- |
| Type | Exactly one | What kind of change is this? | Yes |
| Disposition | At most one | Why is this issue being closed? | Yes |
| Area | One or more | Which part of the product is it? | Partly |
| Priority | Exactly one | How soon does it need attention? | Yes |
| Status | At most one | What is blocking it right now? | Proposed |
| Effort | At most one | How much work is it? | Partly |
| Needs | Zero or more | What kind of help is wanted? | Yes |
| Security | At most one | Does it have a security impact? | Yes |
| Topic | Zero or more | Which engineering concern is it? | Yes |
| Program | Zero or more | Which campaign does it belong to? | Yes |
| Governance | Zero or more | Is it a governance change? | Yes |

A label that would fit two categories belongs to the category named in the
tables below and nowhere else. `frontend` is an area label, not a type label,
and `security` is a security label, not a topic label.

## Type

Exactly one type label is applied to every open issue. The type answers "what
kind of change is being asked for" and is the label most often used to build
queues, so it must be unambiguous.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `bug` | Existing behaviour deviates from the intended or documented behaviour | A user-visible or developer-visible defect is reported, including broken builds, wrong output, and error states | Maintainer at triage |
| `enhancement` | A change to a capability that already exists | A request improves, extends, or corrects an existing feature without adding a new one | Maintainer at triage |
| `feature` | A new user-visible capability | A request adds a capability that does not exist in any form today | Maintainer at triage |
| `documentation` | A change to documentation only | Docs, READMEs, guides, or the `Governance/` folder change and no runtime code does | Maintainer at triage |
| `test` | Adding, fixing, or improving tests with no production change | The pull request only touches test files, fixtures, or test configuration | Maintainer at triage or review |
| `refactor` | Restructuring code with no intended behaviour change | The diff moves, renames, or restructures code and the observable outcome is identical | Maintainer at triage or review |
| `chore` | Repository maintenance with no source change | Formatting, ignore-file updates, comment cleanups, or small configuration fixes | Maintainer at triage or review |
| `tech-debt` | Paying down known maintenance debt | Work is tracked to reduce a cost the project has already accepted, such as duplication or dead code | Maintainer at triage |
| `dependencies` | A change to a dependency file | A pull request updates a lockfile, manifest, or version pin | Maintainer at review |
| `cicd` | Build, release, or delivery pipeline work | Work changes a workflow, a build script, a release job, or pipeline configuration | Maintainer at triage |

Where `enhancement` and `feature` both appear to fit, the deciding question is
whether the capability exists today: if it does, it is an `enhancement`; if it
does not, it is a `feature`.

## Disposition

Disposition labels explain why an issue stops being worked on. They are applied
last, immediately before the issue is closed, and they are never combined with
`good first issue` or `help wanted`.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `duplicate` | The same problem is already tracked elsewhere | A search finds an existing issue that covers the report, and the existing issue is linked | Maintainer at triage |
| `invalid` | The report does not describe a problem in this project | The report is about another project, or the described behaviour is the documented behaviour | Maintainer at triage |
| `wontfix` | Valid, but the project will not act on it | The work is real but outside scope, or the cost is not justified; the reasoning is recorded in the thread | Maintainer at triage |
| `question` | More information is needed before work can start | The reporter must supply a reproduction, expected behaviour, or environment first | Maintainer at triage |

A `question` label is removed as soon as the reporter answers, and the issue
then takes a type label. Closing an issue for any other reason requires a type,
area, and priority label so the history stays searchable.

## Area

Area labels say which part of the product is affected. At least one area label
is applied whenever the affected area can be identified; cross-cutting issues
carry more than one.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `frontend` | Next.js application code in `src/`, `pages/`, or `lib/` | The change is in the web client itself, as opposed to infrastructure or documentation | Maintainer at triage |
| `area: ui` (to be created) | Components, layout, and the design system | The work is visual or structural in the interface layer | Maintainer at triage |
| `area: i18n` (to be created) | Translation files and locale handling | The work changes strings, locales, or translation plumbing | Maintainer at triage |
| `area: pwa` (to be created) | Service worker, manifest, offline behaviour | The work touches installability, offline support, or caching | Maintainer at triage |
| `area: seo` (to be created) | Metadata, sitemap, and crawl behaviour | The work changes how search engines see the site | Maintainer at triage |
| `area: docs` (to be created) | Documentation outside the `Governance/` folder | The work targets READMEs, guides, or the contributor documentation | Maintainer at triage |
| `area: infra` (to be created) | Containers, Kubernetes, and infrastructure directories | The work is in `Dockerfile*`, `k8s/`, `charts/`, `infra/`, or `infrastructure/` | Maintainer at triage |

`frontend` already exists with a narrower meaning than its description suggests,
so it is treated here as the fallback area label for application code. The
proposed `area:` labels refine it rather than replace it.

## Priority

Exactly one priority label is applied to every open issue. Priority expresses
urgency for the project, not effort or enthusiasm, and it is the label a
contributor watches to understand what the project needs next.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `priority: high` | Work is needed in the current cycle | The issue blocks a release, a user journey, a quality gate, or an accessibility or privacy requirement | Maintainer at triage |
| `priority: medium` | Work is needed in a planned cycle | The issue is a real gap with a known workaround and no active deadline | Maintainer at triage |
| `priority: low` | Work is desirable and unbounded | The issue is a nice-to-have, cosmetic change, or long-term cleanup | Maintainer at triage |

Priority is reviewed at every triage pass and at least monthly, so a label set
in January does not survive unchanged until December. Security reports that
reach triage are handled under the process in
`Governance/processes/VULN_DISCLOSURE.md` and follow that process's timing
rather than the priority label.

## Status

Status labels are a proposed addition and are the mechanism that replaces
scrolling through stale issues. At most one status label is applied, and the
label names the single thing currently blocking progress.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `status: needs-triage` (to be created) | The issue has not been assessed yet | Applied when the issue is opened and cleared during the first triage pass | Maintainer at triage |
| `status: needs-repro` (to be created) | The report cannot be acted on without a reproduction | Applied when the description is plausible but untested | Maintainer at triage |
| `status: needs-info` (to be created) | Waiting on the reporter or on a decision from another team | Applied when the next action is not the contributor's | Maintainer at triage |
| `status: needs-decision` (to be created) | A design or scope decision is required before work starts | Applied when the change would need an RFC under `Governance/processes/RFC_PROCESS.md` | Maintainer at triage |
| `status: ready` (to be created) | Scoped, unblocked, and available | Applied when a newcomer or contributor can start without further questions | Maintainer at triage |
| `status: in-progress` (to be created) | Work is underway | Applied on assignment and kept until the pull request merges or is abandoned | Maintainer at triage or review |
| `status: blocked` (to be created) | Work cannot proceed | Applied when the blocker is recorded in the thread with an owner | Maintainer at triage |

Status labels are the only labels routinely cleared: all `status:` labels are
removed when an issue is closed or when its pull request is merged. A stale
status label is worse than no status label, because it hides real work.

## Effort

Effort labels estimate size, not importance. At most one is applied, and it is
what a contributor uses to judge whether an issue fits in an afternoon.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `intermediate` | Moderate difficulty; some existing context needed | The work needs familiarity with the area but follows an established pattern | Maintainer at triage |
| `effort: small` (to be created) | A few hours or less for an unfamiliar contributor | The change is local, has no new concepts, and is verified in one step | Maintainer at triage |
| `effort: large` (to be created) | Multi-day work, or spanning several files or subsystems | The change needs design, migration, or coordination | Maintainer at triage |

`good first issue`, defined in `Governance/policies/GOOD_FIRST_ISSUE.md`, is the
lowest end of the effort scale and is managed by that policy rather than by this
table. The two never disagree: an issue may not be both `good first issue` and
`effort: large`.

## Needs

Needs labels state what kind of help an issue wants. They are optional and
chosen from the contributor's side of the fence, not from the maintainers' queue.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `good first issue` | Small, well-scoped work suitable for a first contribution | The issue meets every criterion in `Governance/policies/GOOD_FIRST_ISSUE.md` | Maintainer at triage, never the author |
| `help wanted` | Extra attention is welcome from anyone | The work is real, prioritised, and not currently owned by a contributor | Maintainer at triage |

`good first issue` implies `help wanted`. Maintainers apply `help wanted` alone
when the work is too large, too sensitive, or too new for a first contribution.

## Security

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `security` | A confirmed issue with a security impact | Applied after maintainers confirm the report and agree it is safe to discuss in public | Maintainer at triage |

A suspected vulnerability is not labelled `security` on a public issue while it
is still a report. Public issues are indexed, cached, and forwarded, and a
label confirms to a reader that a weakness is being worked on. Reports arrive
through the private channel in `Governance/processes/VULN_DISCLOSURE.md`, and
`security` is applied only after that process decides the issue can be
discussed. Issues that reach triage with a security dimension but no report are
treated as ordinary bugs until maintainers say otherwise.

## Topic

Topic labels are secondary signals used to find work. They never replace a type
label, and an issue may carry several.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `performance` | Runtime or bundle performance work | The issue is about speed, responsiveness, or resource use | Maintainer at triage |
| `optimization` | Performance or efficiency improvement | The issue improves an existing path rather than addressing a measured regression | Maintainer at triage |
| `monitoring` | Observability and error tracking | The issue concerns logging, tracing, alerting, or dashboards | Maintainer at triage |
| `javascript` | JavaScript or TypeScript source changes | Applied to pull requests that change application source in a JavaScript or TypeScript file | Maintainer at review |

`performance` and `optimization` overlap by design: a measured regression is
`performance`, a general improvement is `optimization`. When both would apply,
maintainers apply `performance` and mention the distinction in the thread.

## Program

Program labels belong to external campaigns and funding programmes. They are
set by the programme's own tooling or by the maintainer running that campaign,
and they carry no engineering meaning.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `Stellar Wave` | Tracked in the Stellar wave programme | Set when an issue is registered with that programme | Programme tooling or maintainer |
| `ODHack14` | Tracked in the ODHack 14 programme | Set when an issue is registered with that hackathon | Programme tooling or maintainer |
| `GrantFox OSS` | Tracked in GrantFox OSS | Set for issues mirrored into the GrantFox tracker | Programme tooling or maintainer |
| `Third Campaign` | Tracked in the third campaign | Set for issues that belong to that campaign | Programme tooling or maintainer |
| `onlydust-wave` | Tracked in an onlydust wave | Set for issues included in an onlydust wave | Programme tooling or maintainer |
| `Maybe Rewarded` | May be eligible for a GrantFox reward | Set when the issue is a candidate for reward, pending review | Maintainer |
| `Non-Rewarded` | Explicitly not eligible for a reward | Set when a requester asks and the answer is no, with the reason in the thread | Maintainer |

`Maybe Rewarded` and `Non-Rewarded` are mutually exclusive. Removing a
programme label is a campaign decision, not a triage decision, and a maintainer
who is unsure leaves it in place.

## Governance

Governance labels mark work on the `Governance/` folder itself, as described in
`Governance/README.md`.

| Label | Meaning | When to apply | Applied by |
| --- | --- | --- | --- |
| `governance` | Project governance: policies, roles, processes | Any change to the `Governance/` folder | Maintainer at triage |
| `policy` | A governance policy document | The change adds or edits a document in `Governance/policies/` | Maintainer at triage |
| `process` | A governance process or workflow | The change adds or edits a document in `Governance/processes/` | Maintainer at triage |

A governance change is also labelled `documentation`, because that is what it
is in the repository. It is never labelled `feature`; a new governance
document is not a new user-facing capability.

## Application Rules

These rules are what make the taxonomy usable rather than decorative.

- **Authors request, maintainers apply.** A contributor may ask for a label in
  the issue thread. Nobody, including maintainers, labels their own issue or
  pull request; a maintainer asks another maintainer instead. This keeps
  `good first issue` and `security` trustworthy.
- **One label per constrained category.** Type and Priority are exactly one.
  Disposition, Status, and Effort are at most one. Needs, Topic, Program, and
  Governance are zero or more. An issue with two type labels is mislabelled by
  definition.
- **Disposition last.** `duplicate`, `invalid`, and `wontfix` are applied
  immediately before closing, and they are removed from any issue that is
  reopened.
- **Labels are removed when they stop being true.** A label is not a promise
  about the future. When an issue stops being urgent, the priority label is
  downgraded; when a `bug` turns out to be a `question`, the type label changes
  in the same edit.
- **Status is cleared on close.** All `status:` labels are removed when the
  issue is closed or the pull request is merged. Every other label is kept as
  history.
- **Eight labels maximum.** An issue carrying more than eight labels is a
  maintainer decision, not an invitation to keep adding labels. The cap exists
  so that filtering stays useful as the label set grows.
- **Naming is fixed.** Type, area, status, effort, and priority labels are
  lowercase, and any two-part label uses a colon and one space, matching the
  existing `priority: high`. Ad-hoc free-text labels are not added.
- **New labels come with a document update.** A new label is created in a pull
  request that also updates this document, states the category, and gives the
  meaning and the applying role. A label without that entry does not exist as
  far as the project is concerned.
- **Triage cadence.** A maintainer reviews open issues at least weekly and
  applies type, priority, and area to any new issue within five business days.
  The rules for that pass are described in the triage process in
  `Governance/processes/TRIAGE.md`.

## Ownership and Exceptions

- Maintainers own this taxonomy. They decide which category a new label joins,
  approve the eight-label cap, and grant the exceptions below. Issue health is
  their standing responsibility under `Governance/roles/MAINTAINER.md`.
- Contributors own the accuracy of their reports: a contributor who finds a
  stale or wrong label says so in the thread, and a maintainer fixes it.
- Changes to this document are proposed in a pull request that touches only the
  `Governance/` folder, as `Governance/README.md` requires.
- **Exception: campaign tooling.** Programme tooling may set and remove
  `Program` labels in bulk without maintainer review, because those labels
  carry no engineering meaning. Nothing else is exempt from the rules above.
- **Exception: embargoed security work.** Where a fix is prepared under an
  embargo, maintainers may defer triage and `priority` labelling until the
  disclosure date, provided the embargo is recorded in the tracking issue.

## Success

This taxonomy is working when:

- At least 90% of open issues carry a type label, a priority label, and an area
  label, checked at each triage pass.
- No open issue carries two labels from a category whose cardinality is
  exactly one, and none carries more than eight labels in total.
- A contributor can go from the issue list to a filtered view of approachable
  work in one click, using `good first issue` and the effort labels, without
  asking a maintainer what a label means.
- The median time from issue creation to first label is at most five business
  days.
- The repository's real label set matches this document, so no label in use is
  undefined and no documented label is missing.

## Revision history

| Version | Date | Change | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-09-25 | Initial version. | memplethee-lab (@memplethee-lab) |
