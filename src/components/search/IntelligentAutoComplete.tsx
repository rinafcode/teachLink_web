'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, ChevronRight, Sparkles, User, Tag, Type } from 'lucide-react';
import { getSearchSuggestions, highlightMatch } from '../../utils/searchUtils';

interface IntelligentAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  history?: string[];
}

export const IntelligentAutoComplete = React.memo<IntelligentAutoCompleteProps>(
  ({ value, onChange, onSearch, history = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestions = getSearchSuggestions(value);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback(
      (suggestion: string) => {
        onChange(suggestion);
        onSearch(suggestion);
        setIsOpen(false);
        setActiveIndex(-1);
      },
      [onChange, onSearch],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          setActiveIndex((prev) => Math.max(prev - 1, -1));
          e.preventDefault();
        } else if (e.key === 'Enter') {
          if (activeIndex >= 0) {
            handleSelect(suggestions[activeIndex]);
          } else {
            onSearch(value);
          }
          setIsOpen(false);
        } else if (e.key === 'Escape') {
          setIsOpen(false);
        }
      },
      [activeIndex, handleSelect, onSearch, suggestions, value],
    );

    const getSuggestionIcon = (suggestion: string) => {
      if (suggestion.startsWith('author:')) return <User className="w-3.5 h-3.5" />;
      if (suggestion.startsWith('topic:')) return <Tag className="w-3.5 h-3.5" />;
      if (suggestion.startsWith('type:')) return <Type className="w-3.5 h-3.5" />;
      return <Sparkles className="w-3.5 h-3.5" />;
    };

    return (
      <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 blur-xl group-focus-within:bg-blue-500/20 transition-all rounded-full"></div>
          <div className="relative flex items-center glass-panel rounded-2xl border-slate-200 group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all overflow-hidden bg-white/95 h-14 pr-2">
            <div className="pl-5 pr-3 text-slate-400">
              <Search className="w-5 h-5 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 font-sans text-lg h-full"
              placeholder="Search for knowledge, authors, or topics..."
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
            />
            {value && (
              <button
                onClick={() => onChange('')}
                className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onSearch(value)}
              className="bg-primary text-white px-6 py-2 rounded-xl font-mono text-xs uppercase tracking-widest font-bold hover:shadow-lg hover:shadow-primary/30 transition-all h-10 active:scale-95 ml-2"
            >
              Search
            </button>
          </div>
        </div>

        {isOpen && (suggestions.length > 0 || history.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-3 glass-panel rounded-2xl border-slate-200 overflow-hidden shadow-2xl z-50 bg-white/98 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-2">
              {history.length > 0 && !value && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Recent Searches
                  </div>
                  {history.map((term, i) => (
                    <button
                      key={`history-${i}`}
                      onClick={() => handleSelect(term)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors text-sm text-left group"
                    >
                      <Clock className="w-4 h-4 text-slate-300 group-hover:text-primary" />
                      <span className="flex-1 truncate">{term}</span>
                      <ChevronRight className="w-3 h-3 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {suggestions.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> {value ? 'Suggestions' : 'Trending Now'}
                  </div>
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={`suggestion-${i}`}
                      onClick={() => handleSelect(suggestion)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm text-left group ${
                        activeIndex === i
                          ? 'bg-primary/5 text-primary'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`${
                          activeIndex === i
                            ? 'text-primary'
                            : 'text-slate-300 group-hover:text-primary'
                        } transition-colors`}
                      >
                        {getSuggestionIcon(suggestion)}
                      </div>
                      <span className="flex-1 truncate">
                        {highlightMatch(suggestion, value).map((part, index) => (
                          <span
                            key={index}
                            className={
                              part.toLowerCase() === value.toLowerCase()
                                ? 'font-bold text-primary'
                                : ''
                            }
                          >
                            {part}
                          </span>
                        ))}
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 transition-all ${
                          activeIndex === i
                            ? 'translate-x-0.5 opacity-100 text-primary'
                            : 'opacity-0 group-hover:opacity-100 text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50/80 px-4 py-2 text-[10px] text-slate-400 flex justify-between border-t border-slate-100">
              <span>
                Use{' '}
                <span className="p-0.5 bg-white border border-slate-200 rounded font-bold px-1">
                  ↓
                </span>{' '}
                <span className="p-0.5 bg-white border border-slate-200 rounded font-bold px-1">
                  ↑
                </span>{' '}
                to navigate
              </span>
              <span>Esc to close</span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

IntelligentAutoComplete.displayName = 'IntelligentAutoComplete';
