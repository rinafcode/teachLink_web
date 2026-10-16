# Privacy Policy Governance

## Purpose

This document governs the privacy policy that TeachLink Web publishes to its
users: who owns it, how it is updated and reviewed, and how its versions are
tracked. It ensures the published policy always matches what the project
actually does with personal data, and that users are told when it changes. This
document is a governance statement, not legal advice; maintainers consult
qualified counsel before relying on it for a legal decision.

## Scope

This document applies to the user-facing privacy policy and to any notice that
describes how personal data is collected, used, shared, or retained. The content
rules for the notice are in the [Privacy Notice
governance](../domains/PRIVACY_NOTICE.md); consent rules are in the [Cookie and
Consent governance](../domains/COOKIE_CONSENT.md); and what data may be
collected is in [Analytics Data Collection](../domains/ANALYTICS_DATA.md).

## Ownership

Responsibility for the privacy policy is clear:

- A maintainer is named **privacy owner**, is responsible for the accuracy of
  the published policy, and acts as the contact for privacy questions.
- A second maintainer is named **deputy** so the role is never vacant; both are
  recorded in the maintainer records.
- Counsel or an external privacy adviser is consulted for material changes, new
  jurisdictions, and legal requests.
- The privacy owner does not approve their own changes; another maintainer
  reviews every edit.
- If no owner is in place, the lead maintainers act as owners until one is
  appointed within 30 days.

## Update and Review Process

The policy changes only through a controlled process:

- **Trigger.** A change to what data is collected, why, who receives it, where
  it is stored, or how long it is kept requires an update before the change
  ships. Legal changes, a new vendor, or an incident can also trigger one.
- **Draft.** The privacy owner proposes the change in a pull request that
  explains what changed and why, with a plain-language summary of the effect on
  users.
- **Review.** At least two maintainers review it, one of them independent of the
  change. Material changes also get input from counsel and are open to community
  comment for at least 14 days, unless an urgent legal or security reason
  shortens it.
- **Publication.** The approved policy is published with its version and
  effective date, and users are notified of material changes at least 30 days
  before they take effect where the law or the change makes this appropriate.
- **Scheduled review.** The policy is reviewed at least once a year even if
  nothing has changed, and the review is recorded.

## Versioning

Every published policy has a version and an archive:

- Versions use `MAJOR.MINOR`: a **major** version changes what is collected, the
  purposes, or users' rights; a **minor** version corrects wording without
  changing meaning.
- Each version shows its number, effective date, and a short change log at the
  top of the published policy.
- Earlier versions are kept in an accessible archive so a user can see what
  applied when they signed up or consented, which supports the consent records
  described in the consent management policy.
- Changes that need new consent trigger a new consent request instead of relying
  on the earlier one.
- The version in the product, the repository, and any translation must match;
  mismatches are fixed as defects.

## Ownership and Review

- Maintainers own this document and are accountable for applying it
  consistently.
- The privacy owner reports to the maintainers each year on reviews done,
  changes made, and open privacy questions.
- Changes are proposed in a pull request that touches only the `Governance/`
  folder and are reviewed like any other governance change (see the [Review
  Policy](../policies/REVIEW_POLICY.md)).
- This document is versioned with the repository and describes how the project
  actually operates rather than an aspiration.

## Success

This document succeeds when the published privacy policy is accurate, owned, and
versioned, when users are told about material changes in time, and when every
past version can be retrieved.
