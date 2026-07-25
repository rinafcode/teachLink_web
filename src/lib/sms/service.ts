import { SMSMessage, SMSSendResult, PhoneNumber } from './types';
import { SMSQueue } from './queue';
import { createSMSProvider } from './provider';
import { createLogger } from '@/lib/logging';

const logger = createLogger('sms:service');

interface BaseSMSInput {
  phoneNumber: PhoneNumber;
  name?: string;
}

interface VerificationCodeInput extends BaseSMSInput {
  code: string;
  expiresInMinutes: number;
}

interface SecurityAlertInput extends BaseSMSInput {
  device: string;
  timestamp: string;
  action: string;
}

interface CourseEnrollmentInput extends BaseSMSInput {
  courseName: string;
  courseUrl: string;
}

interface AccountWarningInput extends BaseSMSInput {
  reason: string;
}

export type SMSEvent =
  | { type: 'verification-code'; data: VerificationCodeInput }
  | { type: 'security-alert'; data: SecurityAlertInput }
  | { type: 'course-enrollment'; data: CourseEnrollmentInput }
  | { type: 'account-warning'; data: AccountWarningInput };

export class SMSService {
  private readonly queue: SMSQueue;
  private readonly fromNumber = process.env.SMS_FROM_NUMBER || '+1234567890';

  constructor() {
    const provider = createSMSProvider();
    this.queue = new SMSQueue(provider, {
      maxRetries: Number(process.env.SMS_MAX_RETRIES ?? 3),
      retryDelayMs: Number(process.env.SMS_RETRY_DELAY_MS ?? 1500),
      maxConcurrent: Number(process.env.SMS_MAX_CONCURRENT ?? 5),
    });

    logger.info('SMS Service initialized', {
      context: {
        fromNumber: this.fromNumber,
        maxRetries: Number(process.env.SMS_MAX_RETRIES ?? 3),
        maxConcurrent: Number(process.env.SMS_MAX_CONCURRENT ?? 5),
      },
    });
  }

  async sendEvent(event: SMSEvent): Promise<SMSSendResult> {
    const requestId = `sms_event_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    logger.info('Processing SMS event', {
      requestId,
      context: {
        eventType: event.type,
        phoneNumber: `+${event.data.phoneNumber.countryCode}${event.data.phoneNumber.number}`,
      },
    });

    const body = this.buildMessageBody(event.type, event.data as any);

    const message: SMSMessage = {
      to: event.data.phoneNumber,
      body,
      from: this.fromNumber,
      tags: ['transactional', event.type],
      metadata: {
        eventType: event.type,
        recipientName: event.data.name,
      },
    };

    try {
      const result = await this.queue.enqueue(message);

      logger.info('SMS event processed', {
        requestId,
        context: {
          eventType: event.type,
          success: result.success,
          messageId: result.messageId,
        },
      });

      return result;
    } catch (error) {
      logger.error('SMS event processing failed', {
        requestId,
        context: {
          eventType: event.type,
        },
        error,
      });

      throw error;
    }
  }

  async sendVerificationCode(data: VerificationCodeInput): Promise<SMSSendResult> {
    return this.sendEvent({ type: 'verification-code', data });
  }

  async sendSecurityAlert(data: SecurityAlertInput): Promise<SMSSendResult> {
    return this.sendEvent({ type: 'security-alert', data });
  }

  async sendCourseEnrollment(data: CourseEnrollmentInput): Promise<SMSSendResult> {
    return this.sendEvent({ type: 'course-enrollment', data });
  }

  async sendAccountWarning(data: AccountWarningInput): Promise<SMSSendResult> {
    return this.sendEvent({ type: 'account-warning', data });
  }

  private buildMessageBody(eventType: string, data: any): string {
    switch (eventType) {
      case 'verification-code':
        return `Your TeachLink verification code is ${data.code}. It expires in ${data.expiresInMinutes} minutes. Do not share this code.`;

      case 'security-alert':
        return `Security Alert: A ${data.action} was performed on your TeachLink account from ${data.device} at ${data.timestamp}. If this wasn't you, please change your password immediately.`;

      case 'course-enrollment':
        return `Welcome! You've been enrolled in ${data.courseName}. View the course: ${data.courseUrl}`;

      case 'account-warning':
        return `Important: ${data.reason}. Please take action immediately to secure your TeachLink account.`;

      default:
        return 'You have a new message from TeachLink.';
    }
  }

  // Aggregation and monitoring methods
  getDeliveryLogs(filter?: any) {
    return this.queue.getDeliveryLogs(filter);
  }

  getDeliveryStats() {
    return this.queue.getDeliveryStats();
  }

  clearOldLogs(olderThanMs?: number) {
    return this.queue.clearOldLogs(olderThanMs);
  }
}

export const smsService = new SMSService();
