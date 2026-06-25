/**
 * Server-side helpers for email-template feedback (#410).
 *
 * Kept dependency-free so they can run in edge / serverless contexts.
 * Persistence is delegated to a caller-supplied sink function so the
 * module works with any database or analytics pipeline.
 */
import {
  FeedbackEntrySchema,
  type FeedbackEntry,
} from '@/schemas/feedback.schema';

export type FeedbackSink = (entry: FeedbackEntry) => void | Promise<void>;

export interface FeedbackAggregate {
  templateId: string;
  total: number;
  counts: { love: number; ok: number; dislike: number };
}

export async function ingestFeedback(
  raw: unknown,
  sink: FeedbackSink,
): Promise<{ ok: true; entry: FeedbackEntry } | { ok: false; reason: string }> {
  const parsed = FeedbackEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.issues[0]?.message ?? 'Invalid feedback payload',
    };
  }
  await sink(parsed.data);
  return { ok: true, entry: parsed.data };
}

export function aggregate(entries: FeedbackEntry[]): FeedbackAggregate[] {
  const buckets = new Map<string, FeedbackAggregate>();
  for (const e of entries) {
    let bucket = buckets.get(e.templateId);
    if (!bucket) {
      bucket = {
        templateId: e.templateId,
        total: 0,
        counts: { love: 0, ok: 0, dislike: 0 },
      };
      buckets.set(e.templateId, bucket);
    }
    bucket.total += 1;
    bucket.counts[e.rating] += 1;
  }
  return Array.from(buckets.values());
}
