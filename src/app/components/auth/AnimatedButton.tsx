'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AnimatedButton = ({
  isLoading = false,
  children,
  variant = 'primary',
  disabled,
  ...props
}: AnimatedButtonProps) => {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white',
    outline:
      'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      disabled={disabled || isLoading}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]}`}
      {...props}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-2"
        >
          <Loader2 size={20} />
          <span>Loading...</span>
        </motion.div>
      ) : (
        children
      )}
    </motion.button>
  );
};
