/**
 * Unit Tests for the Review Search Engine
 */
import { describe, it, expect } from 'vitest';
import {
  searchReviews,
  scoreReview,
  relativeDateToDays,
  highlightTerms,
  type SearchableReview,
} from '../reviewSearch';

const makeReview = (overrides: Partial<SearchableReview> = {}): SearchableReview => ({
  id: '1',
  userName: 'Sarah Johnson',
  rating: 5,
  date: '2 days ago',
  comment: 'Excellent course with clear explanations.',
  helpful: 24,
  ...overrides,
});

const reviews: SearchableReview[] = [
  makeReview({
    id: 'a',
    userName: 'Sarah Johnson',
    rating: 5,
    date: '2 days ago',
    comment: 'Excellent course! Very clear instructor.',
    helpful: 24,
  }),
  makeReview({
    id: 'b',
    userName: 'Michael Chen',
    rating: 4,
    date: '1 week ago',
    comment: 'Great content but wanted more practical examples.',
    helpful: 15,
  }),
  makeReview({
    id: 'c',
    userName: 'Emma Davis',
    rating: 3,
    date: '2 weeks ago',
    comment: 'Decent course, the examples were helpful.',
    helpful: 32,
  }),
];

describe('relativeDateToDays', () => {
  it('parses common relative date units', () => {
    expect(relativeDateToDays('2 days ago')).toBe(2);
    expect(relativeDateToDays('1 week ago')).toBe(7);
    expect(relativeDateToDays('3 weeks ago')).toBe(21);
    expect(relativeDateToDays('1 month ago')).toBe(30);
  });

  it('handles singular and plural and extra whitespace', () => {
    expect(relativeDateToDays('1 day ago')).toBe(1);
    expect(relativeDateToDays('  5   hours ago ')).toBeCloseTo(5 / 24);
  });

  it('returns Infinity for unknown formats so they sort last', () => {
    expect(relativeDateToDays('yesterday')).toBe(Number.POSITIVE_INFINITY);
    expect(relativeDateToDays('')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('scoreReview', () => {
  it('returns 0 when there are no search terms', () => {
    expect(scoreReview(makeReview(), [])).toBe(0);
  });

  it('weights reviewer-name matches higher than comment matches', () => {
    const nameMatch = scoreReview(makeReview({ userName: 'cairo', comment: 'nothing' }), ['cairo']);
    const commentMatch = scoreReview(makeReview({ userName: 'nobody', comment: 'cairo' }), [
      'cairo',
    ]);
    expect(nameMatch).toBeGreaterThan(commentMatch);
  });

  it('rewards reviews that match every term', () => {
    const review = makeReview({ comment: 'clear and practical course' });
    const both = scoreReview(review, ['clear', 'practical']);
    const one = scoreReview(review, ['clear', 'missing']);
    expect(both).toBeGreaterThan(one);
  });
});

describe('searchReviews', () => {
  it('returns all reviews scored 0 when no query or filter is given', () => {
    const result = searchReviews(reviews);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.relevanceScore === 0)).toBe(true);
  });

  it('filters out reviews that match none of the query terms', () => {
    const result = searchReviews(reviews, { query: 'practical' });
    expect(result).toHaveLength(1);
    expect(result[0].review.id).toBe('b');
  });

  it('is case-insensitive', () => {
    const result = searchReviews(reviews, { query: 'EXCELLENT' });
    expect(result.map((r) => r.review.id)).toEqual(['a']);
  });

  it('filters by minimum rating', () => {
    const result = searchReviews(reviews, { minRating: 4 });
    expect(result.map((r) => r.review.id).sort()).toEqual(['a', 'b']);
  });

  it('ignores a zero or negative minimum rating', () => {
    expect(searchReviews(reviews, { minRating: 0 })).toHaveLength(3);
  });

  it('sorts by newest using parsed relative dates', () => {
    const result = searchReviews(reviews, { sortBy: 'newest' });
    expect(result.map((r) => r.review.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by highest and lowest rating', () => {
    expect(searchReviews(reviews, { sortBy: 'highestRated' }).map((r) => r.review.rating)).toEqual([
      5, 4, 3,
    ]);
    expect(searchReviews(reviews, { sortBy: 'lowestRated' }).map((r) => r.review.rating)).toEqual([
      3, 4, 5,
    ]);
  });

  it('sorts by most helpful', () => {
    const result = searchReviews(reviews, { sortBy: 'mostHelpful' });
    expect(result.map((r) => r.review.id)).toEqual(['c', 'a', 'b']);
  });

  it('sorts by relevance and breaks ties by recency', () => {
    const result = searchReviews(reviews, { query: 'course', sortBy: 'relevance' });
    // 'a' and 'c' both mention "course"; 'a' is more recent so it comes first.
    expect(result.map((r) => r.review.id)).toEqual(['a', 'c']);
  });

  it('combines query and rating filter', () => {
    const result = searchReviews(reviews, { query: 'course', minRating: 4 });
    expect(result.map((r) => r.review.id)).toEqual(['a']);
  });

  it('does not mutate the input array', () => {
    const original = [...reviews];
    searchReviews(reviews, { sortBy: 'highestRated' });
    expect(reviews).toEqual(original);
  });
});

describe('highlightTerms', () => {
  it('returns a single non-matching segment when there is no query', () => {
    expect(highlightTerms('Hello world', '')).toEqual([{ text: 'Hello world', match: false }]);
  });

  it('marks matching segments while preserving original casing', () => {
    const segments = highlightTerms('Excellent course is excellent', 'excellent');
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(['Excellent', 'excellent']);
    expect(segments.map((s) => s.text).join('')).toBe('Excellent course is excellent');
  });

  it('escapes regex special characters in the query', () => {
    const segments = highlightTerms('Cost is $5 today', '$5');
    expect(segments.some((s) => s.match && s.text === '$5')).toBe(true);
  });
});
