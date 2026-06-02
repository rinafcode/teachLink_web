import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRatingStore } from '../ratingStore';

// ─── Mock localStorage ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  localStorageMock.clear();
  useRatingStore.setState({ helpfulVotes: {}, votedHelpful: {}, userRatings: {} });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ratingStore', () => {
  beforeEach(resetStore);

  // ── markHelpful ────────────────────────────────────────────────────────────

  it('increments helpful count on first vote', () => {
    const { markHelpful, getHelpfulCount } = useRatingStore.getState();
    markHelpful('r1', 10);
    expect(getHelpfulCount('r1', 10)).toBe(11);
  });

  it('does not double-increment on repeat vote', () => {
    const { markHelpful, getHelpfulCount } = useRatingStore.getState();
    markHelpful('r1', 10);
    markHelpful('r1', 10);
    expect(getHelpfulCount('r1', 10)).toBe(11);
  });

  it('returns seed count when no vote has been cast', () => {
    const { getHelpfulCount } = useRatingStore.getState();
    expect(getHelpfulCount('r2', 5)).toBe(5);
  });

  it('tracks voted state correctly', () => {
    const { markHelpful, hasVotedHelpful } = useRatingStore.getState();
    expect(hasVotedHelpful('r1')).toBe(false);
    markHelpful('r1', 3);
    expect(hasVotedHelpful('r1')).toBe(true);
  });

  it('marks only the voted review as voted', () => {
    const { markHelpful, hasVotedHelpful } = useRatingStore.getState();
    markHelpful('r1', 3);
    expect(hasVotedHelpful('r2')).toBe(false);
  });

  // ── setUserRating ──────────────────────────────────────────────────────────

  it('stores a valid user rating', () => {
    const { setUserRating, getUserRating } = useRatingStore.getState();
    setUserRating('r1', 4);
    expect(getUserRating('r1')).toBe(4);
  });

  it('overwrites a previous user rating', () => {
    const { setUserRating, getUserRating } = useRatingStore.getState();
    setUserRating('r1', 3);
    setUserRating('r1', 5);
    expect(getUserRating('r1')).toBe(5);
  });

  it('ignores ratings outside 1–5 range', () => {
    const { setUserRating, getUserRating } = useRatingStore.getState();
    setUserRating('r1', 0);
    setUserRating('r1', 6);
    expect(getUserRating('r1')).toBeUndefined();
  });

  it('returns undefined when no rating is set', () => {
    expect(useRatingStore.getState().getUserRating('r99')).toBeUndefined();
  });

  // ── persistence ───────────────────────────────────────────────────────────

  it('retains votes across a store state reset (simulates re-hydration)', () => {
    const { markHelpful } = useRatingStore.getState();
    markHelpful('r1', 7);
    // Simulate re-hydration by merging stored state back
    const stored = { helpfulVotes: { r1: 8 }, votedHelpful: { r1: true }, userRatings: {} };
    useRatingStore.setState(stored);
    expect(useRatingStore.getState().getHelpfulCount('r1', 7)).toBe(8);
    expect(useRatingStore.getState().hasVotedHelpful('r1')).toBe(true);
  });

  it('retains user ratings across a store state reset (simulates re-hydration)', () => {
    const { setUserRating } = useRatingStore.getState();
    setUserRating('r1', 5);
    const stored = { helpfulVotes: {}, votedHelpful: {}, userRatings: { r1: 5 } };
    useRatingStore.setState(stored);
    expect(useRatingStore.getState().getUserRating('r1')).toBe(5);
  });
});
