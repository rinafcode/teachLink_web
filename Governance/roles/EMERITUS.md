# Emeritus Role

## Purpose

This document defines emeritus status in TeachLink Web: what it means to be
emeritus, which privileges are retained and which are removed, and how the
status is granted. It closes a governance gap by making this status explicit and
self-contained in the `Governance/` folder.

## Scope

Emeritus status applies to people who previously held a defined role in
`Governance/roles/` (for example contributor, issue triager, moderator,
maintainer, or treasurer) and have stepped down from active duty while wishing
to remain associated with the project in a limited capacity. It does not create
a new voting role and does not override other policies.

## Emeritus Status

Being emeritus means a person is no longer actively responsible for the duties
of their former role, but the project recognizes their past service. The status
is honorary and opt-in: it is granted at the request of the former role holder
or by mutual agreement when stepping down.

## Retained and Removed Privileges

- **Retained.** Emeritus members may be listed in project recognition
  materials per `Governance/RECOGNITION.md`, receive appropriate attribution,
  and continue to be consulted informally if they consent. They may also
  participate in discussions as community members.
- **Removed.** Emeritus members do not hold the duties, access rights, or
  decision authority of the former role unless explicitly reappointed. They are
  not counted toward quorum for decisions reserved to maintainers or other role
  holders unless a specific policy states otherwise. Any system access tied to
  the role is revoked or converted to community-level access as appropriate.

## How the Status Is Granted

- **Request.** A person eligible for emeritus status (or their designee in
  consultation with maintainers) requests it when stepping down from an active
  role. The request may be part of a nomination/removal outcome or a separate
  request recorded in a public issue.
- **Process.** The maintainers record the transition in a public issue,
  confirm the retained/removed privileges with the individual, and update role
  records to reflect emeritus status. When stepping down from a role governed
  by `Governance/processes/NOMINATION.md`, the nomination outcome may document
  emeritus status.
- **Documentation.** The decision and rationale are recorded in the public
  thread with the individual's consent. Recognition follows
  `Governance/RECOGNITION.md`.

## Ownership

Maintainers own this role definition and updates to it. Changes to this
document are proposed in a pull request that touches only the `Governance/`
folder.

## Success

This status succeeds when transitions are clear and respectful, when service is
recognized without implying ongoing responsibility, and when former role holders
understand exactly what remains and what does not.

## Regression Tests

Regression coverage for this role lives in
`Governance/roles/EMERITUS.test.ts`. It verifies the document structure,
required sections, line length, absence of placeholders, references to
recognition and nomination processes, and the explicit grant process.

## Revision History

| Version | Date       | Change           | Author                |
| ------- | ---------- | ---------------- | --------------------- |
| 1.0     | 2026-09-28 | Initial version. | TeachLink maintainers |
