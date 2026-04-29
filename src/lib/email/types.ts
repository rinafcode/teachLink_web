export type EmailProviderType = 'sendgrid' | 'ses';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
  tags?: string[];
}

export interface EmailSendResult {
  success: boolean;
  provider: EmailProviderType;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly type: EmailProviderType;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export interface EmailTemplatePayload {
  [key: string]: string | number | boolean | null | undefined;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  html: string;
  text: string;
}

export interface QueueOptions {
  maxRetries: number;
  retryDelayMs: number;
  maxConcurrent: number;
}

export interface QueueJob {
  id: string;
  message: EmailMessage;
  attempts: number;
}
