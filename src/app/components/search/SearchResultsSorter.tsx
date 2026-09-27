'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useInternationalization } from '@/hooks/useInternationalization';

interface SearchResultsSorterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchResultsSorter: React.FC<SearchResultsSorterProps> = ({ value, onChange }) => {
  const { t } = useInternationalization();
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-slate-500 uppercase">{t('search.sortSequence')}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#0a1120] border border-primary/30 text-primary text-sm pl-4 pr-10 py-2 focus:ring-1 focus:ring-primary focus:border-primary clip-corner appearance-none font-mono cursor-pointer hover:bg-primary/5 transition-colors"
        >
          <option value="popularity">{t('search.sort.popularity')}</option>
          <option value="newest">{t('search.sort.newest')}</option>
          <option value="price_asc">{t('search.sort.priceAsc')}</option>
          <option value="price_desc">{t('search.sort.priceDesc')}</option>
          <option value="rating">{t('search.sort.rating')}</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
      </div>
    </div>
  );
};

export default SearchResultsSorter;
