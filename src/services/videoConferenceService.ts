import { apiClient } from '@/lib/api';
import { createLogger } from '@/lib/logging';

const logger = createLogger('video-conference-service');

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

    const response = await apiClient.post<{ data: Meeting }>('/api/conference/meetings', input);
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

    const response = await apiClient.get<{ data: MeetingParticipant[] }>(
      `/api/conference/meetings/${meetingId}/participants`,
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

    const response = await apiClient.post<{ data: Meeting }>(
      `/api/conference/meetings/${meetingId}/toggle-recording`,
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

    const response = await apiClient.post<{ data: Meeting }>(
      `/api/conference/meetings/${meetingId}/start-recording`,
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

    const response = await apiClient.post<{ data: Meeting }>(
      `/api/conference/meetings/${meetingId}/stop-recording`,
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

    const response = await apiClient.post<{ data: Meeting }>(
      `/api/conference/meetings/${meetingId}/end`,
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to end session', { context: { meetingId, error } });
    throw error;
  }
}
