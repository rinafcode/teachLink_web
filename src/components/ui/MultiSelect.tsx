'use client';

import React from 'react';
import { X } from 'lucide-react';

interface MultiSelectProps {
  options: string[]; 
  selected: string[]; 
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "+ ADD_PARAM"
}) => {
  const handleRemove = (item: string) => {
    onChange(selected.filter(i => i !== item));
  };

  const handleAdd = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
  };

  const available = options.filter(o => !selected.includes(o));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span 
            key={item}
            className="px-3 py-1 bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 cursor-pointer clip-corner flex items-center gap-2"
            onClick={() => handleRemove(item)}
          >
            {item} <X className="w-3 h-3" />
          </span>
        ))}
      </div>

      {available.length > 0 && (
        <select
          className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono text-slate-600"
          onChange={(e) => {
            handleAdd(e.target.value);
            e.currentTarget.value = "";
          }}
          defaultValue=""
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {available.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default MultiSelect;
