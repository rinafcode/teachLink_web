"use client";

import React, { useEffect, useRef } from "react";
import { Search, X, Clock, Trash2 } from "lucide-react";
import { useSearch } from "../../hooks/useSearch";
import clsx from "clsx";

interface SearchBarProps {
  className?: string;
  isExpanded?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  isExpanded = false,
}) => {
  const {
    query,
    results,
    isLoading,
    searchHistory,
    isOpen,
    setIsOpen,
    search,
    clearHistory,
    navigate,
  } = useSearch();

  const [localExpanded, setLocalExpanded] = React.useState(isExpanded);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(-1);

  // Focus input when expanded
  useEffect(() => {
    if (localExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [localExpanded]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allResults = [
      ...results.courses,
      ...results.instructors,
      ...results.topics,
    ];

    if (!isOpen && e.key === "Enter") {
      setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndexRef.current = Math.min(
        selectedIndexRef.current + 1,
        allResults.length - 1,
      );
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, -1);
    } else if (e.key === "Enter" && selectedIndexRef.current >= 0) {
      e.preventDefault();
      const selected = allResults[selectedIndexRef.current];
      navigate(query || selected.title);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      selectedIndexRef.current = -1;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    search(value);
    setIsOpen(!!value);
    selectedIndexRef.current = -1;
  };

  const handleSearch = (term: string) => {
    navigate(term);
  };

  const handleClear = () => {
    search("");
    setIsOpen(false);
    selectedIndexRef.current = -1;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const allResults = [
    ...results.courses,
    ...results.instructors,
    ...results.topics,
  ];

  const hasResults = query && allResults.length > 0;
  const showSuggestions = !query && isOpen && searchHistory.length > 0;

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      {/* Search Bar Container */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          localExpanded
            ? "border-blue-500 bg-white shadow-lg w-full"
            : "border-gray-200 bg-gray-50 hover:border-gray-300 md:w-full"
        }`}
      >
        <Search size={18} className="text-gray-400 shrink-0" />

        <input
          ref={inputRef}
          type="text"
          placeholder="Search courses, instructors, topics..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setLocalExpanded(true);
            setIsOpen(true);
          }}
          className={clsx(
            "flex-1 bg-transparent outline-none text-sm",
            localExpanded ? "text-gray-800" : "text-gray-500",
          )}
        />

        {query && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Results */}
          {hasResults && !isLoading && (
            <div className="divide-y">
              {/* Courses */}
              {results.courses.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                    Courses
                  </div>
                  {results.courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleSearch(course.title)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      {course.image && (
                        <picture>
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-10 h-10 rounded object-cover"
                            loading="lazy"
                          />
                        </picture>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.instructor}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-yellow-500">★</span>
                        <span className="text-xs text-gray-600">
                          {course.rating}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Instructors */}
              {results.instructors.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                    Instructors
                  </div>
                  {results.instructors.map((instructor) => (
                    <button
                      key={instructor.id}
                      onClick={() => handleSearch(instructor.title)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      {instructor.image && (
                        <picture>
                          <img
                            src={instructor.image}
                            alt={instructor.title}
                            className="w-10 h-10 rounded-full"
                            loading="lazy"
                          />
                        </picture>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {instructor.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {instructor.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Topics */}
              {results.topics.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                    Topics
                  </div>
                  {results.topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleSearch(topic.title)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {topic.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {topic.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search History */}
          {showSuggestions && !isLoading && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 flex items-center justify-between">
                <span>Recent Searches</span>
                <button
                  onClick={clearHistory}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Clear history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && !hasResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !query && searchHistory.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">Start typing to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
