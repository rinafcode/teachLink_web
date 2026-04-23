'use client';

import React from 'react';
import {
  Heart,
  MessageSquare,
  Eye,
  Share2,
  User,
  Clock,
  Tag as TagIcon,
  Star,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { SearchResult } from '../../utils/searchUtils';

import { Skeleton } from '../ui/Skeleton';

interface SearchResultsVisualizerProps {
  results: SearchResult[];
  isSearching: boolean;
  sortBy: string;
  onSortChange: (sortBy: any) => void;
}

export const SearchResultsVisualizer = React.memo<SearchResultsVisualizerProps>(
  ({ results, isSearching, sortBy, onSortChange }) => {
    if (isSearching) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Skeleton width={120} height={20} />
            <Skeleton width={150} height={32} />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-panel p-6 rounded-3xl border-slate-200">
                <div className="flex items-start gap-6">
                  <div className="hidden sm:flex flex-col items-center gap-2">
                    <Skeleton width={40} height={40} variant="circle" />
                    <Skeleton width={20} height={8} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Skeleton width={60} height={16} className="rounded-full" />
                        <Skeleton width={80} height={16} className="rounded-full" />
                      </div>
                      <Skeleton width="60%" height={24} />
                    </div>
                    <div className="space-y-2">
                      <Skeleton width="90%" height={14} />
                      <Skeleton width="70%" height={14} />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Skeleton width={100} height={16} />
                      <Skeleton width={80} height={16} />
                      <Skeleton width={60} height={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Eye className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold font-sans text-slate-700 mb-2">No results found</h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm">
            Try expanding your search parameters or checking for typos.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold font-sans text-slate-800 flex items-center gap-2">
            {results.length} results{' '}
            <span className="text-slate-300 text-sm font-normal">discovered in 0.8s</span>
          </h2>
          <div className="relative group">
            <select
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-xs font-mono font-bold text-slate-600 outline-none hover:border-primary transition-colors cursor-pointer"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="relevance">SORT_BY_RELEVANCE</option>
              <option value="newest">SORT_BY_NEWEST</option>
              <option value="rating">SORT_BY_RATING</option>
              <option value="popularity">SORT_BY_POPULARITY</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="group glass-panel p-6 rounded-3xl border-slate-200 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-start gap-6">
                <div className="hidden sm:flex flex-col items-center gap-2 text-slate-300">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all font-mono font-bold text-xs ring-4 ring-slate-50">
                    {result.reputation || 'N/A'}
                  </div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-tighter">
                    REP
                  </span>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {result.type}
                        </span>
                        {result.topic && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">
                            {result.topic}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold font-sans text-slate-800 flex items-center gap-2 group-hover:text-primary transition-colors">
                        {result.title}
                        <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 pr-10">
                    {result.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-5 border-t border-slate-50 pt-4 mt-2">
                    {result.author && (
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-500">
                          <User className="w-3 h-3" />
                        </div>
                        {result.author}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(result.createdAt).toLocaleDateString()}
                    </div>

                    {result.rating && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-400/10 rounded-lg text-yellow-700 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {result.rating}
                      </div>
                    )}

                    {result.difficulty && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <BarChart className="w-3.5 h-3.5" />
                        {result.difficulty.toUpperCase()}
                      </div>
                    )}

                    {result.price !== undefined && (
                      <div className="ml-auto text-primary font-bold font-mono">
                        {result.price === 0 ? 'FREE' : `$${result.price}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

SearchResultsVisualizer.displayName = 'SearchResultsVisualizer';

const BarChart = React.memo(({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
));

BarChart.displayName = 'BarChart';
