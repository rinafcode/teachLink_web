'use client';

import { useRatingStore } from '@/app/store/ratingStore';

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  portfolio?: ReviewPortfolioItem[];
}

interface CourseReviewsProps {
  averageRating?: number;
  totalReviews?: number;
  reviews?: Review[];
}

export default function CourseReviews({
  averageRating = 4.8,
  totalReviews = 1234,
  reviews = [
    {
      id: '1',
      userName: 'Sarah Johnson',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3',
      rating: 5,
      date: '2 days ago',
      comment:
        'Excellent course! The instructor explains complex concepts in a very clear and understandable way. Highly recommend!',
      helpful: 24,
      portfolio: [
        {
          id: 'portfolio-1',
          title: 'Capstone accessibility audit',
          url: 'https://example.com/portfolio/accessibility-audit',
          type: 'case-study',
          description: 'Before-and-after notes from the final project review.',
        },
      ],
    },
    {
      id: '2',
      userName: 'Michael Chen',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3',
      rating: 4,
      date: '1 week ago',
      comment:
        'Great content and well-structured. Would have liked more practical examples, but overall very satisfied.',
      helpful: 15,
    },
    {
      id: '3',
      userName: 'Emma Davis',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3',
      rating: 5,
      date: '2 weeks ago',
      comment:
        'This course exceeded my expectations. The projects are challenging but rewarding. Worth every penny!',
      helpful: 32,
    },
  ],
}: CourseReviewsProps) {
  const { markHelpful, getHelpfulCount, hasVotedHelpful } = useRatingStore();

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400' : 'text-[#E2E8F0] dark:text-[#334155]'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const ratingDistribution = [
    { stars: 5, percentage: 75 },
    { stars: 4, percentage: 15 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 3 },
    { stars: 1, percentage: 2 },
  ];

  return (
    <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-[#334155] dark:bg-[#1E293B] lg:mb-8 lg:p-8">
      <h2 className="mb-6 text-2xl font-bold text-[#0F172A] dark:text-white lg:text-3xl">
        Student Reviews
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-8 border-b border-[#E2E8F0] pb-8 dark:border-[#334155] md:grid-cols-3">
        <div className="text-center md:text-left">
          <div className="mb-2 text-5xl font-bold text-[#0F172A] dark:text-white">
            {averageRating}
          </div>
          <div className="mb-2 flex items-center justify-center md:justify-start">
            {renderStars(Math.round(averageRating))}
          </div>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {totalReviews.toLocaleString()} reviews
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          {ratingDistribution.map((dist) => (
            <div key={dist.stars} className="flex items-center gap-3">
              <span className="w-12 text-sm text-[#64748B] dark:text-[#94A3B8]">
                {dist.stars} star
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#334155]">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm text-[#64748B] dark:text-[#94A3B8]">
                {dist.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => {
          const portfolio = normalizePortfolioItems(review.portfolio);

          return (
            <div
              key={review.id}
              aria-label={`${review.userName} review. ${getPortfolioSummary(portfolio)}.`}
              className="border-b border-[#E2E8F0] pb-6 last:border-b-0 last:pb-0 dark:border-[#334155]"
            >
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-[#0F172A] dark:text-white">
                        {review.userName}
                      </h4>
                      <div className="mt-1 flex items-center gap-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mb-3 leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                    {review.comment}
                  </p>
                  {portfolio.length > 0 ? (
                    <div className="mb-3 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-3 dark:border-[#1E3A8A] dark:bg-[#172554]/40">
                      <h5 className="text-sm font-semibold text-[#1E3A8A] dark:text-[#BFDBFE]">
                        Portfolio evidence
                      </h5>
                      <ul className="mt-2 space-y-2">
                        {portfolio.map((item) => (
                          <li key={item.id}>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-[#0066FF] underline-offset-2 hover:underline dark:text-[#93C5FD]"
                            >
                              {item.title}
                            </a>
                            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs capitalize text-[#1E3A8A] dark:bg-[#1E293B] dark:text-[#BFDBFE]">
                              {item.type.replace('-', ' ')}
                            </span>
                            {item.description ? (
                              <p className="mt-1 text-sm text-[#475569] dark:text-[#CBD5E1]">
                                {item.description}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <button
                    onClick={() => markHelpful(review.id)}
                    className="inline-flex items-center gap-2 text-sm text-[#64748B] transition-colors hover:text-[#0066FF] dark:text-[#94A3B8] dark:hover:text-[#00C2FF]"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    Helpful ({helpful[review.id]})
                  </button>
                </div>
                <p className="mb-3 leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                  {review.comment}
                </p>
                <button
                  onClick={() => markHelpful(review.id, review.helpful)}
                  disabled={hasVotedHelpful(review.id)}
                  aria-pressed={hasVotedHelpful(review.id)}
                  className="inline-flex items-center gap-2 text-sm text-[#64748B] transition-colors hover:text-[#0066FF] dark:text-[#94A3B8] dark:hover:text-[#00C2FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Helpful ({getHelpfulCount(review.id, review.helpful)})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
