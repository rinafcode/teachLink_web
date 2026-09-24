import { createHash } from 'crypto';
import { EmailAddress, EmailMessage } from '@/lib/email/types';

/**
 * Idempotency key derivation for transactional email.
 *
 * A key is best supplied by the caller, who knows what the message *is* — "the
 * password reset for user 42, request abc". When there is nothing to hand, a
 * key derived from the message content is still enough to collapse the common
 * duplicate: the identical message sent twice by a retry.
 */

function normalizeRecipients(to: EmailAddress | EmailAddress[]): string[] {
  const list = Array.isArray(to) ? to : [to];

  // Sorted and lower-cased so recipient order cannot produce two keys for what
  // is otherwise the same message.
  return [...new Set(list.map((address) => address.email.trim().toLowerCase()))].sort();
}

/**
 * Derives a stable key from the message itself.
 *
 * Covers recipients, subject and both bodies. It does not cover `tags` or
 * `replyTo`: those are routing metadata, and two messages differing only there
 * are still the same mail to the person receiving it.
 */
export function deriveIdempotencyKey(message: EmailMessage): string {
  const payload = JSON.stringify([
    normalizeRecipients(message.to),
    message.from?.email?.trim().toLowerCase() ?? '',
    message.subject,
    message.html,
    message.text ?? '',
  ]);

  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Returns the message with an idempotency key attached, deriving one from the
 * content when the caller did not supply it.
 */
export function withIdempotencyKey(message: EmailMessage): EmailMessage {
  return message.idempotencyKey
    ? message
    : { ...message, idempotencyKey: deriveIdempotencyKey(message) };
}

/** Namespaced key, so two features cannot collide on the same identifier. */
export function scopedIdempotencyKey(scope: string, identifier: string): string {
  return `${scope}:${identifier}`;
}
