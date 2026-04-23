'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  name: string;
  label: string;
  icon?: LucideIcon;
  as?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode; // For select options
}

/**
 * Reusable FormInput component integrated with react-hook-form.
 */
export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  icon: Icon,
  as = 'input',
  children,
  className = '',
  ...props
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const isError = !!error;

  const baseStyles = `
    w-full pl-${Icon ? '10' : '4'} pr-4 py-2.5 
    bg-gray-50 border rounded-xl 
    focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    outline-none transition-all duration-200 
    ${isError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'}
    dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-700
  `;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${isError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'} transition-colors`} />
          </div>
        )}
        
        {as === 'textarea' ? (
          <textarea
            {...(register(name) as any)}
            className={`${baseStyles} resize-none ${className}`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : as === 'select' ? (
          <select
            {...(register(name) as any)}
            className={`${baseStyles} ${className}`}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        ) : (
          <input
            {...register(name)}
            className={`${baseStyles} ${className}`}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
      
      {isError && (
        <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
          {error.message as string}
        </p>
      )}
    </div>
  );
};
