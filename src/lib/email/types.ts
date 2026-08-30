export type EmailProviderType = 'sendgrid' | 'ses' | 'mock';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage extends EmailIdempotency {
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

/** One template variable the caller failed to supply. */
export interface MissingTemplateVariable {
  /** Placeholder name, as it appears between the braces. */
  name: string;
  /** Where it was referenced: the subject, the HTML body, or the text body. */
  parts: Array<'subject' | 'html' | 'text'>;
}

export interface TemplateValidationResult {
  valid: boolean;
  /** Variables the template references but the payload does not provide. */
  missing: MissingTemplateVariable[];
  /** Variables supplied but never referenced — a likely typo in the caller. */
  unused: string[];
}

/**
 * Options for rendering a transactional template.
 *
 * `allowMissing` exists for previews and tests; it is deliberately not the
 * default, because rendering an unresolved variable as an empty string is what
 * sends "Reset your password:  " with no link in it.
 */
export interface RenderOptions {
  allowMissing?: boolean;
}

/** Idempotency support for transactional sends. */
export interface EmailIdempotency {
  /**
   * Caller-supplied key identifying this message.
   *
   * Two enqueues with the same key are one send: the second returns the first
   * one's result rather than delivering a duplicate.
   */
  idempotencyKey?: string;
}
