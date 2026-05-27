'use client';

import React, { useState, useEffect } from 'react';
import { Home, Search, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  icon: (size: number) => React.ReactNode;
}

export const MobileNavigation: React.FC<{
  initialActive?: string;
  onNavChange?: (id: string) => void;
}> = ({ initialActive = 'home', onNavChange }) => {
  const [activeTab, setActiveTab] = useState(initialActive);
  const [isFloating, setIsFloating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsFloating(window.innerWidth >= 640);
      setIsLandscape(window.innerHeight < 500);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const iconSize = isLandscape ? 18 : 22;

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: (size) => <Home size={size} /> },
    { id: 'search', label: 'Search', icon: (size) => <Search size={size} /> },
    { id: 'courses', label: 'Courses', icon: (size) => <BookOpen size={size} /> },
    { id: 'profile', label: 'Profile', icon: (size) => <User size={size} /> },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onNavChange) onNavChange(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const currentIndex = navItems.findIndex((item) => item.id === activeTab);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % navItems.length;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + navItems.length) % navItems.length;
        e.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        nextIndex = navItems.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    const nextItemId = navItems[nextIndex].id;
    handleTabClick(nextItemId);

    // Focus the new button
    setTimeout(() => {
      const button = document.getElementById(`nav-btn-${nextItemId}`);
      if (button) {
        button.focus();
      }
    }, 0);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
        sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[90%] sm:max-w-md sm:rounded-2xl sm:border sm:shadow-xl sm:pb-0 px-4`}
      style={!isFloating ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
      aria-label="Mobile Navigation"
      role="navigation"
    >
      <ul
        role="tablist"
        aria-label="Navigation Tabs"
        onKeyDown={handleKeyDown}
        className="flex justify-around items-center h-16 landscape:h-12 px-2"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} role="presentation" className="flex-1 relative flex justify-center">
              <button
                id={`nav-btn-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(item.id)}
                className={`relative w-full max-w-[80px] flex flex-col landscape:flex-row items-center justify-center py-2 landscape:py-1 space-y-1 landscape:space-y-0 landscape:space-x-2 rounded-xl transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-500 min-h-[44px] min-w-[44px] select-none touch-manipulation z-10
                  ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
                aria-label={item.label}
              >
                <div
                  className={`${
                    isActive ? 'scale-110' : 'scale-100'
                  } transition-transform duration-200 flex items-center justify-center`}
                >
                  {item.icon(iconSize)}
                </div>
                <span className="text-[10px] landscape:text-xs font-medium leading-none">
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-950/40 rounded-xl -z-10 border border-blue-100/50 dark:border-blue-900/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
