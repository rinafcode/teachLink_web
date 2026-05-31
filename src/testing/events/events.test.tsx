import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CalendarEvent } from '@/types/event';
import { generateICalContent, getGoogleCalendarUrl } from '@/utils/icalUtils';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-big-calendar', () => ({
  Calendar: ({
    events,
    onSelectEvent,
    onSelectSlot,
  }: {
    events: CalendarEvent[];
    onSelectEvent?: (e: CalendarEvent) => void;
    onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  }) => (
    <div data-testid="big-calendar">
      {events.map((e) => (
        <button key={e.id} onClick={() => onSelectEvent?.(e)}>
          {e.title}
        </button>
      ))}
      <button
        data-testid="select-slot"
        onClick={() =>
          onSelectSlot?.({ start: new Date('2025-01-01'), end: new Date('2025-01-01T01:00:00') })
        }
      >
        Select Slot
      </button>
    </div>
  ),
  dateFnsLocalizer: () => ({}),
  Views: { MONTH: 'month', WEEK: 'week', DAY: 'day' },
}));

// Inline next/dynamic: just call the loader synchronously and return the default export
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<unknown> }>) => {
    // Return a wrapper that renders the loaded component
    const LazyComponent = (props: Record<string, unknown>) => {
      const { events, onSelectEvent, onSelectSlot } = props as {
        events: CalendarEvent[];
        onSelectEvent?: (e: CalendarEvent) => void;
        onSelectSlot?: (slot: { start: Date; end: Date }) => void;
      };
      return (
        <div data-testid="big-calendar">
          {events?.map((e: CalendarEvent) => (
            <button key={e.id} onClick={() => onSelectEvent?.(e)}>
              {e.title}
            </button>
          ))}
          <button
            data-testid="select-slot"
            onClick={() =>
              onSelectSlot?.({
                start: new Date('2025-01-01'),
                end: new Date('2025-01-01T01:00:00'),
              })
            }
          >
            Select Slot
          </button>
        </div>
      );
    };
    return LazyComponent;
  },
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    query: { id: '1' },
  }),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { apiClient } from '@/lib/api';
import EventsPage from '@/pages/events/index';
import NewEventPage from '@/pages/events/new';
import EditEventPage from '@/pages/events/[id]';

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: new Date('2025-06-10T10:00:00'),
    end: new Date('2025-06-10T11:00:00'),
  },
  {
    id: '2',
    title: 'Weekly Standup',
    start: new Date('2025-06-11T09:00:00'),
    end: new Date('2025-06-11T09:30:00'),
    recurring: true,
    recurrenceRule: 'FREQ=WEEKLY',
  },
];

// ─── Calendar component tests ─────────────────────────────────────────────────

describe('EventsPage (Calendar view)', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue(mockEvents);
  });

  it('renders calendar after loading events', async () => {
    render(<EventsPage />);
    await waitFor(() => expect(screen.getByTestId('big-calendar')).toBeInTheDocument());
    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('Weekly Standup')).toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<EventsPage />);
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('renders Export iCal button', () => {
    render(<EventsPage />);
    expect(screen.getByLabelText('Export iCal')).toBeInTheDocument();
  });

  it('renders New Event link', () => {
    render(<EventsPage />);
    expect(screen.getByText('New Event')).toBeInTheDocument();
  });
});

// ─── Create event form tests ──────────────────────────────────────────────────

describe('NewEventPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: '3' });
  });

  it('renders create form fields', () => {
    render(<NewEventPage />);
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Start')).toBeInTheDocument();
    expect(screen.getByLabelText('End')).toBeInTheDocument();
    expect(screen.getByLabelText('Recurring event')).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    render(<NewEventPage />);

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'New Workshop');
    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/events',
        expect.objectContaining({ title: 'New Workshop' }),
      ),
    );
  });

  it('shows recurrence rule selector when recurring is checked', async () => {
    const user = userEvent.setup();
    render(<NewEventPage />);

    expect(screen.queryByLabelText('Recurrence Rule (RRULE)')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Recurring event'));
    expect(screen.getByLabelText('Recurrence Rule (RRULE)')).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<NewEventPage />);

    await user.type(screen.getByLabelText('Title'), 'Test');
    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
  });
});

// ─── Edit/Delete event form tests ─────────────────────────────────────────────

describe('EditEventPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue(mockEvents[0]);
    vi.mocked(apiClient.patch).mockResolvedValue(mockEvents[0]);
    vi.mocked(apiClient.delete).mockResolvedValue({});
  });

  it('loads and displays event data', async () => {
    render(<EditEventPage />);
    await waitFor(() => expect(screen.getByDisplayValue('Team Meeting')).toBeInTheDocument());
  });

  it('submits updated data on save', async () => {
    const user = userEvent.setup();
    render(<EditEventPage />);

    await waitFor(() => screen.getByDisplayValue('Team Meeting'));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated Meeting');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/events/1',
        expect.objectContaining({ title: 'Updated Meeting' }),
      ),
    );
  });

  it('calls delete API on delete confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<EditEventPage />);

    await waitFor(() => screen.getByLabelText('Delete event'));
    await user.click(screen.getByLabelText('Delete event'));

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/events/1'));
  });

  it('shows Google Calendar sync link', async () => {
    render(<EditEventPage />);
    await waitFor(() => expect(screen.getByText('Sync with Google Calendar')).toBeInTheDocument());
  });
});

// ─── iCal export tests ────────────────────────────────────────────────────────

describe('generateICalContent', () => {
  it('generates valid iCal structure', () => {
    const content = generateICalContent([mockEvents[0]]);
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('END:VCALENDAR');
    expect(content).toContain('BEGIN:VEVENT');
    expect(content).toContain('END:VEVENT');
    expect(content).toContain('SUMMARY:Team Meeting');
    expect(content).toContain('UID:1@teachlink');
  });

  it('includes RRULE for recurring events', () => {
    const content = generateICalContent([mockEvents[1]]);
    expect(content).toContain('RRULE:FREQ=WEEKLY');
  });

  it('does not include RRULE for non-recurring events', () => {
    const content = generateICalContent([mockEvents[0]]);
    expect(content).not.toContain('RRULE');
  });

  it('handles multiple events', () => {
    const content = generateICalContent(mockEvents);
    const veventCount = (content.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(veventCount).toBe(2);
  });

  it('escapes special characters in title', () => {
    const event: CalendarEvent = {
      ...mockEvents[0],
      title: 'Meeting; with, commas\\backslash',
    };
    const content = generateICalContent([event]);
    expect(content).toContain('SUMMARY:Meeting\\; with\\, commas\\\\backslash');
  });
});

describe('getGoogleCalendarUrl', () => {
  it('returns a valid Google Calendar URL with event title', () => {
    const url = getGoogleCalendarUrl(mockEvents[0]);
    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    // URLSearchParams encodes spaces as '+', both are valid URL encoding
    expect(url).toMatch(/text=Team[+%20]Meeting/);
  });
});
