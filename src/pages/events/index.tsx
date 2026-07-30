'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, Download, Calendar as CalendarIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { SlotInfo } from 'react-big-calendar';
import { apiClient } from '@/lib/api';
import type { CalendarEvent } from '@/types/event';
import { downloadICalFile } from '@/utils/icalUtils';

// Dynamically import Calendar to avoid SSR issues with react-big-calendar
const Calendar = dynamic(() => import('@/components/Calendar'), { ssr: false });

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    apiClient
      .get<CalendarEvent[]>('/api/events', { signal: abortController.signal })
      .then((data) =>
        setEvents(data.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))),
      )
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError('Failed to load events. Please try again later.');
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, []);

  const handleSelectSlot = useCallback(
    (slot: SlotInfo) => {
      const start = slot.start instanceof Date ? slot.start.toISOString() : String(slot.start);
      const end = slot.end instanceof Date ? slot.end.toISOString() : String(slot.end);
      router.push(`/events/new?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    },
    [router],
  );

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      // Strip recurring instance suffix to get the base id
      const baseId = event.id.replace(/_\d+$/, '');
      router.push(`/events/${baseId}`);
    },
    [router],
  );

  return (
    <>
      <Head>
        <title>Events Calendar – TeachLink</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-7 h-7 text-blue-400" />
              <h1 className="text-2xl font-bold">Events Calendar</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => downloadICalFile(events)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                aria-label="Export iCal"
              >
                <Download className="w-4 h-4" />
                Export iCal
              </button>
              <Link
                href="/events/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Event
              </Link>
            </div>
          </div>

          {loading && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <LoadingSkeleton variant="rectangular" height={400} className="w-full" />
            </div>
          )}
          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-6 text-red-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Error Loading Events</h3>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          {!loading && !error && (
            <Calendar
              events={events}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
            />
          )}
        </div>
      </div>
    </>
  );
}
