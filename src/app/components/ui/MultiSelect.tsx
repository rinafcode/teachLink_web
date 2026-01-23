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

  const handleAdd = () => {
    const available = options.filter(o => !selected.includes(o));
    if (available.length > 0) {
        onChange([...selected, available[0]]);
    }
  };

  return (
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
      
      <button 
        onClick={handleAdd}
        className="px-3 py-1 bg-transparent text-slate-500 text-xs font-mono border border-dashed border-slate-600 hover:border-primary hover:text-primary transition-colors clip-corner"
      >
        {placeholder}
      </button>
    </div>
  );
};

export default MultiSelect;
