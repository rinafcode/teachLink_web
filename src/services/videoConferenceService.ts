import { apiClient } from '@/lib/api';
import { createLogger } from '@/lib/logging';
import { withTimeout } from '@/lib/timeout';

const logger = createLogger('video-conference-service');
const CONFERENCE_TIMEOUT_MS = Number(process.env.CONFERENCE_TIMEOUT_MS || 10000);
const CONFERENCE_MAX_RETRIES = Number(process.env.CONFERENCE_MAX_RETRIES || 2);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function conferenceRequest<T>(request: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await withTimeout(request(), CONFERENCE_TIMEOUT_MS, 'Conference request timed out');
    } catch (error) {
      if (attempt >= CONFERENCE_MAX_RETRIES) throw error;
      await delay(Math.min(1000, 100 * 2 ** attempt));
    }
  }
}

export interface MeetingParticipant {
  id: string;
  name: string;
  userId: string;
  joinedAt: string;
  role: 'host' | 'participant';
}

export interface Meeting {
  id: string;
  roomId: string;
  hostId: string;
  title: string;
  status: 'active' | 'ended' | 'recording';
  recordingEnabled: boolean;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants: MeetingParticipant[];
}

export interface CreateMeetingInput {
  roomId: string;
  hostId: string;
  title: string;
}

/**
 * Create a new video meeting.
 *
 * Backend endpoint: POST /api/conference/meetings
 * Expected response: { data: Meeting }
 */
export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  try {
    logger.debug('Creating meeting', { context: { roomId: input.roomId, hostId: input.hostId } });

    const response = await conferenceRequest(() =>
      apiClient.post<{ data: Meeting }>('/api/conference/meetings', input, {
        timeout: CONFERENCE_TIMEOUT_MS,
      }),
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to create meeting', { context: { roomId: input.roomId, error } });
    throw error;
  }
}

/**
 * List participants in a meeting.
 *
 * Backend endpoint: GET /api/conference/meetings/{meetingId}/participants
 * Expected response: { data: MeetingParticipant[] }
 */
export async function listParticipants(meetingId: string): Promise<MeetingParticipant[]> {
  try {
    logger.debug('Listing participants for meeting', { context: { meetingId } });

    const response = await conferenceRequest(() =>
      apiClient.get<{ data: MeetingParticipant[] }>(
        `/api/conference/meetings/${meetingId}/participants`,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to list participants', { context: { meetingId, error } });
    throw error;
  }
}

/**
 * Toggle recording for a meeting.
 *
 * Backend endpoint: POST /api/conference/meetings/{meetingId}/toggle-recording
 * Expected response: { data: Meeting }
 */
export async function toggleRecording(meetingId: string): Promise<Meeting> {
  try {
    logger.debug('Toggling recording for meeting', { context: { meetingId } });

    const response = await conferenceRequest(() =>
      apiClient.post<{ data: Meeting }>(
        `/api/conference/meetings/${meetingId}/toggle-recording`,
        undefined,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to toggle recording', { context: { meetingId, error } });
    throw error;
  }
}

/**
 * Start recording for a meeting.
 *
 * Backend endpoint: POST /api/conference/meetings/{meetingId}/start-recording
 * Expected response: { data: Meeting }
 */
export async function startRecording(meetingId: string): Promise<Meeting> {
  try {
    logger.debug('Starting recording for meeting', { context: { meetingId } });

    const response = await conferenceRequest(() =>
      apiClient.post<{ data: Meeting }>(
        `/api/conference/meetings/${meetingId}/start-recording`,
        undefined,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to start recording', { context: { meetingId, error } });
    throw error;
  }
}

/**
 * Stop recording for a meeting.
 *
 * Backend endpoint: POST /api/conference/meetings/{meetingId}/stop-recording
 * Expected response: { data: Meeting }
 */
export async function stopRecording(meetingId: string): Promise<Meeting> {
  try {
    logger.debug('Stopping recording for meeting', { context: { meetingId } });

    const response = await conferenceRequest(() =>
      apiClient.post<{ data: Meeting }>(
        `/api/conference/meetings/${meetingId}/stop-recording`,
        undefined,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to stop recording', { context: { meetingId, error } });
    throw error;
  }
}

/**
 * End a meeting session.
 *
 * Backend endpoint: POST /api/conference/meetings/{meetingId}/end
 * Expected response: { data: Meeting }
 */
export async function endSession(meetingId: string): Promise<Meeting> {
  try {
    logger.debug('Ending meeting session', { context: { meetingId } });

    const response = await conferenceRequest(() =>
      apiClient.post<{ data: Meeting }>(
        `/api/conference/meetings/${meetingId}/end`,
        undefined,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to end session', { context: { meetingId, error } });
    throw error;
  }
}
