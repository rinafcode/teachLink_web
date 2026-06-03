'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSettingsStore } from '@/lib/settings/store';

export type PollResultsVisibility = 'always' | 'after_voting' | 'after_ended';

export type PollDraft = {
  question: string;
  options: string[];
  durationDays: number;
  allowAnonymous: boolean;
  resultsVisibility: PollResultsVisibility;
};

function validateDraft(
  draft: PollDraft,
): { ok: true; value: PollDraft } | { ok: false; message: string } {
  const question = draft.question.trim();
  if (question.length < 3) return { ok: false, message: 'Question must be at least 3 characters' };
  if (question.length > 240) return { ok: false, message: 'Question is too long' };

  const normalizedOptions = draft.options.map((o) => o.trim());
  const nonEmpty = normalizedOptions.filter(Boolean);
  if (nonEmpty.length < 2) return { ok: false, message: 'At least two options are required' };
  if (nonEmpty.length > 10) return { ok: false, message: 'At most 10 options are allowed' };

  for (const opt of nonEmpty) {
    if (opt.length > 120) return { ok: false, message: 'Option too long' };
  }

  const durationDays = Number.isFinite(draft.durationDays)
    ? Math.trunc(draft.durationDays)
    : 0;
  if (durationDays < 1 || durationDays > 30) {
    return { ok: false, message: 'Duration must be between 1 and 30 days' };
  }

  const resultsVisibility = draft.resultsVisibility;
  if (!['always', 'after_voting', 'after_ended'].includes(resultsVisibility)) {
    return { ok: false, message: 'Invalid results visibility' };
  }

  return {
    ok: true,
    value: {
      question,
      options: normalizedOptions.slice(0, 10),
      durationDays,
      allowAnonymous: !!draft.allowAnonymous,
      resultsVisibility,
    },
  };
}

export interface PollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (draft: PollDraft) => void;
}

export function PollCreationModal({ isOpen, onClose, onCreate }: PollCreationModalProps) {
  const settings = useSettingsStore((s: { settings: any }) => s.settings);

  const initialDraft = useMemo<PollDraft>(() => {
    return {
      question: '',
      options: ['', ''],
      durationDays: settings.defaultPollDuration,
      allowAnonymous: settings.allowAnonymousVoting,
      resultsVisibility: settings.pollResultsVisibility as PollResultsVisibility,
    };
  }, [settings]);

  const [draft, setDraft] = useState<PollDraft>(initialDraft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(initialDraft);
    setError(null);
  }, [isOpen, initialDraft]);

  const validate = (): PollDraft | null => {
    const result = validateDraft(draft);
    if (!result.ok) {
      setError(result.message);
      return null;
    }
    setError(null);
    return result.value;
  };

  const canSubmit = useMemo(() => {
    if (draft.question.trim().length < 3) return false;
    const nonEmpty = draft.options.map((o: string) => o.trim()).filter(Boolean);
    if (nonEmpty.length < 2) return false;
    return true;
  }, [draft.question, draft.options]);

  const handleSubmit = () => {
    const validated = validate();
    if (!validated) return;
    onCreate(validated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create poll">
      <form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="space-y-4">
          {error ? (
            <div role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="poll-question"
              className="block text-sm font-medium text-gray-900 dark:text-gray-50"
            >
              Question
            </label>
            <input
              id="poll-question"
              type="text"
              value={draft.question}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const nextQuestion = e.target.value;
                setDraft((d: PollDraft) => ({ ...d, question: nextQuestion }));
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              aria-invalid={error ? 'true' : 'false'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50">
                Options
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {draft.options.length}/10
              </span>
            </div>

            <div className="mt-2 space-y-2">
              {draft.options.map((opt: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const next = [...draft.options];
                      next[idx] = e.target.value;
                      setDraft((d: PollDraft) => ({ ...d, options: next }));
                    }}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    aria-label={`Option ${idx + 1}`}
                  />

                  {draft.options.length > 2 ? (
                    <button
                      type="button"
                      className="rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      onClick={() => {
                        setDraft((d: PollDraft) => ({
                          ...d,
                          options: d.options.filter((_: string, i: number) => i !== idx),
                        }));
                      }}
                      aria-label={`Remove option ${idx + 1}`}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-2">
              <button
                type="button"
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-900 disabled:opacity-50"
                onClick={() => {
                  setDraft((d: PollDraft) => ({
                    ...d,
                    options: [...d.options, ''],
                  }));
                }}
                disabled={draft.options.length >= 10}
              >
                Add option
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="poll-duration"
                className="block text-sm font-medium text-gray-900 dark:text-gray-50"
              >
                Duration (days)
              </label>
              <input
                id="poll-duration"
                type="number"
                min={1}
                max={30}
                value={draft.durationDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = Number.parseInt(e.target.value || '0', 10);
                  setDraft((d: PollDraft) => ({
                    ...d,
                    durationDays: Number.isFinite(v) ? v : d.durationDays,
                  }));
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                id="poll-anon"
                type="checkbox"
                checked={draft.allowAnonymous}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDraft((d: PollDraft) => ({ ...d, allowAnonymous: e.target.checked }));
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="poll-anon"
                className="text-sm font-medium text-gray-900 dark:text-gray-50"
              >
                Allow anonymous voting
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="poll-results"
              className="block text-sm font-medium text-gray-900 dark:text-gray-50"
            >
              Results visibility
            </label>
            <select
              id="poll-results"
              value={draft.resultsVisibility}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const next = e.target.value as PollDraft['resultsVisibility'];
                setDraft((d: PollDraft) => ({ ...d, resultsVisibility: next }));
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="always">Always visible</option>
              <option value="after_voting">Only after voting</option>
              <option value="after_ended">Only after the poll has ended</option>
            </select>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-900"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={!canSubmit}
            >
              Create
            </button>
          </div>
        </div>
      </form>

      <div className="sr-only" aria-live="polite">
        {canSubmit ? 'Poll ready to create' : 'Complete question and at least two options'}
      </div>
    </Modal>
  );
}

