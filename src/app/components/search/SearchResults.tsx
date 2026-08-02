'use client';

import React from 'react';
import { Star, Clock, User, ArrowRight, SearchX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { EmptyState } from '@/components';

export interface CourseResult {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  rating: number;
  price: number;
  originalPrice?: number | null;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  image: string;
  tag?: string | null;
  color: string;
}

interface SearchResultsProps {
  results: CourseResult[];
  isLoading?: boolean;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  /** Number of cards per page. Defaults to 12. */
  pageSize?: number;
  /** Initial page number. Defaults to 1. */
  initialPage?: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading = false,
  sortBy = 'relevance',
  onSortChange,
  pageSize = 12,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Reset to page 1 whenever the result set changes (new search / filter)
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, results.length);
  const visibleResults = results.slice(startIndex, endIndex);

  const goToPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
  const goToNext = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No courses found"
        description="Try adjusting your search or filters"
      />
    );
  }

  const getPriceDisplay = (price: number, originalPrice?: number | null) => {
    if (originalPrice) {
      const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
      return (
        <div className="flex items-end gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${price.toFixed(2)}
          </span>
          <span className="text-sm line-through text-gray-400 dark:text-gray-500">
            ${originalPrice.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-red-600 dark:text-red-400">{discount}% OFF</span>
        </div>
      );
    }
    return (
      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
        ${price.toFixed(2)}
      </span>
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'intermediate':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'advanced':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div>
      {/* Sort Controls / Result Count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {results.length === 0 ? 0 : startIndex + 1}–{endIndex}
          </span>{' '}
          of{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">{results.length}</span>{' '}
          results
        </p>
        {onSortChange && (
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        )}
      </div>

      {/* Results Grid — only the current page's slice */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-label={`Search results page ${safeCurrentPage} of ${totalPages}`}
      >
        {visibleResults.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg dark:hover:shadow-xl hover:shadow-gray-300 dark:hover:shadow-gray-900 transition-all duration-300"
          >
            {/* Course Image */}
            <div className="relative h-40 bg-linear-to-br from-gray-200 dark:from-gray-700 to-gray-300 dark:to-gray-800 overflow-hidden">
              <Image
                src={course.image}
                alt={course.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {course.tag && (
                <span className="absolute top-3 right-3 bg-yellow-400 dark:bg-yellow-500 text-gray-900 dark:text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                  {course.tag}
                </span>
              )}
              <div
                className={clsx(
                  'absolute top-3 left-3 px-2 py-1 rounded text-xs font-semibold',
                  getLevelColor(course.level),
                )}
              >
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </div>
            </div>

            {/* Course Info */}
            <div className="p-4">
              {/* Category */}
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                {course.category}
              </p>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {course.title}
              </h3>

              {/* Instructor */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                <User size={14} />
                <span className="line-clamp-1">{course.instructor}</span>
              </div>

              {/* Rating and Duration */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  <Star
                    size={14}
                    fill="currentColor"
                    className="text-yellow-400 dark:text-yellow-300"
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {course.rating}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span className="text-sm">{course.duration}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end justify-between">
                {getPriceDisplay(course.price, course.originalPrice)}
                <ArrowRight
                  size={18}
                  className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-3"
          aria-label="Search results pagination"
        >
          <button
            id="search-results-prev-page"
            type="button"
            onClick={goToPrev}
            disabled={safeCurrentPage === 1}
            className={clsx(
              'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200',
              safeCurrentPage === 1
                ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
            )}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400 select-none px-2">
            Page{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{safeCurrentPage}</span>{' '}
            of{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPages}</span>
          </span>

          <button
            id="search-results-next-page"
            type="button"
            onClick={goToNext}
            disabled={safeCurrentPage === totalPages}
            className={clsx(
              'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200',
              safeCurrentPage === totalPages
                ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
            )}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
};
