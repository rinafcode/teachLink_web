export type SMSProviderType = 'twilio' | 'sns' | 'vonage';

export interface PhoneNumber {
  countryCode: string;
  number: string;
}

export interface SMSMessage {
  to: PhoneNumber | PhoneNumber[];
  body: string;
  from?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SMSSendResult {
  success: boolean;
  provider: SMSProviderType;
  messageId?: string;
  error?: string;
  timestamp?: number;
}

export interface SMSProvider {
  readonly type: SMSProviderType;
  send(message: SMSMessage): Promise<SMSSendResult>;
}

export interface QueueOptions {
  maxRetries: number;
  retryDelayMs: number;
  maxConcurrent: number;
}

export interface QueueJob {
  id: string;
  message: SMSMessage;
  attempts: number;
  createdAt: number;
}

export interface SMSDeliveryLog {
  jobId: string;
  provider: SMSProviderType;
  phoneNumber: string;
  messageBody: string;
  messageId?: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  maxRetries: number;
  error?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
