'use client';

import React from 'react';
import {
    BarChart,
    DollarSign,
    Tag as TagIcon,
    Star,
    Calendar,
    Filter,
    RotateCcw,
    Check,
    ChevronDown
} from 'lucide-react';
import { SearchFilters, SearchContentType } from '../../utils/searchUtils';
import { MultiSelect } from '../ui/MultiSelect';
import { RangeSlider } from '../ui/RangeSlider';

interface FacetedFilterSystemProps {
    filters: SearchFilters;
    onFilterChange: (filters: Partial<SearchFilters>) => void;
    onReset: () => void;
}

const CONTENT_TYPES: { id: SearchContentType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Content', icon: '🌐' },
    { id: 'post', label: 'Posts', icon: '📄' },
    { id: 'course', label: 'Courses', icon: '🎓' },
    { id: 'tutorial', label: 'Tutorials', icon: '💡' },
    { id: 'profile', label: 'Authors', icon: '👤' },
    { id: 'topic', label: 'Topics', icon: '📂' },
];

const TOPIC_OPTIONS = ['Coding', 'Design', 'Starknet', 'Cairo', 'Web3', 'Blockchain', 'Next.js', 'React'];
const DIFFICULTY_LEVELS = [
    { id: 'beginner', label: 'Beginner', color: 'bg-green-500' },
    { id: 'intermediate', label: 'Intermediate', color: 'bg-yellow-500' },
    { id: 'advanced', label: 'Advanced', color: 'bg-red-500' },
];

export const FacetedFilterSystem: React.FC<FacetedFilterSystemProps> = ({
    filters,
    onFilterChange,
    onReset,
}) => {
    const toggleContentType = (type: SearchContentType) => {
        let newTypes: SearchContentType[];
        if (type === 'all') {
            newTypes = ['all'];
        } else {
            const current = filters.types.filter(t => t !== 'all');
            if (current.includes(type)) {
                newTypes = current.filter(t => t !== type);
                if (newTypes.length === 0) newTypes = ['all'];
            } else {
                newTypes = [...current, type];
            }
        }
        onFilterChange({ types: newTypes });
    };

    const toggleDifficulty = (level: string) => {
        const current = filters.difficulty;
        const next = current.includes(level)
            ? current.filter(l => l !== level)
            : [...current, level];
        onFilterChange({ difficulty: next });
    };

    return (
        <div className="space-y-6">
            {/* Content Types (Chips) */}
            <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Filter className="w-3 h-3" /> Content Type
                    </h3>
                    <button
                        onClick={onReset}
                        className="text-[10px] font-mono text-primary flex items-center gap-1 hover:underline active:scale-95 transition-all"
                    >
                        <RotateCcw className="w-2.5 h-2.5" /> RESET_ALL
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((type) => {
                        const isActive = filters.types.includes(type.id);
                        return (
                            <button
                                key={type.id}
                                onClick={() => toggleContentType(type.id)}
                                className={`py-2 px-4 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${isActive
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-primary/5'
                                    }`}
                            >
                                <span>{type.icon}</span> {type.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topics Filter */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <TagIcon className="w-3 h-3" /> Targeted Topics
                    </h3>
                    <MultiSelect
                        options={TOPIC_OPTIONS}
                        selected={filters.topics}
                        onChange={(topics) => onFilterChange({ topics })}
                        placeholder="+ ADD_TOPIC"
                    />
                </div>

                {/* Difficulty Filter */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <BarChart className="w-3 h-3" /> Complexity Level
                    </h3>
                    <div className="flex flex-col gap-2">
                        {DIFFICULTY_LEVELS.map((level) => {
                            const isActive = filters.difficulty.includes(level.id);
                            return (
                                <button
                                    key={level.id}
                                    onClick={() => toggleDifficulty(level.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isActive
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${level.color}`}></div>
                                        <span className="text-sm font-medium">{level.label}</span>
                                    </div>
                                    {isActive && <Check className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div className="glass-panel p-6 rounded-2xl md:col-span-2">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                        <DollarSign className="w-3 h-3" /> Price Ceiling (USD)
                    </h3>
                    <RangeSlider
                        min={0}
                        max={500}
                        value={filters.priceRange[1]}
                        onChange={(val) => onFilterChange({ priceRange: [filters.priceRange[0], val] })}
                        step={10}
                    />
                    <div className="flex justify-between mt-4">
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">FREE</span>
                        <span className="text-xs font-mono font-bold text-primary flex items-center gap-1">
                            LIMIT: <span className="bg-primary/10 px-2 py-0.5 rounded text-primary">${filters.priceRange[1]}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">$500+</span>
                    </div>
                </div>

                {/* Minimum Rating */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Star className="w-3 h-3" /> Min Rating
                    </h3>
                    <div className="flex flex-col gap-2">
                        {[4, 3, 2].map((min) => {
                            const isActive = filters.rating === min;
                            return (
                                <button
                                    key={min}
                                    onClick={() => onFilterChange({ rating: isActive ? null : min })}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isActive
                                            ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500'
                                        }`}
                                >
                                    <div className="flex text-yellow-400">
                                        {[...Array(min)].map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                        {[...Array(5 - min)].map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold font-mono">& UP</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
