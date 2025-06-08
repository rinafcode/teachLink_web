'use client';

import { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  label,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        className="min-h-[38px] border rounded-md bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 p-2">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
              >
                {label}
                <button
                  type="button"
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(
                      options.find((opt) => opt.label === label)?.value || ''
                    );
                  }}
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <FaChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => toggleOption(option.value)}
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => {}}
                className="mr-2"
              />
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 