# Record Retention and Legal Hold Policy

## Purpose

This policy sets how long TeachLink Web keeps records, how a record is preserved
when a legal or investigative obligation requires it, and how records are
disposed of when their retention ends. It keeps the project from holding data
longer than needed while ensuring records that matter can be produced.

## Scope

This policy applies to records the project creates or controls: governance and
decision records, moderation and conduct case files, security advisories and
incident records, financial records, access and audit logs, and personal data
held for users and contributors. Public repository history (commits, issues,
pull requests) is a public record and is not deleted under this policy except as
the [Security Policy](../SECURITY_POLICY.md) or a lawful erasure request
requires.

## Retention Schedule

The default retention periods are:

- **Governance and decision records** (RFCs, meeting minutes, votes): kept for
  the life of the project.
- **Security advisories and incident records:** kept for 7 years.
- **Conduct and moderation case files:** kept for 3 years after the case closes,
  or longer where a sanction remains in force. Access is limited to those
  handling the case.
- **Financial and treasury records:** kept for 7 years, or longer if local law
  requires.
- **Access and audit logs:** kept for 12 months online, then archived or
  deleted.
- **Personal data of users:** kept only while the account or purpose is active,
  then deleted or anonymised within 30 days of the end of that purpose, unless
  another row of this schedule or the law requires longer.
- A shorter or longer period may be set for a category by a recorded maintainer
  decision. Where laws conflict, the longer legal duty applies and is noted.

## Legal Hold

A legal hold suspends normal disposal for records that may be relevant to a
legal claim, investigation, regulatory request, or dispute:

- Any maintainer who learns of a reasonably anticipated claim or a formal
  request notifies the lead maintainers privately and promptly.
- The lead maintainers decide whether to issue a hold, define its scope (people,
  systems, date range, record types), and record it with the date.
- Custodians are told in writing to stop deleting in-scope records, including
  automated deletion jobs, which are suspended for the scope of the hold.
- Holds are reviewed every 6 months and released in writing only when the lead
  maintainers confirm the matter is concluded. Records then return to the normal
  schedule.
- Information about a hold is need-to-know and is not discussed in public
  channels.

## Disposal Rules

When a retention period ends and no hold applies:

- Records are deleted or irreversibly anonymised; "archived forever" is not a
  disposal method.
- Deletion covers copies: backups are purged at their next rotation, and
  processors are told to delete their copies.
- Disposal is carried out by the record owner, logged with the category, date,
  and method (but not the content), and spot-checked by a second maintainer.
- Records of sensitive categories are disposed of by methods that prevent
  recovery.
- Records are never disposed of early to avoid a request, a review, or a hold;
  doing so is a conduct matter under the [Code of
  Conduct](../CODE_OF_CONDUCT.md).

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The retention schedule is reviewed at least once a year, and the log of holds
  and disposals is reviewed at the same time.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when records are kept for the stated periods and no longer,
when holds are issued and released in writing, and when disposal is logged and
verifiable.
