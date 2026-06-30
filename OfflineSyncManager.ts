/**
 * OfflineSyncManager
 *
 * Handles offline capabilities in a Microservices Architecture.
 * Queues requests when offline and intelligently routes them to
 * the appropriate microservice (Auth, Groups, Courses, etc.)
 * once the connection is restored.
 */

export type MicroserviceTarget = 'auth' | 'users' | 'courses' | 'groups' | 'certificates';

export interface OfflineRequest {
  id: string;
  targetService: MicroserviceTarget;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body: any;
  timestamp: number;
}

export interface SyncConfig {
  apiGatewayUrl?: string;
  serviceUrls?: Record<MicroserviceTarget, string>;
}

const STORAGE_KEY = 'teachlink_offline_queue_v1';

export class OfflineSyncManager {
  private queue: OfflineRequest[] = [];
  private isOnline: boolean = true;
  private config: SyncConfig;
  private isSyncing: boolean = false;

  constructor(config: SyncConfig = {}) {
    this.config = config;
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.loadQueue();
      this.setupListeners();
    }
  }

  /**
   * Initialize event listeners for network changes
   */
  private setupListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
  }

  /**
   * Load the persisted queue from localStorage
   */
  private loadQueue(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Persist the queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Enqueue a request to a specific microservice to be processed when online
   */
  public enqueueRequest(request: Omit<OfflineRequest, 'id' | 'timestamp'>): string {
    const id = `req_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const fullRequest: OfflineRequest = {
      ...request,
      id,
      timestamp: Date.now(),
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
   * Process all queued requests, routing them to the correct microservice
   */
  public async processQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;

    // Sort queue chronologically
    this.queue.sort((a, b) => a.timestamp - b.timestamp);

    const queueSnapshot = [...this.queue];

    for (const request of queueSnapshot) {
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
          body: JSON.stringify(request.body),
        });

        if (response.ok) {
          // Remove successful request from queue
          this.queue = this.queue.filter((r) => r.id !== request.id);
          this.saveQueue();
        } else {
          // Stop processing if we hit a server error to maintain chronological order
          console.warn(
            `Failed to sync request ${request.id} to ${request.targetService}. Status: ${response.status}`,
          );
          break;
        }
      } catch (error) {
        console.warn(
          `Network error while syncing request ${request.id} to ${request.targetService}. Will retry later.`,
        );
        break; // Stop processing on network error
      }
    }
    this.isSyncing = false;
  }
}
