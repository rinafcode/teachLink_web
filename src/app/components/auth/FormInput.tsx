'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, forwardRef } from 'react';
import { FieldError } from '../../../components/forms/FormError';

interface FormInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<'input'>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
  > {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      icon,
      type,
      id,
      required,
      helperText,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const inputId = id ?? `auth-input-${generatedId}`;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, helperTextId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            type={inputType}
            required={required}
            aria-invalid={!!error}
            aria-required={required}
            aria-describedby={describedBy}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            animate={{
              scale: isFocused ? 1.01 : 1,
              borderColor: error ? '#ef4444' : isFocused ? '#3b82f6' : '#d1d5db',
            }}
            transition={{ duration: 0.2 }}
            className={`w-full px-4 py-3 ${
              icon ? 'pl-10' : ''
            } pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            {...(props as object)}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
              aria-pressed={showPassword}
              aria-controls={inputId}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff size={20} aria-hidden="true" />
              ) : (
                <Eye size={20} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {helperText && (
          <p id={helperTextId} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 ml-1">
            {helperText}
          </p>
        )}
        <FieldError error={error} id={errorId} />
      </motion.div>
    );
  },
);

FormInput.displayName = 'FormInput';
