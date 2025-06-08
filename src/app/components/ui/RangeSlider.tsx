'use client';

import ReactSlider from 'react-slider';
import { useCallback } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  step?: number;
}

export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  step = 1,
}: RangeSliderProps) {
  const handleChange = useCallback(
    (newValue: number[]) => {
      onChange([newValue[0], newValue[1]]);
    },
    [onChange]
  );

  return (
    <div className="px-2">
      <ReactSlider
        className="h-4 flex items-center"
        thumbClassName="w-4 h-4 bg-blue-600 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        trackClassName="h-1 bg-gray-200 rounded-full"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        step={step}
        pearling
        minDistance={1}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-500">
        <span>{formatValue(value[0])}</span>
        <span>{formatValue(value[1])}</span>
      </div>
    </div>
  );
} 