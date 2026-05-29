/**
 * Review Search Engine
 *
 * A small, dependency-free search engine for the Rating System. It provides
 * full-text search, rating filtering and multi-key sorting over a collection
 * of course reviews. All functions are pure so they can be unit-tested in
 * isolation and reused on both the server and the client.
 */

export interface SearchableReview {
  id: string;
  userName: string;
  rating: number;
  /** Human-readable relative date, e.g. "2 days ago" or "1 week ago". */
  date: string;
  comment: string;
  helpful: number;
}

export type ReviewSortKey = 'relevance' | 'newest' | 'highestRated' | 'lowestRated' | 'mostHelpful';

export interface ReviewSearchOptions {
  /** Free-text query matched against the comment and reviewer name. */
  query?: string;
  /** Only include reviews with a rating greater than or equal to this value. */
  minRating?: number;
  /** Sort order applied to the matching reviews. Defaults to "relevance". */
  sortBy?: ReviewSortKey;
}

export interface ScoredReview<T extends SearchableReview> {
  review: T;
  /** Higher is more relevant. 0 when there is no active text query. */
  relevanceScore: number;
}

const RATING_MAX = 5;
const RATING_MIN = 0;

/**
 * Convert a relative date string (e.g. "3 days ago") into an approximate
 * number of days in the past. Unknown formats sort to the very end (oldest).
 */
export const relativeDateToDays = (date: string): number => {
  const match = /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i.exec(date.trim());
  if (!match) return Number.POSITIVE_INFINITY;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const perUnitInDays: Record<string, number> = {
    second: 1 / 86400,
    minute: 1 / 1440,
    hour: 1 / 24,
    day: 1,
    week: 7,
    month: 30,
    year: 365,
  };

  return value * (perUnitInDays[unit] ?? Number.POSITIVE_INFINITY);
};

/** Split a query into lowercased, non-empty search terms. */
const tokenize = (input: string): string[] =>
  input
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

const countOccurrences = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
};

/**
 * Compute a relevance score for a single review against the search terms.
 * Matches in the reviewer name are weighted higher than matches in the body,
 * and reviews that match every term receive a "covers all terms" bonus.
 */
export const scoreReview = (review: SearchableReview, terms: string[]): number => {
  if (terms.length === 0) return 0;

  const name = review.userName.toLowerCase();
  const comment = review.comment.toLowerCase();

  let score = 0;
  let matchedTerms = 0;

  for (const term of terms) {
    const nameHits = countOccurrences(name, term);
    const commentHits = countOccurrences(comment, term);
    if (nameHits > 0 || commentHits > 0) matchedTerms += 1;
    score += nameHits * 3 + commentHits;
  }

  if (matchedTerms === terms.length) score += terms.length * 2;

  return score;
};

const SORT_COMPARATORS: Record<
  ReviewSortKey,
  (a: ScoredReview<SearchableReview>, b: ScoredReview<SearchableReview>) => number
> = {
  relevance: (a, b) =>
    b.relevanceScore - a.relevanceScore ||
    relativeDateToDays(a.review.date) - relativeDateToDays(b.review.date),
  newest: (a, b) => relativeDateToDays(a.review.date) - relativeDateToDays(b.review.date),
  highestRated: (a, b) => b.review.rating - a.review.rating,
  lowestRated: (a, b) => a.review.rating - b.review.rating,
  mostHelpful: (a, b) => b.review.helpful - a.review.helpful,
};

/**
 * Search, filter and sort a list of reviews.
 *
 * - When a `query` is present, only reviews matching at least one term are kept.
 * - `minRating` removes reviews below the threshold.
 * - Results are sorted by the requested key (default "relevance"). The original
 *   input array is never mutated.
 */
export const searchReviews = <T extends SearchableReview>(
  reviews: readonly T[],
  options: ReviewSearchOptions = {},
): ScoredReview<T>[] => {
  const { query = '', minRating, sortBy = 'relevance' } = options;
  const terms = tokenize(query);
  const threshold = clampRating(minRating);

  const scored: ScoredReview<T>[] = [];

  for (const review of reviews) {
    if (threshold !== null && review.rating < threshold) continue;

    const relevanceScore = scoreReview(review, terms);
    // When a query is active, drop reviews that match none of the terms.
    if (terms.length > 0 && relevanceScore === 0) continue;

    scored.push({ review, relevanceScore });
  }

  const comparator = SORT_COMPARATORS[sortBy] ?? SORT_COMPARATORS.relevance;
  return scored.sort(comparator as (a: ScoredReview<T>, b: ScoredReview<T>) => number);
};

/** Clamp an optional rating threshold into the valid [0, 5] range. */
const clampRating = (value: number | undefined): number | null => {
  if (value === undefined || Number.isNaN(value)) return null;
  if (value <= RATING_MIN) return null;
  return Math.min(value, RATING_MAX);
};

/**
 * Split a piece of text into alternating non-match / match segments so the UI
 * can highlight occurrences of the query. The original casing is preserved and
 * the result re-joins to the input exactly.
 */
export const highlightTerms = (text: string, query: string): { text: string; match: boolean }[] => {
  const terms = tokenize(query);
  if (terms.length === 0) return [{ text, match: false }];

  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const segments = text.split(regex).filter((segment) => segment !== '');

  const lowerTerms = new Set(terms);
  return segments.map((segment) => ({
    text: segment,
    match: lowerTerms.has(segment.toLowerCase()),
  }));
};
