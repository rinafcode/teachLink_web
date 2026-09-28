# Contributor Offboarding Process

## Purpose

This process defines how TeachLink Web handles the transition when a
contributor, reviewer, or maintainer leaves the project — voluntarily,
through inactivity, or through removal. It specifies the access revocation
steps, the knowledge handover expectations, and the timeline within which
each step must be completed. Writing it down means departures are handled
consistently, the project's history is preserved, and former contributors
leave with a clear record of their work.

## Scope

This process applies to every named role defined under `Governance/roles/`:
Contributor, Reviewer, Maintainer, and any working-group lead or domain
steward recognised in a governance document. It covers three offboarding
triggers:

- **Voluntary departure.** The role-holder informs the project that they
  are stepping down or reducing participation below the threshold defined
  in `Governance/policies/INACTIVITY.md`.
- **Inactivity-triggered.** The role-holder has been found inactive under
  `Governance/policies/INACTIVITY.md` and the notification window has
  closed without a qualifying response.
- **Role removal.** The role-holder has been removed through a maintainer
  decision following `Governance/processes/CONFLICT_RESOLUTION.md` or a
  privilege revocation process.

It does not cover account deletion, repository archival, or the
dissolution of a working group, which are governed by separate documents.

## Offboarding Triggers and Initiation

Offboarding begins when one of the following events is recorded on a
public GitHub issue:

- The role-holder opens or comments on an issue stating their intent to
  depart (voluntary departure).
- A maintainer closes the inactivity tracking issue with a confirmed
  status change (inactivity-triggered).
- A maintainer records a removal decision on the relevant issue
  (role removal).

A maintainer acknowledges the offboarding within **3 business days** of
the trigger event, opens a dedicated offboarding tracking issue titled
`Offboarding: [role] — @[handle]`, and links the trigger. All subsequent
steps are recorded on that issue.

## Access Revocation

Access revocation is applied in proportion to the role being offboarded.
All steps must be completed within **5 business days** of the offboarding
issue being opened.

- **Contributor.** No repository access is changed. The contributor's
  entry in any contributor list or attribution file is marked inactive,
  and the contribution history is retained.
- **Reviewer.** The role-holder is removed from the CODEOWNERS file and
  any review-assignment rotation. Repository read access is retained.
- **Maintainer.** The role-holder is removed from the CODEOWNERS file,
  the maintainer team, and any elevated repository permissions (write,
  admin). Repository read access is retained unless a removal decision
  specifies otherwise. Individually held third-party service tokens and
  secrets (CI, cloud credentials, package-registry tokens) are rotated
  within **24 hours** of offboarding being confirmed. Shared credentials
  are rotated within **5 business days**.
- **Working-group lead / domain steward.** The role-holder is removed
  from the lead position. If no active co-lead exists, the working group
  moves to a caretaker state under the maintainer team until a new lead
  is appointed per the relevant working-group charter.

Every revocation step is ticked off on the offboarding tracking issue by
the maintainer who completed it. The issue is not closed until all steps
are recorded.

## Knowledge Handover

Before or concurrently with access revocation, the departing role-holder
is asked to complete a knowledge handover. The handover is optional for
contributors (the merged history is self-documenting) but expected for
reviewers and required for maintainers and working-group leads.

A maintainer contacts the departing role-holder on the offboarding issue
within **3 business days** of it being opened and asks for:

- **Open work.** A comment or linked document listing any open pull
  requests, in-progress issues, or unresolved action items the
  role-holder owns, so they can be reassigned or closed.
- **Institutional knowledge.** Any context not captured in the
  repository — recurring tasks, vendor contacts, tooling notes, or
  decisions that live only in the role-holder's memory — documented in
  a comment or a pull request to the relevant `Governance/` or `docs/`
  file.
- **Keys and credentials.** Confirmation that any individually held
  secrets have been rotated or transferred.

The handover window is **10 business days** from the offboarding issue
opening. If the role-holder does not respond, the maintainer documents
what is known on the issue and proceeds. The project does not hold
offboarding open indefinitely waiting for a response.

## Timeline Summary

The table below lists every step, its owner, and the deadline from the
point each step's clock starts.

- Acknowledge trigger; open tracking issue — Maintainer,
  within 3 business days of trigger.
- Contact role-holder for knowledge handover — Maintainer,
  within 3 business days of issue opening.
- Complete access revocation — Maintainer,
  within 5 business days of issue opening.
- Rotate individually held secrets (maintainer role) — Maintainer,
  within 24 hours of offboarding being confirmed.
- Rotate shared credentials (maintainer role) — Maintainer,
  within 5 business days of offboarding being confirmed.
- Knowledge handover window closes — Role-holder,
  10 business days after issue opening.
- Close offboarding tracking issue — Maintainer,
  after all steps are recorded on the issue.

If any deadline cannot be met, the reason and a revised date are posted
on the offboarding tracking issue before the deadline passes.

## Ownership

- Maintainers own this process and are responsible for opening and
  closing offboarding tracking issues. The responsibilities of the
  Maintainer role are defined in `Governance/roles/MAINTAINER.md`.
- A change to this process is proposed in a pull request that touches
  only the `Governance/` folder.
- This process is reviewed alongside `Governance/policies/INACTIVITY.md`
  whenever inactivity thresholds or consequence steps are revised.

## Success

This process succeeds when every departure is recorded on a public
tracking issue, no role-holder loses access without a documented reason,
secrets are rotated on the committed timeline, and open work is handed
over so no in-flight contribution is lost when a role-holder leaves.

## Regression Tests

Regression coverage for this process lives in
`Governance/processes/OFFBOARDING.test.ts`. It pins the offboarding
triggers, access revocation steps, knowledge handover requirements, and
the timeline commitments to this document so they cannot silently
regress — for example, an edit that removes the secret-rotation deadline,
drops the tracking-issue requirement, or relaxes the handover window
fails CI.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-28 | Initial version. | TeachLink maintainers |
