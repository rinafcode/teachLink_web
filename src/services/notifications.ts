import {
  createEmailProvider,
  EmailQueue,
  EmailSendResult,
  EmailTemplatePayload,
  emailTemplateManager,
  TransactionalTemplateId,
} from '@/lib/email';

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

export class NotificationService {
  private readonly queue: EmailQueue;

  constructor() {
    const provider = createEmailProvider();
    this.queue = new EmailQueue(provider, {
      maxRetries: Number(process.env.EMAIL_MAX_RETRIES ?? 3),
      retryDelayMs: Number(process.env.EMAIL_RETRY_DELAY_MS ?? 1500),
      maxConcurrent: Number(process.env.EMAIL_MAX_CONCURRENT ?? 2),
    });
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

  private buildTemplate(templateId: TransactionalTemplateId, payload: EmailTemplatePayload) {
    return emailTemplateManager.getTemplate(templateId, payload);
  }
}

export const notificationService = new NotificationService();
