'use client';

import React, { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  name: string;
  label: string;
  icon?: LucideIcon;
  as?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode; // For select options
  rows?: number; // Explicitly add rows for textarea
  helperText?: React.ReactNode;
  certificationProgram?: string;
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
  rows,
  id,
  required,
  helperText,
  certificationProgram,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const generatedId = useId();
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const isError = !!error;
  const inputId = id ?? `${name}-${generatedId}`;
  const helperTextId = helperText ? `${inputId}-helper` : undefined;
  const certificationProgramId = certificationProgram
    ? `${inputId}-certification-program`
    : undefined;
  const errorId = isError ? `${inputId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, helperTextId, certificationProgramId, errorId].filter(Boolean).join(' ') ||
    undefined;

  const paddingLeftClass = Icon ? 'pl-10' : 'pl-4';
  const baseStyles = `
    w-full ${paddingLeftClass} pr-4 py-2.5 
    bg-gray-50 border rounded-xl 
    focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    outline-none transition-all duration-200 
    ${isError ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'}
    dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-700
  `;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      {certificationProgram && (
        <p
          id={certificationProgramId}
          className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-200"
        >
          Certification program: {certificationProgram}
        </p>
      )}
      <div className="relative group">
        {Icon && (
          <div
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            aria-hidden="true"
          >
            <Icon
              className={`h-5 w-5 ${
                isError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'
              } transition-colors`}
            />
          </div>
        )}

        {as === 'textarea' ? (
          <textarea
            {...(register(name) as any)}
            id={inputId}
            aria-invalid={isError}
            aria-required={required}
            aria-describedby={describedBy}
            className={`${baseStyles} resize-none ${className}`}
            rows={rows}
            required={required}
            {...(props as any)}
          />
        ) : as === 'select' ? (
          <select
            {...(register(name) as any)}
            id={inputId}
            aria-invalid={isError}
            aria-required={required}
            aria-describedby={describedBy}
            className={`${baseStyles} ${className}`}
            required={required}
            {...(props as any)}
          >
            {children}
          </select>
        ) : (
          <input
            {...register(name)}
            id={inputId}
            aria-invalid={isError}
            aria-required={required}
            aria-describedby={describedBy}
            className={`${baseStyles} ${className}`}
            required={required}
            {...(props as any)}
          />
        )}
      </div>

      {helperText && (
        <p id={helperTextId} className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
          {helperText}
        </p>
      )}

      {isError && (
        <p id={errorId} className="text-red-500 text-xs mt-1 ml-1 font-medium" role="alert">
          {error.message as string}
        </p>
      )}
    </div>
  );
};
