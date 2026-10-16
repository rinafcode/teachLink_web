# Right-to-Erasure Policy

## Purpose

This policy explains how TeachLink Web handles requests from people who want
their personal data erased. It gives requesters a clear route and timeline and
gives maintainers one consistent procedure that respects legal obligations and
the limits of what the project can delete.

## Scope

This policy applies to erasure and deletion requests for personal data held by
the application, its backups, logs, and third-party processors acting for the
project. It applies whether the request comes through the application, by email,
or through a public channel. Retention periods and legal holds are governed by
the record retention and legal hold policy.

## How Requests Are Handled

A request is handled in these steps:

- **Intake.** A request is accepted through the privacy contact published in the
  [Privacy Notice governance](../domains/PRIVACY_NOTICE.md). A request posted in
  a public issue is moved to a private channel and the public text is removed,
  because it may contain personal data.
- **Triage.** A maintainer acknowledges the request, assigns an owner, and
  records it in the request log with the date received.
- **Assessment.** The owner identifies the data held, checks whether a legal
  hold or a legal retention duty applies, and decides whether to erase,
  partially erase, or refuse with reasons.
- **Action.** Data is erased from live systems and processors, and queued for
  removal from backups at the next backup rotation. Data that must be kept is
  restricted from further use and the requester is told why.
- **Confirmation.** The requester receives a written confirmation describing
  what was erased, what was kept and why, and when backups will be purged.

## Timelines

Targets, measured from the date the identity of the requester is verified:

- acknowledge the request within 3 business days;
- complete erasure from live systems and notify processors within 30 days,
  extendable once by up to 60 days for complex requests, with the requester told
  of the extension and reason before the first deadline;
- purge backups on their normal rotation and no later than the end of the
  documented backup retention period;
- if the request is refused in whole or in part, say so with the reasons within
  the same 30 days.

## Verification

Erasure is irreversible, so the requester's identity and authority are verified
first:

- Verify through the account the data belongs to (for example a confirmation
  sent to the registered email address), not by trusting the contents of the
  request.
- A request from someone acting for another person needs written authority from
  that person.
- Ask only for the minimum extra information needed to verify and delete it
  after the request closes.
- Never delete on the strength of an unverifiable request; explain what is
  needed to proceed.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The privacy owner reviews the request log each quarter to check that deadlines
  were met and that confirmation messages were sent.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This policy succeeds when every verified request is completed or answered with
reasons within the stated timelines, when no personal data is exposed in the
process, and when requesters always know what was erased and what was kept.
