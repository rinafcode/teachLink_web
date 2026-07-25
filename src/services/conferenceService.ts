import { apiClient } from '@/lib/api';
import { Conference, ConferenceInput } from '@/types/conference';
import { createLogger } from '@/lib/logging';

const logger = createLogger('conference-service');

/**
 * Get all conferences for a user's profile.
 *
 * Backend endpoint: GET /api/profile/{userId}/conferences
 * Expected response: { data: Conference[] }
 */
export async function getConferences(userId: string): Promise<Conference[]> {
  try {
    logger.debug('Fetching conferences for user', { context: { userId } });

    const response = await apiClient.get<{ data: Conference[] }>(
      `/api/profile/${userId}/conferences`,
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch conferences', { context: { userId, error } });
    throw error;
  }
}

/**
 * Add a new conference to a user's profile.
 *
 * Backend endpoint: POST /api/profile/{userId}/conferences
 * Expected response: { data: Conference }
 */
export async function addConference(userId: string, input: ConferenceInput): Promise<Conference> {
  try {
    logger.debug('Adding conference to profile', { context: { userId, title: input.title } });

    const response = await apiClient.post<{ data: Conference }>(
      `/api/profile/${userId}/conferences`,
      input,
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to add conference', { context: { userId, error } });
    throw error;
  }
}

/**
 * Update an existing conference on a user's profile.
 *
 * Backend endpoint: PUT /api/profile/{userId}/conferences/{conferenceId}
 * Expected response: { data: Conference }
 */
export async function updateConference(
  userId: string,
  conferenceId: string,
  input: ConferenceInput,
): Promise<Conference> {
  try {
    logger.debug('Updating conference', { context: { userId, conferenceId } });

    const response = await apiClient.put<{ data: Conference }>(
      `/api/profile/${userId}/conferences/${conferenceId}`,
      input,
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to update conference', { context: { userId, conferenceId, error } });
    throw error;
  }
}

/**
 * Delete a conference from a user's profile.
 *
 * Backend endpoint: DELETE /api/profile/{userId}/conferences/{conferenceId}
 * Expected response: { success: boolean }
 */
export async function deleteConference(userId: string, conferenceId: string): Promise<void> {
  try {
    logger.debug('Deleting conference', { context: { userId, conferenceId } });

    await apiClient.delete<{ success: boolean }>(
      `/api/profile/${userId}/conferences/${conferenceId}`,
    );
  } catch (error) {
    logger.error('Failed to delete conference', { context: { userId, conferenceId, error } });
    throw error;
  }
}
