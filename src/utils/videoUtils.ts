export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const progressPercent = (currentTime: number, duration: number): number => {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return 0;
  return clamp((currentTime / duration) * 100, 0, 100);
};

type VideoStorageKind = 'notes' | 'bookmarks' | 'analytics';

const anonUserId = 'anon';

export const getVideoStorageKey = (opts: {
  kind: VideoStorageKind;
  userId?: string;
  lessonId: string;
}): string => {
  const { kind, userId, lessonId } = opts;
  const safeUserId = encodeURIComponent(userId ?? anonUserId);
  const safeLessonId = encodeURIComponent(lessonId);
  return `video-${kind}:${safeUserId}:${safeLessonId}`;
};

export const generateId = (prefix = 'id'): string => {
  // Prefer cryptographic randomness when available (browser environments).
  const g = globalThis as unknown as { crypto?: Crypto };
  const uuidFn = g.crypto?.randomUUID;
  if (typeof uuidFn === 'function') return `${prefix}-${uuidFn()}`;

  // Fallback for older environments.
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
