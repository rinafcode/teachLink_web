'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
}

interface AdaptiveNavigationProps {
  links: NavLink[];
  brandName?: string;
}

export function AdaptiveNavigation({ links, brandName = 'TeachLink' }: AdaptiveNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <nav className="relative flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-40">
      <div className="text-xl font-bold text-blue-600 dark:text-blue-400 select-none">
        {brandName}
      </div>

      {/* Desktop Inline Navigation */}
      <div className="hidden md:flex space-x-6 items-center">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 min-h-[44px] flex items-center font-medium transition-colors">
            {link.label}
          </a>
        ))}
      </div>

      {/* Mobile Drawer Toggle */}
      <button
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-700 dark:text-gray-200 active:scale-95 transition-transform touch-manipulation"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile Navigation Drawer */}
      <div className={`absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-xl md:hidden flex flex-col p-4 space-y-3 transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
        {links.map((link) => (
          <a key={link.href} href={link.href} className="p-4 text-lg font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 active:scale-[0.98] transition-all touch-manipulation" onClick={() => setIsOpen(false)}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}