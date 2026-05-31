import { apiClient } from '@/lib/api';

export interface OfflineProgressPayload {
  courseId: string;
  moduleId: string;
  progress: number;
  completed: boolean;
  updatedAt: string;
  version?: number;
}

export interface OfflineProgressSyncResponse {
  success: boolean;
  message?: string;
  data: OfflineProgressPayload & {
    lessonId: string;
  };
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
