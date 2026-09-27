/**
 * Hybrid Events support for Email Verification.
 *
 * A "hybrid event" is any platform event that can trigger email verification
 * through multiple delivery channels: synchronous in-app dispatch, async queue
 * processing, and webhook relay. This module exposes a unified
 * `HybridEmailEventBus` that routes verification-related events to the
 * appropriate handler based on runtime context.
 *
 * Issue #399 – Email Verification : Hybrid Events
 */

import { EmailMessage, EmailSendResult } from '@/lib/email/types';
import { createEmailProvider } from '@/lib/email/provider';
import { EmailQueue } from '@/lib/email/queue';
import { emailTemplateManager } from '@/lib/email/templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HybridEventChannel = 'direct' | 'queue' | 'webhook';

export interface HybridEventPayload {
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** Signed verification URL */
  verificationUrl: string;
  /** One-time backup code for account recovery */
  backupCode: string;
  /** Recovery URL (email-less restore flow) */
  restoreUrl: string;
  /** Token TTL in minutes (default 60) */
  expiresInMinutes?: number;
}

export interface HybridEventResult {
  channel: HybridEventChannel;
  result: EmailSendResult;
  dispatchedAt: string;
}

export type HybridEventListener = (payload: HybridEventPayload) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmailMessage(payload: HybridEventPayload): EmailMessage {
  const { subject, html, text } = emailTemplateManager.getTemplate('email-verification', {
    name: payload.name,
    verificationUrl: payload.verificationUrl,
    backupCode: payload.backupCode,
    restoreUrl: payload.restoreUrl,
    expiresInMinutes: payload.expiresInMinutes ?? 60,
  });

  return {
    to: { email: payload.email, name: payload.name },
    subject,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// HybridEmailEventBus
// ---------------------------------------------------------------------------

/**
 * HybridEmailEventBus routes email-verification events to one or more channels:
 *
 * - `direct`  – sends synchronously via the configured email provider.
 * - `queue`   – enqueues for async delivery with retry logic.
 * - `webhook` – posts a JSON payload to an external webhook URL for third-party
 *               integrations (e.g., Zapier, custom notification services).
 */
export class HybridEmailEventBus {
  private readonly queue: EmailQueue;
  private readonly webhookUrl: string | undefined;
  private readonly listeners: Map<string, Set<HybridEventListener>> = new Map();

  constructor(webhookUrl?: string) {
    const provider = createEmailProvider();
    this.queue = new EmailQueue(provider);
    this.webhookUrl = webhookUrl ?? process.env.EMAIL_VERIFICATION_WEBHOOK_URL;
  }

  // ------ Listener API ------

  on(event: string, listener: HybridEventListener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, payload: HybridEventPayload): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }

  // ------ Channel dispatchers ------

  /** Send immediately via the email provider. */
  async sendDirect(payload: HybridEventPayload): Promise<HybridEventResult> {
    const provider = createEmailProvider();
    const message = buildEmailMessage(payload);
    const result = await provider.send(message);
    this.emit('verification:sent', payload);
    return { channel: 'direct', result, dispatchedAt: new Date().toISOString() };
  }

  /** Enqueue for async delivery with automatic retries. */
  async sendQueued(payload: HybridEventPayload): Promise<HybridEventResult> {
    const message = buildEmailMessage(payload);
    const result = await this.queue.enqueue(message);
    this.emit('verification:queued', payload);
    return { channel: 'queue', result, dispatchedAt: new Date().toISOString() };
  }

  /** Relay to an external webhook endpoint. */
  async sendWebhook(payload: HybridEventPayload): Promise<HybridEventResult> {
    if (!this.webhookUrl) {
      return {
        channel: 'webhook',
        result: {
          success: false,
          provider: 'mock',
          error: 'EMAIL_VERIFICATION_WEBHOOK_URL is not configured',
        },
        dispatchedAt: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'email-verification', payload }),
      });

      const result: EmailSendResult = response.ok
        ? { success: true, provider: 'mock', messageId: `webhook-${Date.now()}` }
        : {
            success: false,
            provider: 'mock',
            error: `Webhook responded with ${response.status}`,
          };

      if (result.success) this.emit('verification:webhook', payload);
      return { channel: 'webhook', result, dispatchedAt: new Date().toISOString() };
    } catch (error) {
      return {
        channel: 'webhook',
        result: {
          success: false,
          provider: 'mock',
          error: error instanceof Error ? error.message : 'Webhook request failed',
        },
        dispatchedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Dispatch to all specified channels and return an array of results.
   * Falls back to `queue` if no channels are specified.
   */
  async dispatch(
    payload: HybridEventPayload,
    channels: HybridEventChannel[] = ['queue'],
  ): Promise<HybridEventResult[]> {
    const results = await Promise.all(
      channels.map((channel) => {
        switch (channel) {
          case 'direct':
            return this.sendDirect(payload);
          case 'webhook':
            return this.sendWebhook(payload);
          default:
            return this.sendQueued(payload);
        }
      }),
    );
    return results;
  }
}

/** Singleton bus for server-side use in API routes. */
export const hybridEmailEventBus = new HybridEmailEventBus();
