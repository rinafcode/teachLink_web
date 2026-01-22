'use client';

import React from 'react';
import { BarChart2, Clock, Tag, Users, Search, RotateCcw, X } from 'lucide-react';
import { FilterState } from '../../hooks/useSearchFilters';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange, onReset }) => {
  
  const handleDifficultyChange = (input: string) => {
     const current = filters.difficulty || [];
     let newDifficulty;
     if (current.includes(input)) {
         newDifficulty = current.filter((d: string) => d !== input);
     } else {
         newDifficulty = [...current, input];
     }
     onFilterChange({ difficulty: newDifficulty });
  };

  const handleTopicToggle = (topic: string) => {
      const current = filters.topics || [];
      let newTopics;
      if (current.includes(topic)) {
          newTopics = current.filter((t: string) => t !== topic);
      } else {
          newTopics = [...current, topic];
      }
      onFilterChange({ topics: newTopics });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ duration: Number(e.target.value) });
  };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ priceRange: Number(e.target.value) });
    };

  const handleInstructorChange = (name: string) => {
      // Toggle instructor (simple radio behavior for this demo, or toggle)
      if (filters.instructor === name) {
          onFilterChange({ instructor: '' });
      } else {
          onFilterChange({ instructor: name });
      }
  };

  // Derived mock data
  const availableTopics = [
      { id: "01", name: "Design" }, 
      { id: "02", name: "Coding" }, 
      { id: "03", name: "Business" },
      { id: "04", name: "Marketing" },
      { id: "05", name: "Health" }
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-8 pr-2">
      
      {/* Level Filter */}
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <BarChart2 className="w-3 h-3" /> Level
        </h3>
        <div className="space-y-3">
          {[
              { id: 'beginner', label: 'Beginner' },
              { id: 'intermediate', label: 'Intermediate' },
              { id: 'advanced', label: 'Advanced' }
          ].map((level) => {
             const isChecked = filters.difficulty?.includes(level.id);
             return (
              <label key={level.id} className="flex items-center group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer h-4 w-4 rounded-sm border-slate-300 text-primary focus:ring-offset-0 focus:ring-1 focus:ring-primary/50 transition duration-150"
                    checked={isChecked}
                    onChange={() => handleDifficultyChange(level.id)}
                  />
                  <div className="absolute inset-0 border border-slate-300 rounded-sm pointer-events-none peer-checked:border-primary"></div>
                </div>
                <span className="ml-3 font-sans text-sm text-slate-600 group-hover:text-primary transition-colors">
                    {level.label}
                </span>
              </label>
             )
          })}
        </div>
      </div>

      {/* Duration Filter */}
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Clock className="w-3 h-3" /> Duration
        </h3>
        <div className="relative pt-2 pb-1">
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={filters.duration} 
                onChange={handleDurationChange}
                className="w-full"
            />
        </div>
        <div className="flex justify-between mt-3 font-mono text-[10px] text-slate-400 uppercase">
            <span>0h</span>
            <span className="text-primary font-bold bg-blue-50 px-2 py-0.5 rounded">Max: {filters.duration}h</span>
            <span>100h+</span>
        </div>
      </div>

      {/* Price Filter */}
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Clock className="w-3 h-3" /> Price
        </h3>
        <div className="relative pt-2 pb-1">
            <input 
                type="range" 
                min="0" 
                max="200" 
                value={filters.priceRange} 
                onChange={handlePriceChange}
                className="w-full"
            />
        </div>
        <div className="flex justify-between mt-3 font-mono text-[10px] text-slate-400 uppercase">
            <span>$0</span>
            <span className="text-primary font-bold bg-blue-50 px-2 py-0.5 rounded">Max: ${filters.priceRange}</span>
            <span>$200+</span>
        </div>
      </div>

      {/* Topics Filter */}
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Tag className="w-3 h-3" /> Topics
        </h3>
        <div className="flex flex-wrap gap-2">
            {availableTopics.map(topic => {
                const isActive = filters.topics?.includes(topic.name);
                return (
                    <button 
                        key={topic.id}
                        onClick={() => handleTopicToggle(topic.name)}
                        className={`group flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-medium transition-all shadow-sm
                            ${isActive 
                                ? 'bg-primary/5 border-primary text-primary hover:bg-primary/10' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                            }`}
                    >
                        <span className={`font-mono text-[9px] ${isActive ? 'opacity-60' : 'text-slate-300 group-hover:text-primary/50'}`}>
                            ID:{topic.id}
                        </span>
                        <span>{topic.name}</span>
                        {isActive && <X className="w-3 h-3 ml-1" />}
                    </button>
                )
            })}
        </div>
      </div>

      {/* Instructor Filter */}
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Users className="w-3 h-3" /> Instructor
        </h3>
        <div className="relative group mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-primary" />
            <input 
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-white rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono placeholder:text-slate-300 outline-none" 
                placeholder="FIND_INSTRUCTOR" 
                type="text"
                value={filters.instructor}
                onChange={(e) => onFilterChange({ instructor: e.target.value })}
            />
        </div>
        <div className="space-y-2">
            {[
                "Dr. Sarah Connor",
                "James Wilson"
            ].map(instructor => {
                const isSelected = filters.instructor === instructor;
                return (
                    <label key={instructor} className="flex items-center cursor-pointer group">
                        <input 
                            type="radio" 
                            name="instructor" 
                            className="hidden" 
                            checked={isSelected} 
                            onChange={() => handleInstructorChange(instructor)}
                        />
                        <div className={`w-4 h-4 border rounded-sm flex items-center justify-center mr-3 transition-colors ${isSelected ? 'border-primary' : 'border-slate-300 group-hover:border-primary'}`}>
                            <div className={`w-2 h-2 bg-primary rounded-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        <span className="text-sm text-slate-600 font-medium group-hover:text-primary transition-colors">
                            {instructor}
                        </span>
                    </label>
                )
            })}
        </div>
      </div>

      <button 
        onClick={onReset}
        className="w-full py-3 px-4 bg-slate-50 border border-slate-200 text-slate-600 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-white hover:border-primary hover:text-primary hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
      >
        <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        Reset Parameters
      </button>
    </aside>
  );
};
