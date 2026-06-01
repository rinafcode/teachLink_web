import { z } from 'zod';

/**
 * Conference schema for form validation and type safety.
 * Represents a professional conference attended, spoken at, or organized by the user.
 */
export const ConferenceSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)), // Support both UUID and plain IDs
  title: z
    .string()
    .min(2, 'Conference title must be at least 2 characters')
    .max(200, 'Conference title must be less than 200 characters'),
  role: z.enum(['speaker', 'attendee', 'organizer'], {
    errorMap: () => ({ message: 'Role must be speaker, attendee, or organizer' }),
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable(),
  url: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable(),
});

/**
 * Input schema for creating/updating a conference (excludes id).
 */
export const ConferenceInputSchema = ConferenceSchema.omit({ id: true });

export type Conference = z.infer<typeof ConferenceSchema>;
export type ConferenceInput = z.infer<typeof ConferenceInputSchema>;
