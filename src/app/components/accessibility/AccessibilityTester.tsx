'use client';

import React, { useState } from 'react';
import { useAccessibilityCheck } from '@/hooks/useAccessibility';
import { AccessibilityIssue, getWCAGLevel } from '@/utils/accessibilityUtils';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Download } from 'lucide-react';

interface AccessibilityTesterProps {
  autoCheck?: boolean;
  showWidget?: boolean;
}

export function AccessibilityTester({
  autoCheck = false,
  showWidget = true,
}: AccessibilityTesterProps) {
  const { containerRef, issues, isChecking, checkAccessibility } = useAccessibilityCheck(autoCheck);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredIssues =
    filterSeverity === 'all'
      ? issues
      : issues.filter((issue) => issue.severity === filterSeverity);

  const severityCounts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    serious: issues.filter((i) => i.severity === 'serious').length,
    moderate: issues.filter((i) => i.severity === 'moderate').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  };

  const wcagLevel = getWCAGLevel(issues);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'serious':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'moderate':
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'minor':
        return <Info className="text-blue-600" size={20} />;
      default:
        return <Info className="text-gray-600" size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'serious':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'minor':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getWCAGLevelColor = (level: string) => {
    switch (level) {
      case 'AAA':
        return 'bg-green-100 text-green-800';
      case 'AA':
        return 'bg-blue-100 text-blue-800';
      case 'A':
        return 'bg-yellow-100 text-yellow-800';
      case 'Fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      wcagLevel,
      totalIssues: issues.length,
      severityCounts,
      issues: issues.map((issue) => ({
        severity: issue.severity,
        type: issue.type,
        element: issue.element,
        message: issue.message,
        wcagCriteria: issue.wcagCriteria,
        suggestion: issue.suggestion,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!showWidget) {
    return <div ref={containerRef as any} />;
  }

  return (
    <>
      <div ref={containerRef as any} />

      {/* Accessibility Tester Widget Button */}
      <button
        onClick={() => setIsWidgetOpen(!isWidgetOpen)}
        aria-label="Open accessibility tester"
        aria-expanded={isWidgetOpen}
        className="fixed bottom-36 right-4 z-[9998] p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
      >
        <AlertCircle size={24} />
        {issues.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {issues.length}
          </span>
        )}
        <span className="sr-only">Accessibility Tester</span>
      </button>

      {/* Accessibility Tester Panel */}
      {isWidgetOpen && (
        <div
          role="dialog"
          aria-label="Accessibility tester"
          className="fixed bottom-52 right-4 z-[9998] w-[28rem] max-h-[36rem] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Accessibility Tester</h2>
              <button
                onClick={() => setIsWidgetOpen(false)}
                aria-label="Close accessibility tester"
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* WCAG Level Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">WCAG Compliance:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getWCAGLevelColor(
                  wcagLevel
                )}`}
              >
                {wcagLevel}
              </span>
            </div>

            <button
              onClick={checkAccessibility}
              disabled={isChecking}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              {isChecking ? 'Checking...' : 'Run Accessibility Check'}
            </button>

            {issues.length > 0 && (
              <button
                onClick={exportReport}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export Report
              </button>
            )}
          </div>

          {/* Summary */}
          {issues.length > 0 && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">{severityCounts.critical}</div>
                  <div className="text-xs text-gray-600">Critical</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {severityCounts.serious}
                  </div>
                  <div className="text-xs text-gray-600">Serious</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {severityCounts.moderate}
                  </div>
                  <div className="text-xs text-gray-600">Moderate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{severityCounts.minor}</div>
                  <div className="text-xs text-gray-600">Minor</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter */}
          {issues.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <label htmlFor="severity-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Severity:
              </label>
              <select
                id="severity-filter"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Issues ({issues.length})</option>
                <option value="critical">Critical ({severityCounts.critical})</option>
                <option value="serious">Serious ({severityCounts.serious})</option>
                <option value="moderate">Moderate ({severityCounts.moderate})</option>
                <option value="minor">Minor ({severityCounts.minor})</option>
              </select>
            </div>
          )}

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-4">
            {issues.length === 0 && !isChecking && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-green-600" size={48} />
                <p className="font-medium">No issues found!</p>
                <p className="text-sm mt-1">Page passes basic accessibility checks.</p>
              </div>
            )}

            {isChecking && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
                <p className="mt-2 text-gray-600">Checking accessibility...</p>
              </div>
            )}

            {filteredIssues.length > 0 && (
              <div className="space-y-3">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 border rounded-lg ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{issue.message}</div>
                        <div className="text-xs mt-1 opacity-75">
                          Element: <code className="bg-white bg-opacity-50 px-1 rounded">{issue.element}</code>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 mt-2 pt-2 border-t border-current border-opacity-20">
                      <div>
                        <span className="font-medium">WCAG:</span>{' '}
                        {issue.wcagCriteria.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Suggestion:</span> {issue.suggestion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredIssues.length === 0 && issues.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <Info className="mx-auto mb-2" size={48} />
                <p>No {filterSeverity} issues found.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <p>
              This tool performs automated checks for common accessibility issues. Manual testing
              with assistive technologies is still recommended.
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
