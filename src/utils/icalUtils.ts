import type { CalendarEvent } from '@/types/event';

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICalContent(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TeachLink//Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@teachlink`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    lines.push(`DTSTART:${formatICalDate(event.start)}`);
    lines.push(`DTEND:${formatICalDate(event.end)}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    if (event.recurring && event.recurrenceRule) {
      lines.push(`RRULE:${event.recurrenceRule}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICalFile(events: CalendarEvent[], filename = 'teachlink-events.ics'): void {
  const content = generateICalContent(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(event.start)}/${fmt(event.end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
