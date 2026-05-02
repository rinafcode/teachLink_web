import { z } from 'zod';

export const AnalyticsEventSchema = z.object({
  userId: z.string().optional(),
  lessonId: z.string().min(1),
  eventType: z.string().min(1),
  payload: z.record(z.unknown()),
  timestamp: z.string().datetime().optional(),
});

export type AnalyticsEventPayload = z.infer<typeof AnalyticsEventSchema>;
