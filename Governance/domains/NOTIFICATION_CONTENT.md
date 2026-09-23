# Notification Content Policy

## Purpose

This policy defines how notification content is produced, scheduled, and
delivered to users of TeachLink Web. It sets consistent expectations for tone,
frequency, user control, and localization so that notifications stay useful and
respectful of the people receiving them.

## Scope

Notifications covered by this policy include in-app messages, push notifications,
email digests, and any other channel through which TeachLink Web communicates with
users outside of direct platform workflows.

## Tone and Frequency

- Notifications must use a clear, neutral, and helpful tone. They should state
  what happened and, when relevant, what the user can do next.
- Notifications must not use manipulative, misleading, or alarmist language.
- Sending frequency must be kept to the minimum needed to serve the user's
  interests. Bursts of multiple notifications about the same event must be
  collapsed or batched.
- Transactional notifications (for example, activity that the user triggered)
  may be sent immediately. Promotional or non-transactional notifications must
  respect the frequency rules defined for the user's channel preferences.

## Opt-Out Requirement

- Every non-transactional notification must offer a clear and easily reachable
  opt-out mechanism for the channel through which it is delivered.
- When a user opts out of a channel, that choice must take effect without
  requiring further action and must be honored for future notifications.
- Opt-out must not remove access to transactional notifications that the user
  needs for the security or integrity of their account.

## Localization Rule

- User-facing notification content must be externalized so it can be translated.
- Notifications must be delivered in the user's selected locale where that locale
  is supported. Unsupported locales fall back to the default language without
  mixing languages in a single message.
- Locale data (dates, times, and numeric values) must be formatted according to
  the user's locale and time zone.

## Ownership and Review

- The team responsible for user communication owns this policy and reviews it on
  a regular cadence.
- Additions of new notification types or channels are proposed in a pull request
  that touches only the `Governance/` folder and must be approved before rollout.

## Success

This policy succeeds when users can understand, control, and predict the
notifications they receive, and when notification content is consistently
localized, respectful, and aligned with user expectations.