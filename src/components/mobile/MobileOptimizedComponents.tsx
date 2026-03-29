import React, { ButtonHTMLAttributes, ReactNode, useState } from 'react';
import { GestureHandler } from './GestureHandler';

// Touch-Optimized Button with larger hit area and tap feedback
interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false);

  const baseClasses =
    'relative overflow-hidden rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center';
  const sizeClasses = 'min-h-[48px] px-6 py-3 text-base'; // Minimum 48px height for touch targets
  const widthClasses = fullWidth ? 'w-full' : '';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary:
      'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600',
    outline:
      'border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-transparent active:bg-blue-50 dark:active:bg-gray-800',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${widthClasses} ${variantClasses[variant]} ${
        isTouched ? 'opacity-80' : 'opacity-100'
      } ${className}`}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
      onTouchCancel={() => setIsTouched(false)}
      {...props}
    >
      {children}
    </button>
  );
};

// Swipeable Card Component
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = '',
}) => {
  return (
    <GestureHandler
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      onSwipeUp={onSwipeUp}
      onSwipeDown={onSwipeDown}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-transform active:scale-[0.98] ${className}`}
    >
      {children}
    </GestureHandler>
  );
};

// Bottom Sheet Modal (Mobile Optimized)
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative bg-white dark:bg-gray-900 w-full rounded-t-3xl p-6 shadow-xl animate-in slide-in-from-bottom-full duration-300 pb-safe">
        <GestureHandler onSwipeDown={onClose} swipeThreshold={40}>
          {/* Handle bar for swiping */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 cursor-pointer" />
        </GestureHandler>

        {title && (
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>
        )}

        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
