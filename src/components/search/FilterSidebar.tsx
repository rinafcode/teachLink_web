'use client';

import React, { useCallback } from 'react';
import { BarChart2, Clock, Tag, Users, Search, RotateCcw, LifeBuoy, Cpu } from 'lucide-react';
import { FilterState } from '../../hooks/useSearchFilters';
import { RangeSlider } from '../ui/RangeSlider';
import { MultiSelect } from '../ui/MultiSelect';
import { FilterHelpPopover } from './FilterHelpPopover';
import { FilterSupportGuide } from './FilterSupportGuide';
import { useFilterCustomerSupport } from '../../hooks/useFilterCustomerSupport';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

const TOPIC_OPTIONS = ['Design', 'Coding', 'Business', 'Marketing', 'Health'];

export const FilterSidebar = React.memo<FilterSidebarProps>(
  ({ filters, onFilterChange, onReset }) => {
    const support = useFilterCustomerSupport();

    const handleDifficultyChange = useCallback(
      (input: string) => {
        const current = filters.difficulty || [];
        const updated = current.includes(input)
          ? current.filter((d: string) => d !== input)
          : [...current, input];
        onFilterChange({ difficulty: updated });
      },
      [filters.difficulty, onFilterChange],
    );

    const handleInstructorChange = useCallback(
      (name: string) => {
        if (filters.instructor === name) {
          onFilterChange({ instructor: '' });
        } else {
          onFilterChange({ instructor: name });
        }
      },
      [filters.instructor, onFilterChange],
    );

    return (
      <aside className="w-full lg:w-72 shrink-0 space-y-8 pr-2">
        <div className="glass-panel p-5 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <BarChart2 className="w-3 h-3" /> Level
            <FilterHelpPopover
              content={support.FILTER_HELP_CONTENT.difficulty}
              isOpen={support.activeHelpId === 'difficulty'}
              onToggle={() => support.toggleHelp('difficulty')}
              onClose={support.closeHelp}
            />
          </h3>
          <div className="space-y-3">
            {[
              { id: 'beginner', label: 'Beginner' },
              { id: 'intermediate', label: 'Intermediate' },
              { id: 'advanced', label: 'Advanced' },
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
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Clock className="w-3 h-3" /> Duration
            <FilterHelpPopover
              content={support.FILTER_HELP_CONTENT.duration}
              isOpen={support.activeHelpId === 'duration'}
              onToggle={() => support.toggleHelp('duration')}
              onClose={support.closeHelp}
            />
          </h3>
          <RangeSlider
            min={0}
            max={100}
            value={filters.duration}
            onChange={(value) => onFilterChange({ duration: value })}
          />
          <div className="flex justify-between mt-3 font-mono text-[10px] text-slate-400 uppercase">
            <span>0h</span>
            <span className="text-primary font-bold bg-blue-50 px-2 py-0.5 rounded">
              Max: {filters.duration}h
            </span>
            <span>100h+</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Clock className="w-3 h-3" /> Price
            <FilterHelpPopover
              content={support.FILTER_HELP_CONTENT.price}
              isOpen={support.activeHelpId === 'price'}
              onToggle={() => support.toggleHelp('price')}
              onClose={support.closeHelp}
            />
          </h3>
          <RangeSlider
            min={0}
            max={200}
            value={filters.priceRange}
            onChange={(value) => onFilterChange({ priceRange: value })}
            step={5}
          />
          <div className="flex justify-between mt-3 font-mono text-[10px] text-slate-400 uppercase">
            <span>$0</span>
            <span className="text-primary font-bold bg-blue-50 px-2 py-0.5 rounded">
              Max: ${filters.priceRange}
            </span>
            <span>$200+</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Tag className="w-3 h-3" /> Topics
            <FilterHelpPopover
              content={support.FILTER_HELP_CONTENT.topics}
              isOpen={support.activeHelpId === 'topics'}
              onToggle={() => support.toggleHelp('topics')}
              onClose={support.closeHelp}
            />
          </h3>
          <MultiSelect
            options={TOPIC_OPTIONS}
            selected={filters.topics}
            onChange={(topics) => onFilterChange({ topics })}
            placeholder="+ ADD_TOPIC"
          />
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Users className="w-3 h-3" /> Instructor
            <FilterHelpPopover
              content={support.FILTER_HELP_CONTENT.instructor}
              isOpen={support.activeHelpId === 'instructor'}
              onToggle={() => support.toggleHelp('instructor')}
              onClose={support.closeHelp}
            />
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
            {['Dr. Sarah Connor', 'James Wilson'].map((instructor) => {
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
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center mr-3 transition-colors ${
                      isSelected ? 'border-primary' : 'border-slate-300 group-hover:border-primary'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 bg-primary rounded-sm transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0'
                      }`}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-primary transition-colors">
                    {instructor}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Node Affinity Filter */}
        <div className="glass-panel p-5 rounded-xl">
          <h3 className="flex items-center gap-2 text-xs font-mono font-bold text-tech-text uppercase tracking-widest mb-4">
            <Cpu className="w-3.5 h-3.5 text-blue-500" /> Node Affinity
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mb-3 leading-relaxed">
            Select target cluster node for query execution and data fetching.
          </p>
          <div className="space-y-3">
            {[
              { id: 'auto', label: 'Auto (Optimized)', desc: 'Dynamic load balancing' },
              { id: 'primary', label: 'Primary Cluster', desc: 'Direct consistency check' },
              { id: 'replica', label: 'Replica Node', desc: 'Fast read-heavy execution' },
              { id: 'edge', label: 'Edge Cache', desc: 'Minimal latency routing' },
            ].map((node) => {
              const isSelected = (filters.nodeAffinity || 'auto') === node.id;
              return (
                <label key={node.id} className="flex items-start cursor-pointer group">
                  <input
                    type="radio"
                    name="nodeAffinity"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => onFilterChange({ nodeAffinity: node.id })}
                  />
                  <div
                    className={`w-4 h-4 border rounded-sm flex items-center justify-center mr-3 mt-0.5 transition-colors ${
                      isSelected ? 'border-primary' : 'border-slate-300 group-hover:border-primary'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 bg-primary rounded-sm transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0'
                      }`}
                    ></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">
                      {node.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {node.desc}
                    </span>
                  </div>
                </label>
              );
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

        <button
          type="button"
          onClick={support.openGuide}
          className="w-full py-3 px-4 bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <LifeBuoy className="w-4 h-4" />
          Need Help?
        </button>

        <FilterSupportGuide
          isOpen={support.guideOpen}
          onClose={support.closeGuide}
          helpContent={support.FILTER_HELP_CONTENT}
        />
      </aside>
    );
  },
);

FilterSidebar.displayName = 'FilterSidebar';
