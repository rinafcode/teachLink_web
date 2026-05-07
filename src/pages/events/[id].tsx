'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { CalendarEvent } from '@/types/event';
import { getGoogleCalendarUrl } from '@/utils/icalUtils';

export default function EditEventPage() {
  const router = useRouter();
  const { id } = router.query;

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('FREQ=WEEKLY');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<CalendarEvent>(`/api/events/${id}`)
      .then((data) => {
        const ev = { ...data, start: new Date(data.start), end: new Date(data.end) };
        setEvent(ev);
        setTitle(ev.title);
        setStart(toLocal(ev.start));
        setEnd(toLocal(ev.end));
        setRecurring(ev.recurring ?? false);
        setRecurrenceRule(ev.recurrenceRule ?? 'FREQ=WEEKLY');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/api/events/${id}`, {
        title,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        recurring,
        recurrenceRule: recurring ? recurrenceRule : undefined,
      });
      router.push('/events');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    setSubmitting(true);
    try {
      await apiClient.delete(`/api/events/${id}`);
      router.push('/events');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Edit Event – TeachLink</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 mb-4 text-sm">
              {error}
            </div>
          )}

          {!loading && event && (
            <>
              {/* Google Calendar sync link */}
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-6"
              >
                <ExternalLink className="w-4 h-4" />
                Sync with Google Calendar
              </a>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start" className="block text-sm font-medium text-gray-300 mb-1">
                      Start
                    </label>
                    <input
                      id="start"
                      type="datetime-local"
                      required
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="end" className="block text-sm font-medium text-gray-300 mb-1">
                      End
                    </label>
                    <input
                      id="end"
                      type="datetime-local"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="recurring"
                    type="checkbox"
                    checked={recurring}
                    onChange={(e) => setRecurring(e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <label htmlFor="recurring" className="text-sm font-medium text-gray-300">
                    Recurring event
                  </label>
                </div>

                {recurring && (
                  <div>
                    <label htmlFor="rrule" className="block text-sm font-medium text-gray-300 mb-1">
                      Recurrence Rule (RRULE)
                    </label>
                    <select
                      id="rrule"
                      value={recurrenceRule}
                      onChange={(e) => setRecurrenceRule(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FREQ=DAILY">Daily</option>
                      <option value="FREQ=WEEKLY">Weekly</option>
                      <option value="FREQ=MONTHLY">Monthly</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 font-medium transition-colors"
                  >
                    {submitting ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg font-medium transition-colors"
                    aria-label="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
