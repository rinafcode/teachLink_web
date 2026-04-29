'use client';

import { useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, SlotInfo, Views } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addWeeks,
  addDays,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { CalendarEvent } from '@/types/event';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

/** Expand a recurring event into instances within a 6-month window */
function expandRecurring(event: CalendarEvent): CalendarEvent[] {
  if (!event.recurring || !event.recurrenceRule) return [event];

  const instances: CalendarEvent[] = [event];
  const duration = event.end.getTime() - event.start.getTime();
  const windowEnd = addWeeks(new Date(), 26);

  const freqMatch = event.recurrenceRule.match(/FREQ=(\w+)/);
  const freq = freqMatch?.[1] ?? 'WEEKLY';

  let current = event.start;
  for (let i = 1; i < 52; i++) {
    current = freq === 'DAILY' ? addDays(current, 1) : addWeeks(current, freq === 'MONTHLY' ? 4 : 1);
    if (current > windowEnd) break;
    instances.push({
      ...event,
      id: `${event.id}_${i}`,
      start: current,
      end: new Date(current.getTime() + duration),
    });
  }
  return instances;
}

interface CalendarProps {
  events: CalendarEvent[];
  onSelectSlot?: (slot: SlotInfo) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
}

export default function Calendar({ events, onSelectSlot, onSelectEvent }: CalendarProps) {
  const expanded = events.flatMap(expandRecurring);

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.recurring ? '#7c3aed' : '#2563eb',
      borderRadius: '4px',
      border: 'none',
      color: '#fff',
      fontSize: '0.8rem',
    },
  }), []);

  return (
    <div className="h-[600px] bg-gray-800 rounded-xl p-4 text-white [&_.rbc-calendar]:text-gray-100 [&_.rbc-toolbar]:text-gray-100 [&_.rbc-toolbar_button]:text-gray-100 [&_.rbc-toolbar_button]:bg-gray-700 [&_.rbc-toolbar_button]:border-gray-600 [&_.rbc-header]:bg-gray-700 [&_.rbc-header]:text-gray-200 [&_.rbc-today]:bg-gray-700/50 [&_.rbc-off-range-bg]:bg-gray-900/30 [&_.rbc-day-bg]:border-gray-700 [&_.rbc-month-view]:border-gray-700 [&_.rbc-time-view]:border-gray-700 [&_.rbc-agenda-view_table]:border-gray-700">
      <BigCalendar
        localizer={localizer}
        events={expanded}
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        style={{ height: '100%' }}
      />
    </div>
  );
}
