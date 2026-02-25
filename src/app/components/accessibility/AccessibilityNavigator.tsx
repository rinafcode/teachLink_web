'use client';

import React, { useEffect, useState } from 'react';
import { useKeyboardNavigation, useSkipNavigation } from '@/hooks/useAccessibility';
import { ChevronDown, Menu, X } from 'lucide-react';

interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

interface AccessibilityNavigatorProps {
  skipLinks?: SkipLink[];
  showLandmarks?: boolean;
}

export function AccessibilityNavigator({
  skipLinks = [
    { id: 'skip-main', label: 'Skip to main content', targetId: 'main-content' },
    { id: 'skip-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
    { id: 'skip-footer', label: 'Skip to footer', targetId: 'footer' },
  ],
  showLandmarks = true,
}: AccessibilityNavigatorProps) {
  const containerRef = useKeyboardNavigation(true);
  const skipToContent = useSkipNavigation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [landmarks, setLandmarks] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (showLandmarks) {
      // Find all landmark elements
      const landmarkSelectors = [
        '[role="banner"]',
        '[role="navigation"]',
        '[role="main"]',
        '[role="complementary"]',
        '[role="contentinfo"]',
        'header',
        'nav',
        'main',
        'aside',
        'footer',
      ];

      const foundLandmarks = landmarkSelectors
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .filter((el, index, self) => self.indexOf(el) === index) as HTMLElement[];

      setLandmarks(foundLandmarks);
    }
  }, [showLandmarks]);

  const handleSkipClick = (targetId: string) => {
    skipToContent(targetId);
    setIsMenuOpen(false);
  };

  const handleLandmarkClick = (landmark: HTMLElement) => {
    landmark.focus();
    landmark.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Skip Links - Always visible on focus */}
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-[9999] focus-within:bg-white focus-within:p-4 focus-within:shadow-lg">
        <nav aria-label="Skip navigation links" ref={containerRef as any}>
          <ul className="flex flex-col gap-2">
            {skipLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.targetId}`}
                  data-skip-link
                  onClick={(e) => {
                    e.preventDefault();
                    handleSkipClick(link.targetId);
                  }}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Keyboard Navigation Helper */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Open accessibility navigation menu"
        aria-expanded={isMenuOpen}
        aria-controls="accessibility-menu"
        className="fixed bottom-4 right-4 z-[9998] p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        <span className="sr-only">
          {isMenuOpen ? 'Close' : 'Open'} accessibility navigation
        </span>
      </button>

      {/* Accessibility Menu */}
      {isMenuOpen && (
        <div
          id="accessibility-menu"
          role="dialog"
          aria-label="Accessibility navigation menu"
          className="fixed bottom-20 right-4 z-[9998] w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200"
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Navigation Helper</h2>

            {/* Quick Skip Links */}
            <section className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Skip</h3>
              <ul className="space-y-1">
                {skipLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => handleSkipClick(link.targetId)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Landmarks */}
            {showLandmarks && landmarks.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Page Landmarks ({landmarks.length})
                </h3>
                <ul className="space-y-1">
                  {landmarks.map((landmark, index) => {
                    const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
                    const label =
                      landmark.getAttribute('aria-label') ||
                      landmark.getAttribute('aria-labelledby') ||
                      role;

                    return (
                      <li key={`${role}-${index}`}>
                        <button
                          onClick={() => handleLandmarkClick(landmark)}
                          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                        >
                          <span className="truncate">{label}</span>
                          <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Keyboard Shortcuts Info */}
            <section className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Keyboard Shortcuts</h3>
              <dl className="text-xs space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <dt>Tab</dt>
                  <dd>Next element</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shift + Tab</dt>
                  <dd>Previous element</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Enter / Space</dt>
                  <dd>Activate element</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Escape</dt>
                  <dd>Close dialog</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[9997] bg-black bg-opacity-25"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
