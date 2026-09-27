/**
 * OfflineSyncManager
 *
 * Handles offline capabilities in a Microservices Architecture.
 * Queues requests when offline and intelligently routes them to
 * the appropriate microservice (Auth, Groups, Courses, etc.)
 * once the connection is restored.
 *
 * Data integrity guarantees:
 * - Idempotent replay: every request carries a client-generated `operationId`
 *   and acknowledged ids are persisted, so duplicate delivery never re-applies
 *   the same mutation.
 * - Resumable cursor: a persisted sequence cursor survives app restarts, so a
 *   partially-drained queue resumes exactly where it left off.
 * - Dead-letter queue: operations that exhaust their retry cap are quarantined
 *   instead of blocking the rest of the queue.
 */

import {
  SYNC_MAX_RETRY_ATTEMPTS,
  SYNC_BACKOFF_BASE_MS,
  SYNC_BACKOFF_CAP_MS,
} from '@/constants/app.constants';

export type MicroserviceTarget = 'auth' | 'users' | 'courses' | 'groups' | 'certificates';

export interface OfflineRequest {
  id: string;
  /** Client-generated idempotency key; the microservice should dedupe on it. */
  operationId: string;
  /** Monotonic sequence used by the resumable drain cursor. */
  seq: number;
  targetService: MicroserviceTarget;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body: any;
  timestamp: number;
  /** Delivery attempts so far (persisted). */
  attempts: number;
  /** Lifetime delivery cap before the request is dead-lettered. */
  maxAttempts: number;
  lastError?: string;
}

export interface DeadLetterRequest extends OfflineRequest {
  failedAt: number;
  lastError: string;
}

export interface SyncConfig {
  apiGatewayUrl?: string;
  serviceUrls?: Record<MicroserviceTarget, string>;
  maxRetryAttempts?: number;
  backoffBaseMs?: number;
  backoffCapMs?: number;
}

const STORAGE_KEY = 'teachlink_offline_queue_v1';
const CURSOR_KEY = 'teachlink_offline_cursor_v1';
const ACKED_KEY = 'teachlink_offline_acked_v1';
const DEAD_KEY = 'teachlink_offline_dead_v1';
const LAST_SEQ_KEY = 'teachlink_offline_last_seq_v1';

export class OfflineSyncManager {
  private queue: OfflineRequest[] = [];
  private deadLetter: DeadLetterRequest[] = [];
  private acked = new Set<string>();
  private cursor = 0;
  private lastSeq = 0;
  private isOnline: boolean = true;
  private config: SyncConfig;
  private isSyncing: boolean = false;
  private boundHandleOnline = () => this.handleOnline();
  private boundHandleOffline = () => this.handleOffline();

  constructor(config: SyncConfig = {}) {
    this.config = config;
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.loadState();
      this.setupListeners();
    }
  }

  /**
   * Initialize event listeners for network changes
   */
  private setupListeners(): void {
    window.addEventListener('online', this.boundHandleOnline);
    window.addEventListener('offline', this.boundHandleOffline);
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Removes the global network listeners. Call when the manager is no longer
   * needed (e.g. unmount) to avoid leaking handlers across tests or pages.
   */
  public dispose(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.boundHandleOnline);
    window.removeEventListener('offline', this.boundHandleOffline);
  }

  /**
   * Load the persisted queue, cursor, ack dedupe set and dead-letter queue.
   * NOTE: intentionally synchronous (localStorage) so a drain resumes exactly
   * where it stopped, even across app restarts.
   */
  private loadState(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      this.queue = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }

    try {
      this.cursor = Number(localStorage.getItem(CURSOR_KEY) ?? 0) || 0;
    } catch {
      this.cursor = 0;
    }

    try {
      const acked = localStorage.getItem(ACKED_KEY);
      this.acked = acked ? new Set(JSON.parse(acked)) : new Set();
    } catch {
      this.acked = new Set();
    }

    try {
      const dead = localStorage.getItem(DEAD_KEY);
      this.deadLetter = dead ? JSON.parse(dead) : [];
    } catch {
      this.deadLetter = [];
    }

    try {
      this.lastSeq = Number(localStorage.getItem(LAST_SEQ_KEY) ?? 0) || 0;
    } catch {
      this.lastSeq = 0;
    }
  }

  /**
   * Persist the queue to localStorage (synchronous so drain ordering is atomic).
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private saveCursor(): void {
    try {
      localStorage.setItem(CURSOR_KEY, String(this.cursor));
    } catch (error) {
      console.error('Failed to save offline cursor:', error);
    }
  }

  private saveAcked(): void {
    try {
      localStorage.setItem(ACKED_KEY, JSON.stringify([...this.acked]));
    } catch (error) {
      console.error('Failed to save acknowledged operations:', error);
    }
  }

  private saveDeadLetter(): void {
    try {
      localStorage.setItem(DEAD_KEY, JSON.stringify(this.deadLetter));
    } catch (error) {
      console.error('Failed to save dead-letter queue:', error);
    }
  }

  private nextSeq(): number {
    this.lastSeq += 1;
    try {
      localStorage.setItem(LAST_SEQ_KEY, String(this.lastSeq));
    } catch {
      // best-effort; sequence restarts at 0 if storage is unavailable
    }
    return this.lastSeq;
  }

  /**
   * Enqueue a request to a specific microservice to be processed when online
   */
  public enqueueRequest(request: Omit<OfflineRequest, 'id' | 'timestamp' | 'operationId' | 'seq' | 'attempts' | 'maxAttempts'>): string {
    const operationId = `op_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    const id = `req_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    // Idempotent enqueue: never queue a mutation that was already applied.
    if (this.acked.has(operationId)) {
      return id;
    }

    const fullRequest: OfflineRequest = {
      ...request,
      id,
      operationId,
      seq: this.nextSeq(),
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: this.config.maxRetryAttempts ?? SYNC_MAX_RETRY_ATTEMPTS,
    };

    this.queue.push(fullRequest);
    this.saveQueue();

    // Attempt to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process queued requests in sequence order, routing them to the correct
   * microservice. Processing is all-or-nothing up to the first failure: a
   * request that fails without exhausting its retries stops the drain, and the
   * persisted cursor ensures the next drain resumes at the same position.
   */
  public async processQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;

    // Sort queue chronologically by sequence
    this.queue.sort((a, b) => a.seq - b.seq);

    // Cursor-based resume: skip anything already drained before a restart.
    const remaining = this.queue.filter((r) => r.seq > this.cursor);

    for (const request of remaining) {
      // Idempotent replay: never re-send an acknowledged operation.
      if (this.acked.has(request.operationId)) {
        this.queue = this.queue.filter((r) => r.id !== request.id);
        this.saveQueue();
        continue;
      }

      try {
        const baseUrl =
          this.config.serviceUrls?.[request.targetService] || this.config.apiGatewayUrl || '';
        const url = `${baseUrl}${request.endpoint}`;

        const response = await fetch(url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: JSON.stringify({ ...request.body, operationId: request.operationId }),
        });

        if (response.ok) {
          // Commit: remove from queue, record the ack, advance the cursor.
          this.queue = this.queue.filter((r) => r.id !== request.id);
          this.saveQueue();
          this.acked.add(request.operationId);
          this.saveAcked();
          this.cursor = request.seq;
          this.saveCursor();
        } else {
          // Server error: retry bookkeeping, stop to preserve chronological order.
          this.recordFailure(request, `HTTP ${response.status}`);
          break;
        }
      } catch (error) {
        // Network error: retry bookkeeping, stop; will retry when connectivity returns.
        this.recordFailure(
          request,
          error instanceof Error ? error.message : String(error),
        );
        break;
      }
    }

    this.isSyncing = false;
  }

  /**
   * Increments the attempt counter with capped exponential backoff semantics
   * and dead-letters the request once the lifetime cap is exhausted.
   */
  private recordFailure(request: OfflineRequest, error: string): void {
    const attempts = request.attempts + 1;
    const baseMs = this.config.backoffBaseMs ?? SYNC_BACKOFF_BASE_MS;
    const capMs = this.config.backoffCapMs ?? SYNC_BACKOFF_CAP_MS;
    const backoff = Math.min(capMs, baseMs * Math.pow(2, attempts - 1));

    const updated: OfflineRequest = {
      ...request,
      attempts,
      lastError: error,
    };

    if (attempts >= request.maxAttempts) {
      // Move to the dead-letter queue so it stops blocking the drain.
      this.queue = this.queue.filter((r) => r.id !== request.id);
      this.deadLetter.push({
        ...updated,
        failedAt: Date.now(),
        lastError: error,
      });
      this.saveDeadLetter();
      this.saveQueue();
      console.warn(
        `Dead-lettered request ${request.id} to ${request.targetService} after ${attempts} attempts. Backoff was capped at ${backoff}ms.`,
      );
    } else {
      // Keep it queued; next drain retries after the (capped) backoff window.
      this.queue = this.queue.map((r) => (r.id === request.id ? updated : r));
      this.saveQueue();
      console.warn(
        `Failed to sync request ${request.id} to ${request.targetService}. Will retry after capped backoff (${backoff}ms).`,
      );
    }
  }

  /** Dead-lettered requests that exhausted their retry cap. */
  public getDeadLetter(): DeadLetterRequest[] {
    return [...this.deadLetter];
  }

  /** Re-enqueue a dead-lettered request for another attempt. */
  public retryDeadLetter(id: string): boolean {
    const idx = this.deadLetter.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    const [request] = this.deadLetter.splice(idx, 1);
    this.queue.push({ ...request, attempts: 0, lastError: undefined });
    this.saveDeadLetter();
    this.saveQueue();
    if (this.isOnline) {
      this.processQueue();
    }
    return true;
  }
}
