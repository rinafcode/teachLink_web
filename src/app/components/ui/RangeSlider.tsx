"use client";

import React from "react";

interface RangeSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  step?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  className = "",
  step = 1,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={`relative py-2 ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={handleChange}
        className="w-full"
      />
      <div className="absolute top-0 bottom-0 w-full h-full pointer-events-none flex justify-between px-1 -z-10">
        <div className="w-px h-2 bg-slate-700 dark:bg-slate-400 mt-3 opacity-50"></div>
        <div className="w-px h-2 bg-slate-700 dark:bg-slate-400 mt-3 opacity-50"></div>
        <div className="w-px h-2 bg-slate-700 dark:bg-slate-400 mt-3 opacity-50"></div>
        <div className="w-px h-2 bg-slate-700 dark:bg-slate-400 mt-3 opacity-50"></div>
        <div className="w-px h-2 bg-slate-700 dark:bg-slate-400 mt-3 opacity-50"></div>
      </div>
    </div>
  );
};

export default RangeSlider;
