'use client';

import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function NewEventPage() {
  const router = useRouter();
  const { start: qStart, end: qEnd } = router.query;

  const defaultStart = qStart ? new Date(String(qStart)) : new Date();
  const defaultEnd = qEnd ? new Date(String(qEnd)) : new Date(Date.now() + 3600_000);

  const toLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  };

  const [title, setTitle] = useState('');
  const [start, setStart] = useState(toLocal(defaultStart));
  const [end, setEnd] = useState(toLocal(defaultEnd));
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('FREQ=WEEKLY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/api/events', {
        title,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        recurring,
        recurrenceRule: recurring ? recurrenceRule : undefined,
      });
      router.push('/events');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Event – TeachLink</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold mb-6">New Event</h1>

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 mb-4 text-sm">
              {error}
            </div>
          )}

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

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 font-medium transition-colors"
            >
              {submitting ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
