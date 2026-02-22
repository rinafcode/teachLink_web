import { openDB } from 'idb';

const DB_NAME = 'teachlink_state_v1';
const STORE_NAME = 'app_state';

/**
 * Persistence layer using IndexedDB for large state objects.
 */
export const persistenceLayer = {
  /**
   * Loads the state from IndexedDB.
   */
  async getItem(name: string): Promise<string | null> {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
      const data = await db.get(STORE_NAME, name);
      return data ? JSON.stringify(data) : null;
    } catch (error) {
      console.error('[Persistence] Error loading state:', error);
      return null;
    }
  },

  /**
   * Saves the state to IndexedDB.
   */
  async setItem(name: string, value: string): Promise<void> {
    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
      await db.put(STORE_NAME, JSON.parse(value), name);
    } catch (error) {
      console.error('[Persistence] Error saving state:', error);
    }
  },

  /**
   * Removes the state from IndexedDB.
   */
  async removeItem(name: string): Promise<void> {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, name);
  },
};
