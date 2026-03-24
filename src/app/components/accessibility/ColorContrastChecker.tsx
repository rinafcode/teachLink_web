'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { calculateContrastRatio, getComputedColor, ColorContrastResult } from '@/utils/accessibilityUtils';
import { Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ColorPair {
  foreground: string;
  background: string;
  element?: string;
  location?: string;
}

interface ColorContrastCheckerProps {
  autoCheck?: boolean;
  showWidget?: boolean;
}

export function ColorContrastChecker({
  autoCheck = false,
  showWidget = true,
}: ColorContrastCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [colorPairs, setColorPairs] = useState<(ColorPair & { result: ColorContrastResult })[]>([]);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const checkPageContrast = useCallback(() => {
    setIsChecking(true);

    // Find all text elements
    const textElements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th'
    );

    const pairs: (ColorPair & { result: ColorContrastResult })[] = [];
    const checkedPairs = new Set<string>();

    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      // Skip hidden elements
      if (htmlElement.offsetParent === null) return;

      const foreground = getComputedColor(htmlElement, 'color');
      const background = getComputedColor(htmlElement, 'background-color');

      // Create unique key for this color pair
      const pairKey = `${foreground}-${background}`;

      // Skip if already checked
      if (checkedPairs.has(pairKey)) return;
      checkedPairs.add(pairKey);

      const result = calculateContrastRatio(foreground, background);

      // Only include pairs that don't meet AA standards
      if (!result.passes.aa) {
        pairs.push({
          foreground,
          background,
          element: htmlElement.tagName.toLowerCase(),
          location: htmlElement.textContent?.substring(0, 50) || 'Unknown',
          result,
        });
      }
    });

    setColorPairs(pairs);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (autoCheck) {
      const timer = setTimeout(checkPageContrast, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkPageContrast]);

  const getStatusIcon = (result: ColorContrastResult) => {
    if (result.passes.aa) {
      return <CheckCircle className="text-green-600" size={20} />;
    } else if (result.passes.aaLarge) {
      return <AlertTriangle className="text-yellow-600" size={20} />;
    } else {
      return <XCircle className="text-red-600" size={20} />;
    }
  };

  const getStatusText = (result: ColorContrastResult) => {
    if (result.passes.aaa) return 'AAA';
    if (result.passes.aa) return 'AA';
    if (result.passes.aaLarge) return 'AA Large';
    return 'Fail';
  };

  if (!showWidget) return null;

  return (
    <>
      {/* Contrast Checker Widget Button */}
      <button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        aria-label="Open color contrast checker"
        aria-expanded={isWidgetOpen}
        className="fixed bottom-20 right-4 z-[9998] p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
      >
        <Eye size={24} />
        <span className="sr-only">Color Contrast Checker</span>
      </button>

      {/* Contrast Checker Panel */}
      {isWidgetOpen && (
        <div
          role="dialog"
          aria-label="Color contrast checker"
          className="fixed bottom-36 right-4 z-[9998] w-96 max-h-[32rem] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Color Contrast Checker</h2>
              <button
                onClick={() => setIsWidgetOpen(false)}
                aria-label="Close contrast checker"
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <button
              onClick={checkPageContrast}
              disabled={isChecking}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Checking...' : 'Check Page Contrast'}
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {colorPairs.length === 0 && !isChecking && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-green-600" size={48} />
                <p>No contrast issues found!</p>
                <p className="text-sm mt-1">All text meets WCAG AA standards.</p>
              </div>
            )}

            {isChecking && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                <p className="mt-2 text-gray-600">Checking contrast...</p>
              </div>
            )}

            {colorPairs.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Found {colorPairs.length} contrast issue{colorPairs.length !== 1 ? 's' : ''}
                </div>

                {colorPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg space-y-2"
                  >
                    {/* Color Swatches */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded border border-gray-300"
                        style={{ backgroundColor: pair.background }}
                        aria-label={`Background color: ${pair.background}`}
                      />
                      <div
                        className="w-12 h-12 rounded border border-gray-300 flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: pair.background,
                          color: pair.foreground,
                        }}
                        aria-label={`Text color: ${pair.foreground}`}
                      >
                        Aa
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(pair.result)}
                          <span className="font-medium">{getStatusText(pair.result)}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Ratio: {pair.result.ratio}:1
                        </div>
                      </div>
                    </div>

                    {/* Element Info */}
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="font-medium">Element:</span>{' '}
                        <code className="bg-gray-100 px-1 rounded">{pair.element}</code>
                      </div>
                      <div>
                        <span className="font-medium">Text:</span>{' '}
                        <span className="text-gray-600 truncate block">
                          {pair.location}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Colors:</span>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">FG:</span>
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {pair.foreground}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">BG:</span>
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {pair.background}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WCAG Compliance */}
                    <div className="text-xs pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          {pair.result.passes.aa ? (
                            <CheckCircle size={12} className="text-green-600" />
                          ) : (
                            <XCircle size={12} className="text-red-600" />
                          )}
                          <span>AA (4.5:1)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {pair.result.passes.aaa ? (
                            <CheckCircle size={12} className="text-green-600" />
                          ) : (
                            <XCircle size={12} className="text-gray-400" />
                          )}
                          <span>AAA (7:1)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {pair.result.passes.aaLarge ? (
                            <CheckCircle size={12} className="text-green-600" />
                          ) : (
                            <XCircle size={12} className="text-red-600" />
                          )}
                          <span>AA Large (3:1)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {pair.result.passes.aaaLarge ? (
                            <CheckCircle size={12} className="text-green-600" />
                          ) : (
                            <XCircle size={12} className="text-gray-400" />
                          )}
                          <span>AAA Large (4.5:1)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <p>
              WCAG 2.1 requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for
              large text (18pt+ or 14pt+ bold).
            </p>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isWidgetOpen && (
        <div
          className="fixed inset-0 z-[9997] bg-black bg-opacity-25"
          onClick={() => setIsWidgetOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
