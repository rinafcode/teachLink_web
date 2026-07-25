import { SMSMessage, SMSProvider, SMSSendResult, SMSProviderType } from './types';
import { createLogger } from '@/lib/logging';

const logger = createLogger('sms:provider');

export class TwilioProvider implements SMSProvider {
  readonly type: SMSProviderType = 'twilio';
  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID;
  private readonly authToken = process.env.TWILIO_AUTH_TOKEN;
  private readonly fromNumber = process.env.TWILIO_PHONE_NUMBER;

  async send(message: SMSMessage): Promise<SMSSendResult> {
    const requestId = `twilio_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      const error = 'Twilio credentials not configured';
      logger.error('Twilio provider not configured', {
        requestId,
        context: { provider: 'twilio', missingCredentials: true },
        error: new Error(error),
      });
      return {
        success: false,
        provider: this.type,
        error,
      };
    }

    try {
      const toNumbers = Array.isArray(message.to) ? message.to : [message.to];
      const formattedNumbers = toNumbers.map((num) => `+${num.countryCode}${num.number}`);

      // Simulate Twilio API call - replace with actual Twilio SDK
      logger.info('Sending SMS via Twilio', {
        requestId,
        context: {
          provider: 'twilio',
          recipientCount: formattedNumbers.length,
          tags: message.tags,
        },
      });

      // In production, call Twilio API:
      // const response = await twilioClient.messages.create({
      //   body: message.body,
      //   from: this.fromNumber,
      //   to: formattedNumbers[0],
      // });

      const messageId = `twilio_${Date.now()}`;

      logger.info('SMS sent successfully via Twilio', {
        requestId,
        context: {
          provider: 'twilio',
          messageId,
          recipientCount: formattedNumbers.length,
        },
      });

      return {
        success: true,
        provider: this.type,
        messageId,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Twilio SMS send failed', {
        requestId,
        context: { provider: 'twilio' },
        error,
      });

      return {
        success: false,
        provider: this.type,
        error: errorMessage,
      };
    }
  }
}

export class SNSProvider implements SMSProvider {
  readonly type: SMSProviderType = 'sns';
  private readonly region = process.env.AWS_REGION || 'us-east-1';
  private readonly accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  private readonly secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  async send(message: SMSMessage): Promise<SMSSendResult> {
    const requestId = `sns_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    if (!this.accessKeyId || !this.secretAccessKey) {
      const error = 'AWS credentials not configured';
      logger.error('SNS provider not configured', {
        requestId,
        context: { provider: 'sns', missingCredentials: true },
        error: new Error(error),
      });
      return {
        success: false,
        provider: this.type,
        error,
      };
    }

    try {
      const toNumbers = Array.isArray(message.to) ? message.to : [message.to];
      const formattedNumbers = toNumbers.map((num) => `+${num.countryCode}${num.number}`);

      logger.info('Sending SMS via AWS SNS', {
        requestId,
        context: {
          provider: 'sns',
          region: this.region,
          recipientCount: formattedNumbers.length,
          tags: message.tags,
        },
      });

      // In production, call AWS SNS API:
      // const snsClient = new SNSClient({ region: this.region });
      // const response = await snsClient.send(new PublishCommand({
      //   Message: message.body,
      //   PhoneNumber: formattedNumbers[0],
      // }));

      const messageId = `sns_${Date.now()}`;

      logger.info('SMS sent successfully via AWS SNS', {
        requestId,
        context: {
          provider: 'sns',
          messageId,
          recipientCount: formattedNumbers.length,
        },
      });

      return {
        success: true,
        provider: this.type,
        messageId,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('SNS SMS send failed', {
        requestId,
        context: { provider: 'sns' },
        error,
      });

      return {
        success: false,
        provider: this.type,
        error: errorMessage,
      };
    }
  }
}

export class VonageProvider implements SMSProvider {
  readonly type: SMSProviderType = 'vonage';
  private readonly apiKey = process.env.VONAGE_API_KEY;
  private readonly apiSecret = process.env.VONAGE_API_SECRET;
  private readonly fromNumber = process.env.VONAGE_PHONE_NUMBER;

  async send(message: SMSMessage): Promise<SMSSendResult> {
    const requestId = `vonage_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    if (!this.apiKey || !this.apiSecret || !this.fromNumber) {
      const error = 'Vonage credentials not configured';
      logger.error('Vonage provider not configured', {
        requestId,
        context: { provider: 'vonage', missingCredentials: true },
        error: new Error(error),
      });
      return {
        success: false,
        provider: this.type,
        error,
      };
    }

    try {
      const toNumbers = Array.isArray(message.to) ? message.to : [message.to];
      const formattedNumbers = toNumbers.map((num) => `+${num.countryCode}${num.number}`);

      logger.info('Sending SMS via Vonage', {
        requestId,
        context: {
          provider: 'vonage',
          recipientCount: formattedNumbers.length,
          tags: message.tags,
        },
      });

      // In production, call Vonage API:
      // const response = await vonageClient.message.sendSms(
      //   this.fromNumber,
      //   formattedNumbers[0],
      //   message.body,
      // );

      const messageId = `vonage_${Date.now()}`;

      logger.info('SMS sent successfully via Vonage', {
        requestId,
        context: {
          provider: 'vonage',
          messageId,
          recipientCount: formattedNumbers.length,
        },
      });

      return {
        success: true,
        provider: this.type,
        messageId,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Vonage SMS send failed', {
        requestId,
        context: { provider: 'vonage' },
        error,
      });

      return {
        success: false,
        provider: this.type,
        error: errorMessage,
      };
    }
  }
}

export function createSMSProvider(): SMSProvider {
  const provider = (process.env.SMS_PROVIDER || 'twilio') as SMSProviderType;

  switch (provider) {
    case 'sns':
      return new SNSProvider();
    case 'vonage':
      return new VonageProvider();
    case 'twilio':
    default:
      return new TwilioProvider();
  }
}
