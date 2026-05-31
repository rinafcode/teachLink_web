export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  recurring?: boolean;
  recurrenceRule?: string; // iCal RRULE format e.g. "FREQ=WEEKLY;BYDAY=MO"
}
