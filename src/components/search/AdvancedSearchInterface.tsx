'use client';

import React, { useState } from 'react';
import {
    Search,
    Filter,
    Settings,
    Sparkles,
    ArrowLeft,
    X,
    History,
    TrendingUp,
    BrainCircuit
} from 'lucide-react';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { IntelligentAutoComplete } from './IntelligentAutoComplete';
import { FacetedFilterSystem } from './FacetedFilterSystem';
import { SearchResultsVisualizer } from './SearchResultsVisualizer';

export const AdvancedSearchInterface: React.FC = () => {
    const {
        query,
        updateSearchText,
        updateFilters,
        updateSort,
        performSearch,
        clearFilters,
        results,
        isSearching,
        history,
    } = useAdvancedSearch();

    const [showFilters, setShowFilters] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (text: string) => {
        updateSearchText(text);
        performSearch();
        setHasSearched(true);
    };

    const handleReset = () => {
        clearFilters();
        updateSearchText('');
        setHasSearched(false);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
            {/* Search Header Section */}
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold uppercase tracking-widest mb-2">
                    <BrainCircuit className="w-3.5 h-3.5" /> AI-Powered Discovery
                </div>
                <h1 className="text-4xl md:text-6xl font-black font-sans text-slate-800 tracking-tight">
                    Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Expertise</span> Faster.
                </h1>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    Search across the entire Starknet knowledge ecosystem with multi-dimensional filters and intelligent suggestions.
                </p>
            </div>

            {/* Main Search Bar Container */}
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <IntelligentAutoComplete
                            value={query.text}
                            onChange={updateSearchText}
                            onSearch={handleSearch}
                            history={history}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold transition-all h-[56px] border ${showFilters
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                            }`}
                    >
                        <Filter className={`w-4 h-4 ${showFilters ? 'rotate-180' : ''} transition-transform duration-300`} />
                        {showFilters ? 'HIDE_FILTERS' : 'FILTERS'}
                    </button>
                </div>

                {/* Quick Insights / Trending Tags */}
                {!hasSearched && !showFilters && (
                    <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 animate-in fade-in slide-in-from-bottom-2 delay-300 duration-700">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" /> Trending:
                        </span>
                        {['#Cairo1.0', '#StarknetOS', '#ZeroKnowledge', '#L2Scalability'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleSearch(tag)}
                                className="text-xs font-medium px-3 py-1 rounded-full bg-slate-50 border border-slate-100 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Interface Body */}
            <div className="grid grid-cols-1 gap-12">
                {/* Filters Panel (Collapsible) */}
                {showFilters && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <FacetedFilterSystem
                            filters={query.filters}
                            onFilterChange={updateFilters}
                            onReset={clearFilters}
                        />
                    </div>
                )}

                {/* Results Section */}
                <div className={`space-y-8 ${isSearching ? 'opacity-70' : ''} transition-opacity`}>
                    {hasSearched ? (
                        <SearchResultsVisualizer
                            results={results}
                            isSearching={isSearching}
                            sortBy={query.sortBy}
                            onSortChange={updateSort}
                        />
                    ) : (
                        <div className="py-20 text-center space-y-8 max-w-lg mx-auto">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                <div className="relative glass-panel w-24 h-24 rounded-3xl flex items-center justify-center text-primary mb-6 mx-auto rotate-12 hover:rotate-0 transition-transform duration-500">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">Ready to explore?</h3>
                                <p className="text-slate-500">
                                    Discover a curated collection of decentralized knowledge, from beginners tutorials to advanced cryptographic research.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-panel p-4 rounded-2xl border-slate-100 text-left space-y-2 hover:border-primary/20 transition-colors group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <BrainCircuit className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-bold font-sans">Learn Cairo</h4>
                                    <p className="text-[11px] text-slate-400">Master the native language of Starknet.</p>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl border-slate-100 text-left space-y-2 hover:border-secondary transition-colors group cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-accent group-hover:text-white transition-colors">
                                        <Filter className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-bold font-sans">Find Topics</h4>
                                    <p className="text-[11px] text-slate-400">Explore categorized knowledge bases.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Insights Tooltip (Utility) */}
            <div className="fixed bottom-8 left-8">
                <div className="relative group">
                    <button className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all shadow-xl shadow-slate-200/50 hover:shadow-primary/20 hover:scale-110 active:scale-95">
                        <History className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-0 mb-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 p-4">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <History className="w-3 h-3" /> Recent History
                        </h4>
                        <div className="space-y-2">
                            {history.length > 0 ? (
                                history.slice(0, 5).map((term, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSearch(term)}
                                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-xs text-slate-600 truncate flex items-center gap-2"
                                    >
                                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                        {term}
                                    </button>
                                ))
                            ) : (
                                <p className="text-[10px] text-slate-300 italic">No recent searches</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearchInterface;
