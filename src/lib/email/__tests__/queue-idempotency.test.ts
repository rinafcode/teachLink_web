import { describe, it, expect, vi } from 'vitest';
import { EmailQueue } from '../queue';
import { deriveIdempotencyKey, scopedIdempotencyKey, withIdempotencyKey } from '../idempotency';
import type { EmailMessage, EmailProvider, EmailSendResult } from '../types';

const message = (overrides: Partial<EmailMessage> = {}): EmailMessage => ({
  to: { email: 'ada@teachlink.test', name: 'Ada' },
  subject: 'Reset your password',
  html: '<p>link</p>',
  text: 'link',
  ...overrides,
});

function provider(
  send: (message: EmailMessage) => Promise<EmailSendResult> = async () => ({
    success: true,
    provider: 'mock',
    messageId: 'id-1',
  }),
): EmailProvider & { send: ReturnType<typeof vi.fn> } {
  return { type: 'mock', send: vi.fn(send) } as EmailProvider & { send: ReturnType<typeof vi.fn> };
}

describe('deriveIdempotencyKey', () => {
  it('is stable for the same message', () => {
    expect(deriveIdempotencyKey(message())).toBe(deriveIdempotencyKey(message()));
  });

  it('changes with the subject', () => {
    expect(deriveIdempotencyKey(message({ subject: 'Other' }))).not.toBe(
      deriveIdempotencyKey(message()),
    );
  });

  it('changes with the body', () => {
    expect(deriveIdempotencyKey(message({ html: '<p>other</p>' }))).not.toBe(
      deriveIdempotencyKey(message()),
    );
  });

  it('changes with the recipient', () => {
    expect(deriveIdempotencyKey(message({ to: { email: 'grace@teachlink.test' } }))).not.toBe(
      deriveIdempotencyKey(message()),
    );
  });

  // Recipient order and casing are not part of what the message *is*.
  it('ignores recipient order and case', () => {
    const first = deriveIdempotencyKey(
      message({ to: [{ email: 'a@x.test' }, { email: 'b@x.test' }] }),
    );
    const second = deriveIdempotencyKey(
      message({ to: [{ email: 'B@x.test' }, { email: 'A@x.test' }] }),
    );

    expect(second).toBe(first);
  });

  it('ignores tags, which are routing metadata', () => {
    expect(deriveIdempotencyKey(message({ tags: ['transactional'] }))).toBe(
      deriveIdempotencyKey(message()),
    );
  });
});

describe('withIdempotencyKey', () => {
  it('derives a key when none was supplied', () => {
    expect(withIdempotencyKey(message()).idempotencyKey).toBe(deriveIdempotencyKey(message()));
  });

  it('keeps a caller-supplied key', () => {
    const supplied = message({ idempotencyKey: 'reset:user-42' });

    expect(withIdempotencyKey(supplied)).toBe(supplied);
  });
});

describe('scopedIdempotencyKey', () => {
  it('namespaces the identifier', () => {
    expect(scopedIdempotencyKey('password-reset', 'user-42')).toBe('password-reset:user-42');
  });
});

describe('EmailQueue idempotency', () => {
  it('sends a message with no key every time', async () => {
    const mock = provider();
    const queue = new EmailQueue(mock);

    await queue.enqueue(message());
    await queue.enqueue(message());

    expect(mock.send).toHaveBeenCalledTimes(2);
  });

  // The duplicate a retried API call or a double-clicked button produces.
  it('sends only once for a repeated key', async () => {
    const mock = provider();
    const queue = new EmailQueue(mock);
    const withKey = message({ idempotencyKey: 'reset:user-42' });

    const first = await queue.enqueue(withKey);
    const second = await queue.enqueue(withKey);

    expect(mock.send).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('dedupes concurrent enqueues of the same key', async () => {
    const mock = provider(
      async () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, provider: 'mock', messageId: 'id-1' }), 5),
        ),
    );
    const queue = new EmailQueue(mock);
    const withKey = message({ idempotencyKey: 'reset:user-42' });

    const [first, second] = await Promise.all([queue.enqueue(withKey), queue.enqueue(withKey)]);

    expect(mock.send).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('keeps different keys independent', async () => {
    const mock = provider();
    const queue = new EmailQueue(mock);

    await queue.enqueue(message({ idempotencyKey: 'a' }));
    await queue.enqueue(message({ idempotencyKey: 'b' }));

    expect(mock.send).toHaveBeenCalledTimes(2);
  });

  // A send that failed is not a delivery, so the key must not block a retry.
  it('allows a retry after a failed send', async () => {
    const mock = provider();
    mock.send
      .mockResolvedValueOnce({ success: false, provider: 'mock', error: 'smtp down' })
      .mockResolvedValueOnce({ success: false, provider: 'mock', error: 'smtp down' })
      .mockResolvedValueOnce({ success: false, provider: 'mock', error: 'smtp down' })
      .mockResolvedValue({ success: true, provider: 'mock', messageId: 'id-2' });

    const queue = new EmailQueue(mock, { maxRetries: 3, retryDelayMs: 0 });
    const withKey = message({ idempotencyKey: 'reset:user-42' });

    const failed = await queue.enqueue(withKey);
    expect(failed.success).toBe(false);

    const retried = await queue.enqueue(withKey);
    expect(retried.success).toBe(true);
  });

  it('sends again once the key has aged out', async () => {
    const mock = provider();
    const queue = new EmailQueue(mock, { idempotencyTtlMs: 1_000 });
    const withKey = message({ idempotencyKey: 'reset:user-42' });

    await queue.enqueue(withKey, 0);
    await queue.enqueue(withKey, 2_000);

    expect(mock.send).toHaveBeenCalledTimes(2);
  });

  it('still dedupes inside the window', async () => {
    const mock = provider();
    const queue = new EmailQueue(mock, { idempotencyTtlMs: 10_000 });
    const withKey = message({ idempotencyKey: 'reset:user-42' });

    await queue.enqueue(withKey, 0);
    await queue.enqueue(withKey, 5_000);

    expect(mock.send).toHaveBeenCalledTimes(1);
  });

  it('prunes aged keys', async () => {
    const queue = new EmailQueue(provider(), { idempotencyTtlMs: 1_000 });

    await queue.enqueue(message({ idempotencyKey: 'a' }), 0);
    expect(queue.idempotencyCacheSize).toBe(1);

    expect(queue.pruneIdempotencyCache(5_000)).toBe(1);
    expect(queue.idempotencyCacheSize).toBe(0);
  });

  it('clears the cache on request', async () => {
    const queue = new EmailQueue(provider());

    await queue.enqueue(message({ idempotencyKey: 'a' }));
    queue.clearIdempotencyCache();

    expect(queue.idempotencyCacheSize).toBe(0);
  });
});

describe('EmailQueue delivery', () => {
  // Every enqueue used to share one resolver, so with two messages in flight
  // an enqueue could resolve with the other message's result.
  it('resolves each enqueue with its own result', async () => {
    const mock = provider(async (sent) => ({
      success: true,
      provider: 'mock',
      messageId: `id-${sent.subject}`,
    }));
    const queue = new EmailQueue(mock, { maxConcurrent: 2 });

    const [first, second] = await Promise.all([
      queue.enqueue(message({ subject: 'first' })),
      queue.enqueue(message({ subject: 'second' })),
    ]);

    expect(first.messageId).toBe('id-first');
    expect(second.messageId).toBe('id-second');
  });

  it('retries a failing send up to the cap', async () => {
    const mock = provider(async () => ({ success: false, provider: 'mock', error: 'boom' }));
    const queue = new EmailQueue(mock, { maxRetries: 3, retryDelayMs: 0 });

    const result = await queue.enqueue(message());

    expect(mock.send).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('after 3 attempts');
  });

  it('stops retrying once a send succeeds', async () => {
    const mock = provider();
    mock.send
      .mockResolvedValueOnce({ success: false, provider: 'mock', error: 'transient' })
      .mockResolvedValue({ success: true, provider: 'mock', messageId: 'ok' });

    const queue = new EmailQueue(mock, { maxRetries: 3, retryDelayMs: 0 });
    const result = await queue.enqueue(message());

    expect(mock.send).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });
});
