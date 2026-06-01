'use client';

import React, { useState, useRef } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface CodeBlockProps {
  code: string;
  language?: string;
  /** Max visible lines before collapse toggle appears. Default: 15 */
  collapseThreshold?: number;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'javascript',
  collapseThreshold = 15,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lineCount = code.split('\n').length;
  const isCollapsible = lineCount > collapseThreshold;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950 shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <SyntaxHighlighter language={language} size="sm" />

        {/* Copy button */}
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied!' : 'Copy code'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                     text-gray-400 hover:text-white hover:bg-gray-700
                     transition-colors duration-150 focus:outline-none focus-visible:ring-2
                     focus-visible:ring-indigo-500"
        >
          {/* Icon transitions */}
          <span
            className={`transition-all duration-200 ${
              copied ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
            } absolute`}
          >
            <Copy className="w-3.5 h-3.5" />
          </span>
          <span
            className={`transition-all duration-200 ${
              copied ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            } absolute`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          {/* Spacer to keep button width stable */}
          <span className="w-3.5 h-3.5 inline-block" aria-hidden />
          <span
            className={`transition-colors duration-200 ${copied ? 'text-emerald-400' : ''}`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>

      {/* Code area with expand/collapse */}
      <div
        className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{
          maxHeight:
            isCollapsible && !expanded
              ? `${collapseThreshold * 1.625}rem`
              : '9999px',
          WebkitMaskImage:
            isCollapsible && !expanded
              ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
              : undefined,
          maskImage:
            isCollapsible && !expanded
              ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
              : undefined,
        }}
      >
        <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed text-gray-100 m-0">
          <code>{code}</code>
        </pre>
      </div>

      {/* Expand / Collapse toggle */}
      {isCollapsible && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium
                     text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800
                     border-t border-gray-700 transition-colors duration-150
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 transition-transform duration-300" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300" />
              Show {lineCount - collapseThreshold} more line{lineCount - collapseThreshold !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  );
};
