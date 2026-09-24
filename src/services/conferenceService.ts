import { apiClient } from '@/lib/api';
import { Conference, ConferenceInput } from '@/types/conference';
import { createLogger } from '@/lib/logging';
import { withTimeout } from '@/lib/timeout';

const logger = createLogger('conference-service');
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

/**
 * Get all conferences for a user's profile.
 *
 * Backend endpoint: GET /api/profile/{userId}/conferences
 * Expected response: { data: Conference[] }
 */
export async function getConferences(userId: string): Promise<Conference[]> {
  try {
    logger.debug('Fetching conferences for user', { context: { userId } });

    const response = await conferenceRequest(() =>
      apiClient.get<{ data: Conference[] }>(`/api/profile/${userId}/conferences`, {
        timeout: CONFERENCE_TIMEOUT_MS,
      }),
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

    const response = await conferenceRequest(() =>
      apiClient.post<{ data: Conference }>(`/api/profile/${userId}/conferences`, input, {
        timeout: CONFERENCE_TIMEOUT_MS,
      }),
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

    const response = await conferenceRequest(() =>
      apiClient.put<{ data: Conference }>(
        `/api/profile/${userId}/conferences/${conferenceId}`,
        input,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
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

    await conferenceRequest(() =>
      apiClient.delete<{ success: boolean }>(
        `/api/profile/${userId}/conferences/${conferenceId}`,
        { timeout: CONFERENCE_TIMEOUT_MS },
      ),
    );
  } catch (error) {
    logger.error('Failed to delete conference', { context: { userId, conferenceId, error } });
    throw error;
  }
}
