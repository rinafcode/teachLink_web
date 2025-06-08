'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchFilters } from './SearchFilters';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

export const FilterSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { handlers: { handleClearFilters } } = useSearchFilters();

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <FunnelIcon className="w-5 h-5" />
        Filters
      </button>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-white shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto">
                <SearchFilters />
              </div>

              <div className="p-4 border-t">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          <SearchFilters />
        </div>
      </div>
    </>
  );
}; 