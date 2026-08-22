import { apiClient } from '@/lib/api';
import { VersionVector } from '@/lib/conflict/types';

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
    return apiClient.patch<OfflineProgressSyncResponse>(
      `/api/lessons/${encodeURIComponent(progress.moduleId)}/progress`,
      progress,
    );
  },
};
