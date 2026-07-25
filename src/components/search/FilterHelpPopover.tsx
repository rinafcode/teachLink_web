'use client';

import { useEffect, useRef } from 'react';
import { HelpCircle, X, Lightbulb, MessageCircle } from 'lucide-react';
import type { FilterHelpContent } from '@/hooks/useFilterCustomerSupport';

interface FilterHelpPopoverProps {
  content: FilterHelpContent;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function FilterHelpPopover({ content, isOpen, onToggle, onClose }: FilterHelpPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-label={`Help: ${content.title}`}
        aria-expanded={isOpen}
        aria-controls={`help-popover-${content.id}`}
        className="ml-1.5 inline-flex items-center justify-center rounded-full p-0.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <HelpCircle size={14} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={`help-popover-${content.id}`}
          role="dialog"
          aria-label={`${content.title} help`}
          className="absolute left-0 top-6 z-30 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {content.title}
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close help"
              className="rounded p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
            {content.description}
          </p>

          {content.tips.length > 0 && (
            <div className="mb-3">
              <h5 className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Lightbulb size={12} aria-hidden="true" />
                Tips
              </h5>
              <ul className="space-y-1">
                {content.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-500 dark:text-slate-400 pl-4 -indent-3">
                    <span className="mr-1 text-blue-400">{'>'}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.faqs.length > 0 && (
            <div>
              <h5 className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <MessageCircle size={12} aria-hidden="true" />
                FAQ
              </h5>
              <div className="space-y-2">
                {content.faqs.slice(0, 2).map((faq, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Q: {faq.question}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      A: {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
