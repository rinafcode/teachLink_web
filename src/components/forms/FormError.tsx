'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export type ApiFieldError = {
  field: string;
  message: string;
};

type FormErrorValue = string | string[] | ApiFieldError[] | null;

// --- GLOBAL FORM ERROR (For Backend / API Errors) ---
interface FormErrorProps {
  error?: FormErrorValue;
  className?: string;
  id?: string;
}

function isStructuredErrors(value: FormErrorValue): value is ApiFieldError[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  if (typeof first !== 'object' || first === null) return false;
  return 'field' in first;
}

export function FormError({ error, className = '', id }: FormErrorProps) {
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  if (!error) return null;

  if (isStructuredErrors(error)) {
    return (
      <motion.div
        ref={errorRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 ${className}`}
        role="alert"
        aria-live="assertive"
        id={id}
      >
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          {error.map((err, index) => (
            <span key={index} className="text-sm text-red-600 font-medium">
              <span className="font-semibold">{err.field}</span>: {err.message}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  const messages = Array.isArray(error) ? error : [error];

  return (
    <motion.div
      ref={errorRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 ${className}`}
      role="alert"
      aria-live="assertive"
      id={id}
    >
      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex flex-col">
        {messages.map((err, index) => (
          <span key={index} className="text-sm text-red-600 font-medium">
            {err}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// --- INLINE FIELD ERROR (For Client Form Validation) ---
interface FieldErrorProps {
  error?: string;
  id?: string;
}

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null;

  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 text-sm text-red-600 font-medium ml-1"
      role="alert"
      aria-live="polite"
      id={id}
    >
      {error}
    </motion.p>
  );
}
