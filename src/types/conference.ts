import { Conference as ZodConference, ConferenceInput as ZodConferenceInput } from '@/schemas/conference.schema';

/**
 * Conference type for professional conference tracking on user profile.
 * Represents attendance, speaking engagements, or organization roles.
 */
export type Conference = ZodConference;
export type ConferenceInput = ZodConferenceInput;
