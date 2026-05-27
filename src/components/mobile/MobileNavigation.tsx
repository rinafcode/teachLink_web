'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, BookOpen, User } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const railNavClasses = [
  '[@media_(min-width:640px)_and_(orientation:landscape)]:top-0',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:bottom-0',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:left-0',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:right-auto',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:h-dvh',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:w-20',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:border-t-0',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:border-r',
].join(' ');
const railListClasses = [
  '[@media_(min-width:640px)_and_(orientation:landscape)]:h-full',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:flex-col',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:justify-start',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:space-y-6',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:px-0',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:pt-8',
].join(' ');
const railListItemClasses = [
  '[@media_(min-width:640px)_and_(orientation:landscape)]:flex-none',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:px-2',
].join(' ');
const railButtonClasses = [
  '[@media_(min-width:640px)_and_(orientation:landscape)]:mx-auto',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:h-14',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:w-14',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:max-w-none',
  '[@media_(min-width:640px)_and_(orientation:landscape)]:py-0',
].join(' ');
const railHiddenClass = '[@media_(min-width:640px)_and_(orientation:landscape)]:hidden';
const railBlockClass = '[@media_(min-width:640px)_and_(orientation:landscape)]:block';

export const MobileNavigation: React.FC<{
  initialActive?: string;
  onNavChange?: (id: string) => void;
}> = ({ initialActive = 'home', onNavChange }) => {
  const [activeTab, setActiveTab] = useState(initialActive);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: <Home size={24} /> },
    { id: 'search', label: 'Search', icon: <Search size={24} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={24} /> },
    { id: 'profile', label: 'Profile', icon: <User size={24} /> },
  ];

  // Sync state with prop
  useEffect(() => {
    setActiveTab(initialActive);
  }, [initialActive]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onNavChange) onNavChange(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = -1;
    const length = navItems.length;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + length) % length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <nav
      className={`fixed z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-gray-200 dark:border-gray-800 transition-all duration-300 lg:hidden
        bottom-0 left-0 right-0 border-t min-h-16 w-full
        ${railNavClasses}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <ul
        className={`flex min-h-16 w-full items-center justify-around px-2
          ${railListClasses}`}
        role="tablist"
        aria-label="Navigation Tabs"
      >
        {navItems.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              className={`flex w-full flex-1 justify-center ${railListItemClasses}`}
              role="presentation"
            >
              <button
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                id={`tab-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`relative flex w-full max-w-[72px] flex-col items-center justify-center rounded-xl py-1.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-950 ${railButtonClasses}
                  ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/20 font-semibold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50/80 dark:hover:bg-gray-900/50'
                  }
                `}
                aria-label={item.label}
              >
                <div
                  className={`transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'scale-100 hover:scale-105'
                  }`}
                >
                  {item.icon}
                </div>
                <span className={`mt-0.5 text-[10px] font-medium ${railHiddenClass}`}>
                  {item.label}
                </span>

                {/* Active Indicator Dot (Portrait) */}
                <div
                  className={`absolute bottom-1 h-1 w-1 rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400 ${railHiddenClass} ${
                    isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                />

                {/* Active Indicator Bar (Landscape/Tablet) */}
                <div
                  className={`absolute left-0 top-1/2 hidden h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 transition-all duration-300 dark:bg-blue-400 ${railBlockClass} ${
                    isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
