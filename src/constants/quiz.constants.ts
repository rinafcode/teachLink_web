/**
 * Quiz and search domain constants.
 * Extracted from magic numbers used across quiz and search stores.
 */

// Quiz
export const QUIZ_MAX_SEARCH_HISTORY = 10;
export const QUIZ_NOTIFICATION_MAX_STORED = 200;
export const QUIZ_NOTIFICATION_ID_PREFIX = 'ntf_';
export const QUIZ_NOTIFICATION_STORAGE_KEY = 'notifications_v1';

// Search defaults
export const SEARCH_DEFAULT_SORT = 'relevance' as const;
export const SEARCH_DURATION_MIN = 0;
export const SEARCH_DURATION_MAX = 20;
export const SEARCH_PRICE_MIN = 0;
export const SEARCH_PRICE_MAX = 1000;
export const SEARCH_PRICE_ABSOLUTE_MAX = 10000;
export const SEARCH_STORAGE_KEY = 'search-filters';

// Pagination
export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
