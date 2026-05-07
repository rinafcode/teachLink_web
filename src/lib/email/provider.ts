import { EmailMessage, EmailProvider, EmailProviderType, EmailSendResult } from '@/lib/email/types';

const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? 'no-reply@teachlink.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'TeachLink';

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function resolveFrom(message: EmailMessage) {
  return message.from ?? { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME };
}

class SendGridProvider implements EmailProvider {
  readonly type: EmailProviderType = 'sendgrid';

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { success: false, provider: this.type, error: 'SENDGRID_API_KEY is not configured' };
    }

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

export function createEmailProvider(providerType?: string): EmailProvider {
  const type = (providerType ?? process.env.EMAIL_PROVIDER ?? 'sendgrid').toLowerCase();

  if (type === 'ses') {
    return new SesProvider();
  }

  return new SendGridProvider();
}
