import { EmailMessage, EmailProvider, EmailProviderType, EmailSendResult } from '@/lib/email/types';

const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? 'no-reply@teachlink.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'TeachLink';

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 5000;

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function resolveFrom(message: EmailMessage) {
  return message.from ?? { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableResult(result: EmailSendResult): boolean {
  if (result.success) return false;
  if (result.error?.includes('SENDGRID_API_KEY is not configured')) return false;
  const match = /SendGrid error (\\d+)/.exec(result.error ?? '');
  if (match) {
    const status = parseInt(match[1]);
    return status === 408 || status === 429 || status >= 500;
  }
  // Network errors and other transient exceptions should be retried.
  return true;
}

class SendGridProvider implements EmailProvider {
  readonly type: EmailProviderType = 'sendgrid';

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { success: false, provider: this.type, error: 'SENDGRID_API_KEY is not configured' };
    }

    let lastResult: EmailSendResult = {
      success: false,
      provider: this.type,
      error: 'Email send failed after retries',
    };
    let delay = BASE_BACKOFF_MS;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      lastResult = await this.doSend(message, apiKey);

      if (lastResult.success || !isRetryableResult(lastResult)) {
        return lastResult;
      }

      if (attempt < MAX_RETRIES) {
        await wait(delay);
        delay = Math.min(delay * 2, MAX_BACKOFF_MS);
      }
    }

    return lastResult;
  }

  private async doSend(message: EmailMessage, apiKey: string): Promise<EmailSendResult> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: asArray(message.to).map((recipient) => ({
                email: recipient.email,
                name: recipient.name,
              })),
            },
          ],
          from: resolveFrom(message),
          reply_to: message.replyTo,
          subject: message.subject,
          content: [
            { type: 'text/plain', value: message.text ?? '' },
            { type: 'text/html', value: message.html },
          ],
          categories: message.tags,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          provider: this.type,
          error: `SendGrid error ${response.status}: ${errorText}`,
        };
      }

      return {
        success: true,
        provider: this.type,
        messageId: response.headers.get('x-message-id') ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.type,
        error: error instanceof Error ? error.message : 'Unknown SendGrid error',
      };
    }
  }
}

class SesProvider implements EmailProvider {
  readonly type: EmailProviderType = 'ses';

  async send(_message: EmailMessage): Promise<EmailSendResult> {
    return {
      success: false,
      provider: this.type,
      error:
        'SES provider requires AWS SDK integration. Configure EMAIL_PROVIDER=sendgrid or implement SES transport.',
    };
  }
}

class MockProvider implements EmailProvider {
  readonly type: EmailProviderType = 'mock';

  async send(_message: EmailMessage): Promise<EmailSendResult> {
    return {
      success: true,
      provider: this.type,
      messageId: `mock-${Date.now()}`,
    };
  }
}

export function createEmailProvider(providerType?: string): EmailProvider {
  const type = (providerType ?? process.env.EMAIL_PROVIDER ?? 'sendgrid').toLowerCase();

  if (
    type === 'mock' ||
    (type === 'sendgrid' && !process.env.SENDGRID_API_KEY && process.env.NODE_ENV !== 'production')
  ) {
    return new MockProvider();
  }

  if (type === 'ses') {
    return new SesProvider();
  }

  return new SendGridProvider();
}
