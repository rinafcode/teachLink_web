'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SearchResultsSorterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchResultsSorter: React.FC<SearchResultsSorterProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-slate-500 uppercase">Sort_Sequence:</span>
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#0a1120] border border-primary/30 text-primary text-sm pl-4 pr-10 py-2 focus:ring-1 focus:ring-primary focus:border-primary clip-corner appearance-none font-mono cursor-pointer hover:bg-primary/5 transition-colors"
        >
          <option value="popularity">POPULARITY</option>
          <option value="newest">NEWEST_FIRST</option>
          <option value="price_asc">PRICE_ASC</option>
          <option value="price_desc">PRICE_DESC</option>
          <option value="rating">RATING_HIGH</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
      </div>
    </div>
  );
};

export default SearchResultsSorter;
