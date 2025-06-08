'use client';

import { useEffect } from 'react';
import { useSearchStore } from '@/store/searchStore';
import FilterSidebar from '@/components/search/FilterSidebar';
import SearchResultsSorter from '@/components/search/SearchResultsSorter';
import { useDebounce } from 'use-debounce';

export default function SearchPage() {
  const { searchQuery, setSearchQuery, syncWithUrl } = useSearchStore();
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    syncWithUrl();
  }, [syncWithUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FilterSidebar />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results
                </h2>
                <SearchResultsSorter />
              </div>

              {/* TODO: Implement search results component */}
              <div className="text-center text-gray-500 py-12">
                Search results will appear here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 