import { describe, it, expect, vi } from 'vitest';

// react-big-calendar pulls in CSS + heavy component code; mock it so we can import
// the pure `expandRecurring` helper without rendering the calendar.
vi.mock('react-big-calendar', () => ({
  Calendar: () => null,
  dateFnsLocalizer: () => ({}),
  Views: {},
}));

import { expandRecurring } from '@/components/Calendar';
import type { CalendarEvent } from '@/types/event';
import { addMonths } from 'date-fns';

const DAY = 24 * 60 * 60 * 1000;

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  const start = overrides.start ?? new Date(2026, 0, 5, 9, 0, 0);
  const end = overrides.end ?? new Date(2026, 0, 5, 10, 0, 0);
  return {
    id: 'evt1',
    title: 'Event',
    start,
    end,
    recurring: true,
    recurrenceRule: 'FREQ=WEEKLY',
    ...overrides,
  };
}

const gapDays = (a: Date, b: Date) => (b.getTime() - a.getTime()) / DAY;

describe('expandRecurring', () => {
  it('returns the single event when not recurring', () => {
    const result = expandRecurring(makeEvent({ recurring: false }));
    expect(result).toHaveLength(1);
  });

  it('does not expand when recurrenceRule is missing', () => {
    expect(expandRecurring(makeEvent({ recurrenceRule: undefined }))).toHaveLength(1);
  });

  it('WEEKLY steps 7 days apart', () => {
    const result = expandRecurring(makeEvent({ recurrenceRule: 'FREQ=WEEKLY' }));
    expect(result.length).toBeGreaterThan(20);
    expect(result[1].id).toBe('evt1_1');
    expect(gapDays(result[1].start, result[2].start)).toBeCloseTo(7, 5);
  });

  it('DAILY is not truncated at the old 52-cap (covers the full ~26-week window)', () => {
    const result = expandRecurring(makeEvent({ recurrenceRule: 'FREQ=DAILY' }));
    expect(result.length).toBeGreaterThan(52);
    expect(gapDays(result[1].start, result[2].start)).toBeCloseTo(1, 5);
  });

  it('MONTHLY steps by real calendar months (not a 28-day drift)', () => {
    const start = new Date(2026, 0, 31, 9, 0, 0);
    const result = expandRecurring(
      makeEvent({
        start,
        end: new Date(2026, 0, 31, 10, 0, 0),
        recurrenceRule: 'FREQ=MONTHLY',
      }),
    );
    expect(result[1].start.getMonth()).toBe(1);
    for (let i = 1; i < result.length - 1; i++) {
      const expected = addMonths(result[i].start, 1);
      expect(result[i + 1].start.getTime()).toBe(expected.getTime());
    }
    const gap = gapDays(result[1].start, result[2].start);
    expect(gap).toBeGreaterThan(27);
    expect(gap).toBeLessThan(32);
  });
});
