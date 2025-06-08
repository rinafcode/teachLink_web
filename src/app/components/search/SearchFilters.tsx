'use client';

import { useSearchFilters } from '@/hooks/useSearchFilters';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Difficulty } from '@/store/searchStore';

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

const TOPIC_OPTIONS = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'music', label: 'Music' },
  { value: 'photography', label: 'Photography' },
] as const;

const INSTRUCTOR_OPTIONS = [
  { value: 'john-doe', label: 'John Doe' },
  { value: 'jane-smith', label: 'Jane Smith' },
  { value: 'mike-johnson', label: 'Mike Johnson' },
  { value: 'sarah-williams', label: 'Sarah Williams' },
] as const;

export const SearchFilters = () => {
  const {
    filters: { difficulty, duration, topics, instructors, price },
    handlers: {
      handleDifficultyChange,
      handleDurationChange,
      handleTopicsChange,
      handleInstructorsChange,
      handlePriceChange,
    },
  } = useSearchFilters();

  return (
    <div className="space-y-6">
      {/* Difficulty Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Difficulty Level</h3>
        <div className="mt-2">
          <MultiSelect
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            onChange={handleDifficultyChange}
            placeholder="Select difficulty levels"
          />
        </div>
      </div>

      {/* Duration Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Duration (hours)</h3>
        <div className="mt-2">
          <RangeSlider
            min={0}
            max={20}
            step={1}
            value={duration}
            onChange={handleDurationChange}
            formatLabel={(value) => `${value}h`}
          />
        </div>
      </div>

      {/* Topics Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Topics</h3>
        <div className="mt-2">
          <MultiSelect
            options={TOPIC_OPTIONS}
            value={topics}
            onChange={handleTopicsChange}
            placeholder="Select topics"
            searchable
          />
        </div>
      </div>

      {/* Instructors Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Instructors</h3>
        <div className="mt-2">
          <MultiSelect
            options={INSTRUCTOR_OPTIONS}
            value={instructors}
            onChange={handleInstructorsChange}
            placeholder="Select instructors"
            searchable
          />
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Price Range ($)</h3>
        <div className="mt-2">
          <RangeSlider
            min={0}
            max={1000}
            step={10}
            value={price}
            onChange={handlePriceChange}
            formatLabel={(value) => `$${value}`}
          />
        </div>
      </div>
    </div>
  );
}; 