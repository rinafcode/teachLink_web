# Terms of Service Governance

## Purpose and Scope

This document governs how TeachLink Web owns, changes, approves, publishes,
and communicates changes to its Terms of Service. Clear governance helps ensure
that changes to service terms are deliberate, traceable, and understandable to
the users affected by them.

It applies to the user-facing Terms of Service for TeachLink Web and any
service terms presented as part of those terms. The repository does not
currently identify a version-controlled source location for the Terms of
Service; when one is established, maintainers must keep this governance process
aligned with that location.

This is a governance policy, not the Terms of Service themselves. It governs
ownership, changes, approvals, and user notifications; it does not replace or
set the substantive terms that users accept.

## Ownership and Responsibilities

Maintainers own this policy and are accountable for applying it. They must
designate a maintainer as the **Terms owner** to coordinate the Terms of
Service. Until one is designated, the maintainers share that responsibility.

- The Terms owner keeps the published Terms of Service accurate, coordinates
  proposed revisions, and ensures that the approved version and effective date
  are recorded.
- Maintainers review proposed changes for clarity, consistency with the
  repository's governance, and their potential effect on users.
- An independent maintainer is the authorized approver who gives final approval
  before a revision becomes effective.
- The Terms owner is responsible for coordinating any required user notice and
  recording evidence that it was issued. A maintainer may perform that work,
  but the Terms owner remains accountable for its completion.

## Change and Review Process

Terms of Service changes follow the repository's established issue and pull
request workflow:

1. A contributor or maintainer proposes the change in a pull request and links
   the relevant issue where one exists.
2. The proposal explains the reason for the change, the sections affected, the
   expected effect on users, and whether the change is material.
3. Maintainers review the proposal for clear language, consistency with the
   Terms of Service and governance, and possible user impact.
4. The change receives approval from the authorized maintainer under
   [Approval Requirements](../policies/APPROVAL_REQUIREMENTS.md).
5. Before publication, the approved revision records an effective date and a
   concise description of the approved change.
6. The pull request, review, approval, and resulting Git history preserve the
   change record.

Submission of a pull request, issue, draft, or comment does not make a proposed
change approved or effective. The current approved Terms of Service remain in
force until the approved revision reaches its stated effective date.

## Approval Requirements

An independent maintainer may approve a Terms of Service change and authorize
it to become effective. This satisfies the minimum approval requirement for a
Governance-only change; maintainers may request broader review when the change
is material or its impact is uncertain.

The author of a proposed change must not be its sole approver. A maintainer who
authored or materially contributed to the change cannot supply the independent
approval, unless an existing, recorded governance exception expressly permits
the path. Approval is recorded as an approving review on the pull request, not
only in private discussion or an unrecorded message.

Reviewers may reject a change or request revisions. The author addresses the
feedback on the pull request, or records why a requested change is not adopted
when reviewers agree. Material edits after approval require a fresh independent
review. Rejected proposals remain part of the issue or pull-request record and
do not become effective.

## User Notification Rule

Users must be notified of an approved Terms of Service change when it
materially affects their rights, obligations, use of the service, or another
important condition. Material changes require notice before the effective date,
with reasonable advance notice appropriate to the change's significance and to
any applicable legal requirement.

The notice must summarize the important changes, state the effective date, and
give users access to the updated Terms of Service. The Terms owner uses an
established, appropriate communication channel for affected users when one is
available. Notification content should also follow the
[Notification Content Policy](../domains/NOTIFICATION_CONTENT.md).

Minor editorial, formatting, or clarity corrections that do not materially
affect users may be recorded without a separate user notification. A legally
required notice period or notification method takes precedence over this
policy's general guidance.

## Versioning and Records

The repository's Git history and the associated pull request are the default
record for every revision. Maintainers preserve:

- the approved version of the Terms of Service, including its effective date;
- the pull request, review, and recorded independent approval;
- a concise change history identifying what changed and when it became
  effective; and
- evidence that required user notice was issued, including the date, channel,
  and notice content or a durable reference to it.

Records should contain only the information needed to establish that notice was
sent. They must not collect unnecessary personal information about recipients.
Retention and handling of records remain subject to the
[Record Retention and Legal Hold Policy](../policies/RECORD_RETENTION.md).

## Compliance and Exceptions

Changes to the Terms of Service must follow this policy. An exception requires
a written justification, approval by an authorized maintainer, and a record in
the associated pull request or issue describing its scope and reason.

An urgent legal, security, or service-protection change may use an expedited
review, consistent with the [Hotfix Process](../processes/HOTFIX.md), but it
still requires appropriate authorization. Expedited handling does not waive any
applicable legal notification requirement; any shortened notice or exception
must be recorded.

## Related Documents

- [Maintainer Role](../roles/MAINTAINER.md) defines maintainer decision
  authority and accountability.
- [Code Review Policy](../policies/REVIEW_POLICY.md) defines independent review
  and how requested changes are addressed.
- [Approval Requirements](../policies/APPROVAL_REQUIREMENTS.md) sets the
  minimum approval floor for Governance-only changes.
- [Record Retention and Legal Hold Policy](../policies/RECORD_RETENTION.md)
  governs retention of governance and decision records.
