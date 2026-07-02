export type VolunteerRole = 'mentor' | 'moderator' | 'content_reviewer' | 'event_coordinator';

export type VolunteerStatus = 'active' | 'inactive' | 'pending';

export interface VolunteerSMSPreferences {
  optedIn: boolean;
  phoneNumber: string;
  /** Notification categories the volunteer wants via SMS */
  categories: Array<'assignment' | 'reminder' | 'urgent' | 'general'>;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: VolunteerRole;
  status: VolunteerStatus;
  sms: VolunteerSMSPreferences;
  joinedAt: string; // ISO
}

export interface VolunteerSMSPayload {
  volunteerId: string;
  category: VolunteerSMSPreferences['categories'][number];
  message: string;
}
