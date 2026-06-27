import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RatingState {
  /** Map of reviewId → current helpful vote count delta (added on top of seed). */
  helpfulVotes: Record<string, number>;
  /** Map of reviewId → whether current user has already voted helpful. */
  votedHelpful: Record<string, boolean>;
  /** Map of reviewId → user-submitted star rating (1–5). */
  userRatings: Record<string, number>;
}

interface RatingActions {
  markHelpful: (reviewId: string, seedCount: number) => void;
  setUserRating: (reviewId: string, rating: number) => void;
  getHelpfulCount: (reviewId: string, seedCount: number) => number;
  hasVotedHelpful: (reviewId: string) => boolean;
  getUserRating: (reviewId: string) => number | undefined;
}

export const useRatingStore = create<RatingState & RatingActions>()(
  persist(
    (set, get) => ({
      helpfulVotes: {},
      votedHelpful: {},
      userRatings: {},

      markHelpful(reviewId, seedCount) {
        if (get().votedHelpful[reviewId]) return;
        set((state) => ({
          helpfulVotes: {
            ...state.helpfulVotes,
            [reviewId]: seedCount + 1,
          },
          votedHelpful: { ...state.votedHelpful, [reviewId]: true },
        }));
      },

      setUserRating(reviewId, rating) {
        if (rating < 1 || rating > 5) return;
        set((state) => ({
          userRatings: { ...state.userRatings, [reviewId]: rating },
        }));
      },

      getHelpfulCount(reviewId, seedCount) {
        return get().helpfulVotes[reviewId] ?? seedCount;
      },

      hasVotedHelpful(reviewId) {
        return get().votedHelpful[reviewId] ?? false;
      },

      getUserRating(reviewId) {
        return get().userRatings[reviewId];
      },
    }),
    { name: 'teachlink-ratings' },
  ),
);
