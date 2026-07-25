'use client';

import { useState } from 'react';
import { Megaphone, Send, Users, CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface BroadcastMessageProps {
  lessonId: string;
  lessonTitle?: string;
  recipientCount?: number;
  onSend?: (message: BroadcastPayload) => Promise<void>;
  className?: string;
}

export interface BroadcastPayload {
  lessonId: string;
  subject: string;
  body: string;
  priority: 'normal' | 'urgent';
}

type Status = 'idle' | 'sending' | 'success' | 'error';

/**
 * BroadcastMessage
 *
 * Allows instructors to broadcast a message to all enrolled students
 * in a specific lesson. Closes automatically after a successful send.
 */
export function BroadcastMessage({
  lessonId,
  lessonTitle,
  recipientCount,
  onSend,
  className = '',
}: BroadcastMessageProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<BroadcastPayload['priority']>('normal');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = subject.trim().length > 0 && body.trim().length > 0 && status !== 'sending';

  const handleSend = async () => {
    if (!canSubmit) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const payload: BroadcastPayload = {
        lessonId,
        subject: subject.trim(),
        body: body.trim(),
        priority,
      };
      if (onSend) {
        await onSend(payload);
      } else {
        // Default: POST to lessons broadcast API
        const res = await fetch(`/api/lessons/${lessonId}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
      }
      setStatus('success');
      setSubject('');
      setBody('');
      setPriority('normal');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send broadcast.');
      setStatus('error');
    }
  };

  return (
    <section
      aria-label="Broadcast message to lesson participants"
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Megaphone size={18} className="text-blue-500" aria-hidden="true" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Broadcast Message
        </h2>
        {lessonTitle && (
          <span className="ml-1 truncate text-sm text-gray-500 dark:text-gray-400">
            — {lessonTitle}
          </span>
        )}
      </div>

      {/* Recipient info */}
      {recipientCount !== undefined && (
        <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <Users size={14} aria-hidden="true" />
          <span>
            {recipientCount} enrolled student{recipientCount !== 1 ? 's' : ''} will receive this
            message
          </span>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300"
        >
          <CheckCircle2 size={16} aria-hidden="true" className="shrink-0" />
          <span>Broadcast sent successfully.</span>
          <button
            onClick={() => setStatus('idle')}
            aria-label="Dismiss"
            className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
          <span>{errorMsg}</span>
          <button
            onClick={() => setStatus('idle')}
            aria-label="Dismiss"
            className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Form */}
      <div className="space-y-3">
        {/* Priority */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</span>
          {(['normal', 'urgent'] as const).map((p) => (
            <label
              key={p}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"
            >
              <input
                type="radio"
                name="priority"
                value={p}
                checked={priority === p}
                onChange={() => setPriority(p)}
                className="accent-blue-600"
              />
              <span className="capitalize">{p}</span>
            </label>
          ))}
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor={`broadcast-subject-${lessonId}`}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Subject
          </label>
          <input
            id={`broadcast-subject-${lessonId}`}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Message subject…"
            maxLength={120}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Body */}
        <div>
          <label
            htmlFor={`broadcast-body-${lessonId}`}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Message
          </label>
          <textarea
            id={`broadcast-body-${lessonId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Write your message to all participants…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 resize-none"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <Send size={14} aria-hidden="true" />
          {status === 'sending' ? 'Sending…' : 'Send Broadcast'}
        </button>
      </div>
    </section>
  );
}
