import { apiClient } from '@/lib/api';
import { Conference, ConferenceInput } from '@/types/conference';
import { createLogger } from '@/lib/logging';

const logger = createLogger('conference-service');

/**
 * Get all conferences for a user's profile.
 *
 * TODO: Replace with actual API endpoint.
 * Expected backend endpoint: GET /api/profile/{userId}/conferences
 * Expected response: { data: Conference[] }
 *
 * For now, returns an empty array (mock implementation).
 */
export async function getConferences(userId: string): Promise<Conference[]> {
  try {
    logger.debug('Fetching conferences for user', { context: { userId } });

    // TODO: Replace with apiClient.get<{ data: Conference[] }>(`/api/profile/${userId}/conferences`)
    // and extract data.data
    return [];
  } catch (error) {
    logger.error('Failed to fetch conferences', { context: { userId, error } });
    throw error;
  }
}

/**
 * Add a new conference to a user's profile.
 *
 * TODO: Replace with actual API endpoint.
 * Expected backend endpoint: POST /api/profile/{userId}/conferences
 * Expected response: { data: Conference }
 *
 * For now, returns mock conference with generated ID.
 */
export async function addConference(
  userId: string,
  input: ConferenceInput,
): Promise<Conference> {
  try {
    logger.debug('Adding conference to profile', { context: { userId, title: input.title } });

    // TODO: Replace with apiClient.post<{ data: Conference }>(`/api/profile/${userId}/conferences`, input)
    // and return data.data
    const mockConference: Conference = {
      id: `conf-${Date.now()}`,
      ...input,
      date: input.date,
    };
    return mockConference;
  } catch (error) {
    logger.error('Failed to add conference', { context: { userId, error } });
    throw error;
  }
}

/**
 * Update an existing conference on a user's profile.
 *
 * TODO: Replace with actual API endpoint.
 * Expected backend endpoint: PUT /api/profile/{userId}/conferences/{conferenceId}
 * Expected response: { data: Conference }
 *
 * For now, returns mock updated conference.
 */
export async function updateConference(
  userId: string,
  conferenceId: string,
  input: ConferenceInput,
): Promise<Conference> {
  try {
    logger.debug('Updating conference', { context: { userId, conferenceId } });

    // TODO: Replace with apiClient.put<{ data: Conference }>(`/api/profile/${userId}/conferences/${conferenceId}`, input)
    // and return data.data
    const mockConference: Conference = {
      id: conferenceId,
      ...input,
      date: input.date,
    };
    return mockConference;
  } catch (error) {
    logger.error('Failed to update conference', { context: { userId, conferenceId, error } });
    throw error;
  }
}

/**
 * Delete a conference from a user's profile.
 *
 * TODO: Replace with actual API endpoint.
 * Expected backend endpoint: DELETE /api/profile/{userId}/conferences/{conferenceId}
 * Expected response: { success: boolean }
 *
 * For now, returns success.
 */
export async function deleteConference(userId: string, conferenceId: string): Promise<void> {
  try {
    logger.debug('Deleting conference', { context: { userId, conferenceId } });

    // TODO: Replace with apiClient.delete(`/api/profile/${userId}/conferences/${conferenceId}`)
    return;
  } catch (error) {
    logger.error('Failed to delete conference', { context: { userId, conferenceId, error } });
    throw error;
  }
}
