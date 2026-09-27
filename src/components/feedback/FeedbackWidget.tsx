/**
 * Feedback Widget for Email Templates (#410).
 *
 * A self-contained widget that can be embedded in an email template's
 * landing page or an in-app "How was this email?" prompt. Submissions are
 * forwarded to a consumer-provided onSubmit handler (validation handled via
 * FeedbackEntrySchema in src/schemas/feedback.schema.ts).
 */
'use client';

import { useCallback, useState } from 'react';
import {
  FeedbackEntrySchema,
  type FeedbackEntry,
  type FeedbackRating,
} from '@/schemas/feedback.schema';

export interface FeedbackWidgetProps {
  templateId: string;
  recipientHash: string;
  urlParams?: Record<string, string>;
  onSubmit?: (entry: FeedbackEntry) => void | Promise<void>;
}

const RATING_LABEL: Record<FeedbackRating, string> = {
  love: '❤️ Loved it',
  ok: '👍 OK',
  dislike: '👎 Not for me',
};

export default function FeedbackWidget({
  templateId,
  recipientHash,
  urlParams,
  onSubmit,
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!rating) return;
    const parsed = FeedbackEntrySchema.safeParse({
      templateId,
      recipientHash,
      rating,
      comment: comment.trim() || undefined,
      urlParams,
      submittedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid feedback');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await onSubmit?.(parsed.data);
      setStatus('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
      setStatus('error');
    }
  }, [rating, comment, templateId, recipientHash, urlParams, onSubmit]);

  if (status === 'sent') {
    return (
      <div role="status" aria-live="polite" className="feedback-widget feedback-widget--sent">
        Thanks for the feedback!
      </div>
    );
  }

  return (
    <section className="feedback-widget" aria-label="Email feedback">
      <fieldset>
        <legend>How was this email?</legend>
        {(Object.keys(RATING_LABEL) as FeedbackRating[]).map((r) => (
          <label key={r} className="feedback-widget__rating">
            <input
              type="radio"
              name="rating"
              value={r}
              checked={rating === r}
              onChange={() => setRating(r)}
            />
            {RATING_LABEL[r]}
          </label>
        ))}
      </fieldset>
      <label className="feedback-widget__comment">
        <span>Comment (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </label>
      {error ? (
        <p role="alert" className="feedback-widget__error">
          {error}
        </p>
      ) : null}
      <button type="button" disabled={!rating || status === 'sending'} onClick={submit}>
        {status === 'sending' ? 'Sending…' : 'Send feedback'}
      </button>
    </section>
  );
}
