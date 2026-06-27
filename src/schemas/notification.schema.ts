import { z } from 'zod';

export const SendNotificationSchema = z.object({
  userId: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  url: z.string().max(2000).optional(),
});

export const TrackNotificationSchema = z.object({
  notificationId: z.string().max(100).optional(),
  event: z.enum(['sent', 'delivered', 'clicked', 'failed', 'unknown']),
  userId: z.string().max(100).optional(),
  timestamp: z
    .string()
    .datetime({ precision: true, offset: true })
    .or(z.string().datetime())
    .optional(),
  message: z.string().max(5000).optional(),
  title: z.string().max(200).optional(),
  error: z.string().max(1000).nullable().optional(),
});

export const SubscribeNotificationSchema = z.object({
  endpoint: z.string().url().max(2000).optional().or(z.string().max(2000).optional()),
  expirationTime: z.number().nullable().optional(),
  keys: z
    .object({
      p256dh: z.string().max(500).optional(),
      auth: z.string().max(500).optional(),
    })
    .optional(),
  userId: z.string().max(100).optional(),
});

export const UnsubscribeNotificationSchema = z.object({
  userId: z.string().min(1).max(100),
});

export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;
export type TrackNotificationInput = z.infer<typeof TrackNotificationSchema>;
export type SubscribeNotificationInput = z.infer<typeof SubscribeNotificationSchema>;
export type UnsubscribeNotificationInput = z.infer<typeof UnsubscribeNotificationSchema>;
