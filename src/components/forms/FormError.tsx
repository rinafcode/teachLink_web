'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

// --- GLOBAL FORM ERROR (For Backend / API Errors) ---
interface FormErrorProps {
  error?: string | string[] | null;
  className?: string;
  id?: string;
}

export function FormError({ error, className = '', id }: FormErrorProps) {
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

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
        {errors.map((err, index) => (
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