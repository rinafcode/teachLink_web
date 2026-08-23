import { apiClient } from '@/lib/api';
import { VersionVector } from '@/lib/conflict/types';
import { tokenManager } from '@/lib/auth/tokenManager';

/**
 * Thrown when an offline operation is replayed without an authenticated
 * session, so the caller can dead-letter it instead of retrying against a dead
 * credential.
 */
export class OfflineAuthRequiredError extends Error {
  constructor() {
    super('Offline replay requires an authenticated session');
    this.name = 'OfflineAuthRequiredError';
  }
}

export interface OfflineProgressPayload {
  courseId: string;
  moduleId: string;
  progress: number;
  completed: boolean;
  updatedAt: string;
  version?: number;
  /**
   * Client-generated idempotency key. The server is expected to dedupe on it so
   * duplicate delivery of the same offline operation applies exactly once.
   */
  operationId?: string;
  /** Replica/device that produced this change (deterministic conflict detection). */
  updatedBy?: string;
  logicalClock?: number;
  versionVector?: VersionVector;
}

export interface OfflineProgressSyncResponse {
  success: boolean;
  message?: string;
  data: OfflineProgressPayload & {
    lessonId: string;
  };
  /**
   * Set by the server when the operation was already applied (deduplicated).
   * The client can then safely drop the queued operation without re-applying.
   */
  deduplicated?: boolean;
}

export const offlineApi = {
  syncLessonProgress: async (
    progress: OfflineProgressPayload,
  ): Promise<OfflineProgressSyncResponse> => {
    // Ensure a valid, non-expired token before replaying (silent refresh via the
    // shared token manager); refuse when logged out so the sync layer can
    // dead-letter rather than retry endlessly.
    const token = await tokenManager.getValidAccessToken();
    if (!token) {
      throw new OfflineAuthRequiredError();
    }
    return apiClient.patch<OfflineProgressSyncResponse>(
      `/api/lessons/${encodeURIComponent(progress.moduleId)}/progress`,
      progress,
    );
  },
};
