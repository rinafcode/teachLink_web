import React from 'react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * Touch-optimized button providing a minimum 44x44px target area (WCAG AA)
 * and native-feeling active state scaling.
 */
export function TouchButton({ children, className = '', variant = 'primary', ...props }: TouchButtonProps) {
  const baseClasses = "min-h-[44px] min-w-[44px] px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform touch-manipulation select-none flex items-center justify-center disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-blue-600 text-white active:bg-blue-700",
    secondary: "bg-gray-100 text-gray-900 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
    danger: "bg-red-50 text-red-600 active:bg-red-100 dark:bg-red-900/20 dark:text-red-400",
    ghost: "bg-transparent text-gray-700 active:bg-gray-100 dark:text-gray-300 dark:active:bg-gray-800",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface TouchCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Touch-friendly card component that responds with visual feedback 
 * when tapped on low-end and high-end mobile devices equally well.
 */
export function TouchCard({ children, className = '', onClick, ...props }: TouchCardProps) {
  const interactiveClasses = onClick 
    ? "active:scale-[0.98] active:shadow-inner cursor-pointer" 
    : "";

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white dark:bg-gray-900 shadow-sm transition-all touch-manipulation border border-gray-100 dark:border-gray-800 ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}