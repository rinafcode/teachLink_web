'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, BookOpen, User, Camera } from 'lucide-react';
import { MobileNavigationScanner } from './MobileNavigationScanner';

interface NavItem {
  id: string;
  label: string;
  icon: (size: number) => React.ReactNode;
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
  const [isFloating, setIsFloating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  const openScanner = () => setIsScannerOpen(true);
  const closeScanner = () => setIsScannerOpen(false);

  useEffect(() => {
    const handleResize = () => {
      setIsFloating(window.innerWidth >= 640);
      setIsLandscape(window.innerHeight < 500);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;

    navRef.current.setAttribute(
      'style',
      'padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);',
    );
  }, []);

  const iconSize = isLandscape ? 18 : 22;

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: (size) => <Home size={size} /> },
    { id: 'search', label: 'Search', icon: (size) => <Search size={size} /> },
    { id: 'courses', label: 'Courses', icon: (size) => <BookOpen size={size} /> },
    { id: 'profile', label: 'Profile', icon: (size) => <User size={size} /> },
  ];

  // Sync state with prop
  useEffect(() => {
    setActiveTab(initialActive);
  }, [initialActive]);

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
      ref={navRef}
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden lg:hidden min-h-16 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
        sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[90%] sm:max-w-md sm:rounded-2xl sm:border sm:shadow-xl sm:pb-0 px-4 ${railNavClasses}`}
      aria-label="Mobile Navigation"
      role="navigation"
    >
      <ul
        role="tablist"
        aria-label="Navigation Tabs"
        onKeyDown={handleKeyDown}
        className={`flex justify-around items-center h-16 landscape:h-12 px-2 ${railListClasses}`}
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
      <div className="mt-2 flex justify-center sm:mt-0">
        <button
          type="button"
          onClick={openScanner}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          aria-label="Open mobile scanner"
        >
          <Camera size={18} className="mr-2" aria-hidden="true" />
          Scan
        </button>
      </div>
      <MobileNavigationScanner isOpen={isScannerOpen} onClose={closeScanner} />
    </nav>
  );
};
