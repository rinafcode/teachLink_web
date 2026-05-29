import {
  createEmailProvider,
  EmailQueue,
  EmailSendResult,
  EmailTemplatePayload,
  emailTemplateManager,
  TransactionalTemplateId,
} from '@/lib/email';
import { SMSService, SMSSendResult, PhoneNumber } from '@/lib/sms';
import { createLogger } from '@/lib/logging';

const logger = createLogger('service:notifications');

interface BaseNotificationInput extends EmailTemplatePayload {
  email: string;
  name: string;
}

interface PasswordResetInput extends BaseNotificationInput {
  resetUrl: string;
  expiresInMinutes: number;
}

interface SecurityAlertInput extends BaseNotificationInput {
  device: string;
  timestamp: string;
}

interface CourseEnrollmentInput extends BaseNotificationInput {
  courseName: string;
  courseUrl: string;
}

export type NotificationEvent =
  | { type: 'welcome'; data: BaseNotificationInput }
  | { type: 'password-reset'; data: PasswordResetInput }
  | { type: 'security-alert'; data: SecurityAlertInput }
  | { type: 'course-enrollment'; data: CourseEnrollmentInput };

export interface SMSNotificationInput {
  phoneNumber: PhoneNumber;
  name?: string;
}

export interface MultiChannelResult {
  email?: EmailSendResult;
  sms?: SMSSendResult;
}

export class NotificationService {
  private readonly queue: EmailQueue;
  private readonly smsService: SMSService;

  constructor() {
    const provider = createEmailProvider();
    this.queue = new EmailQueue(provider, {
      maxRetries: Number(process.env.EMAIL_MAX_RETRIES ?? 3),
      retryDelayMs: Number(process.env.EMAIL_RETRY_DELAY_MS ?? 1500),
      maxConcurrent: Number(process.env.EMAIL_MAX_CONCURRENT ?? 2),
    });
    this.smsService = new SMSService();
  }

  async sendEvent(event: NotificationEvent): Promise<EmailSendResult> {
    const template = this.buildTemplate(event.type, event.data);

    return this.queue.enqueue({
      to: {
        email: event.data.email,
        name: event.data.name,
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: ['transactional', event.type],
    });
  }

  sendWelcomeEmail(data: BaseNotificationInput): Promise<EmailSendResult> {
    return this.sendEvent({ type: 'welcome', data });
  }

  sendPasswordResetEmail(data: PasswordResetInput): Promise<EmailSendResult> {
    return this.sendEvent({ type: 'password-reset', data });
  }

  sendSecurityAlertEmail(data: SecurityAlertInput): Promise<EmailSendResult> {
    return this.sendEvent({ type: 'security-alert', data });
  }

  sendCourseEnrollmentEmail(data: CourseEnrollmentInput): Promise<EmailSendResult> {
    return this.sendEvent({ type: 'course-enrollment', data });
  }

  // ── SMS methods ──────────────────────────────────────────────────────────

  sendVerificationCodeSMS(
    sms: SMSNotificationInput & { code: string; expiresInMinutes: number },
  ): Promise<SMSSendResult> {
    return this.smsService.sendVerificationCode(sms);
  }

  sendSecurityAlertSMS(
    sms: SMSNotificationInput & { device: string; timestamp: string; action: string },
  ): Promise<SMSSendResult> {
    return this.smsService.sendSecurityAlert(sms);
  }

  sendCourseEnrollmentSMS(
    sms: SMSNotificationInput & { courseName: string; courseUrl: string },
  ): Promise<SMSSendResult> {
    return this.smsService.sendCourseEnrollment(sms);
  }

  // ── Multi-channel methods ─────────────────────────────────────────────────

  /**
   * Send a security alert via both email and SMS simultaneously.
   * Failures on one channel do not block the other.
   */
  async sendSecurityAlertMultiChannel(
    email: SecurityAlertInput,
    sms?: SMSNotificationInput & { action: string },
  ): Promise<MultiChannelResult> {
    const requestId = `multi_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    logger.info('Sending multi-channel security alert', {
      requestId,
      context: {
        hasEmail: true,
        hasSMS: !!sms,
      },
    });

    const [emailResult, smsResult] = await Promise.allSettled([
      this.sendSecurityAlertEmail(email),
      sms
        ? this.smsService.sendSecurityAlert({
            phoneNumber: sms.phoneNumber,
            name: sms.name,
            device: email.device,
            timestamp: email.timestamp,
            action: sms.action,
          })
        : Promise.resolve(undefined),
    ]);

    const result: MultiChannelResult = {
      email: emailResult.status === 'fulfilled' ? emailResult.value : undefined,
      sms: smsResult.status === 'fulfilled' ? (smsResult.value ?? undefined) : undefined,
    };

    logger.info('Multi-channel security alert sent', {
      requestId,
      context: {
        emailSuccess: result.email?.success,
        smsSuccess: result.sms?.success,
      },
    });

    return result;
  }

  /**
   * Send a course enrollment notification via both email and SMS.
   */
  async sendCourseEnrollmentMultiChannel(
    email: CourseEnrollmentInput,
    sms?: SMSNotificationInput,
  ): Promise<MultiChannelResult> {
    const requestId = `multi_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    logger.info('Sending multi-channel course enrollment', {
      requestId,
      context: {
        hasEmail: true,
        hasSMS: !!sms,
        courseName: email.courseName,
      },
    });

    const [emailResult, smsResult] = await Promise.allSettled([
      this.sendCourseEnrollmentEmail(email),
      sms
        ? this.smsService.sendCourseEnrollment({
            phoneNumber: sms.phoneNumber,
            name: sms.name,
            courseName: email.courseName,
            courseUrl: email.courseUrl,
          })
        : Promise.resolve(undefined),
    ]);

    const result: MultiChannelResult = {
      email: emailResult.status === 'fulfilled' ? emailResult.value : undefined,
      sms: smsResult.status === 'fulfilled' ? (smsResult.value ?? undefined) : undefined,
    };

    logger.info('Multi-channel course enrollment sent', {
      requestId,
      context: {
        emailSuccess: result.email?.success,
        smsSuccess: result.sms?.success,
      },
    });

    return result;
  }

  private buildTemplate(templateId: TransactionalTemplateId, payload: EmailTemplatePayload) {
    return emailTemplateManager.getTemplate(templateId, payload);
  }
}

export const notificationService = new NotificationService();
