'use client';

import { useState } from 'react';
import { HelpCircle, Lightbulb, MessageCircle, BookOpen, Mail, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { FilterHelpContent } from '@/hooks/useFilterCustomerSupport';

interface FilterSupportGuideProps {
  isOpen: boolean;
  onClose: () => void;
  helpContent: Record<string, FilterHelpContent>;
}

type GuideTab = 'guide' | 'faq' | 'contact';

export function FilterSupportGuide({ isOpen, onClose, helpContent }: FilterSupportGuideProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('guide');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = Object.values(helpContent);

  const allFaqs = sections.flatMap((s) => s.faqs.map((faq) => ({ ...faq, section: s.title })));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter Controls Help" className="max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'guide' as const, label: 'Guide', icon: BookOpen },
          { id: 'faq' as const, label: 'FAQ', icon: MessageCircle },
          { id: 'contact' as const, label: 'Contact Support', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Guide Tab */}
      {activeTab === 'guide' && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedSection(expandedSection === section.id ? null : section.id)
                }
                aria-expanded={expandedSection === section.id}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-blue-500 shrink-0" aria-hidden="true" />
                  {section.title}
                </span>
                <span
                  className={`text-slate-400 transition-transform ${
                    expandedSection === section.id ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedSection === section.id && (
                <div className="px-4 pb-3 pt-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {section.description}
                  </p>
                  {section.tips.length > 0 && (
                    <div className="mb-2">
                      <h5 className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Lightbulb size={12} aria-hidden="true" />
                        Tips
                      </h5>
                      <ul className="space-y-1">
                        {section.tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-500 dark:text-slate-400 pl-4 -indent-3"
                          >
                            <span className="mr-1 text-blue-400">{'>'}</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="max-h-96 overflow-y-auto pr-1">
          {allFaqs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No FAQs available at this time.
            </p>
          ) : (
            <div className="space-y-4">
              {allFaqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 dark:border-slate-700 p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                      {faq.section}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                    Q: {faq.question}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Support Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              <Mail size={14} aria-hidden="true" />
              Still need help?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              If you couldn&apos;t find what you need in the guide or FAQ, our support team is here
              to help.
            </p>
            <a
              href="mailto:support@teachlink.app"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <Mail size={14} aria-hidden="true" />
              Contact Support
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              <BookOpen size={14} aria-hidden="true" />
              Feedback
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Help us improve! Send your feedback about the filter controls to{' '}
              <a
                href="mailto:feedback@teachlink.app"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                feedback@teachlink.app
              </a>
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
