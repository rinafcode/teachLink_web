/**
 * Feedback collection schema for Email Templates (#410).
 *
 * Captures a single piece of feedback tied to a specific email template
 * instance (so the campaign owner can correlate feedback to delivery).
 */
import { z } from 'zod';

export const FeedbackRating = z.enum(['love', 'ok', 'dislike']);
export type FeedbackRating = z.infer<typeof FeedbackRating>;

export const FeedbackEntrySchema = z.object({
  templateId: z.string().min(1),
  recipientHash: z.string().min(8), // opaque, never raw email
  rating: FeedbackRating,
  comment: z.string().max(2000).optional(),
  urlParams: z.record(z.string()).optional(),
  submittedAt: z.string().datetime(),
});

export type FeedbackEntry = z.infer<typeof FeedbackEntrySchema>;
