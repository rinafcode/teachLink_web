'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useHelpDocumentation } from '@/hooks/useHelpDocumentation';
import type { HelpArticle } from '@/hooks/useHelpDocumentation';

export interface HelpDocumentationProps {
  /** Article ids to load on mount */
  articleIds?: string[];
  /** Optional heading shown above the article list */
  title?: string;
  className?: string;
}

function ArticleItem({ article }: { article: HelpArticle }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg dark:border-gray-700">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-100 dark:hover:bg-gray-800"
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={16} aria-hidden="true" className="shrink-0 text-blue-500" />
          {article.title}
        </span>
        {open ? (
          <ChevronUp size={16} aria-hidden="true" className="shrink-0 text-gray-400" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">{article.content}</p>
          {article.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Tags">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * HelpDocumentation
 *
 * Renders a list of collapsible help articles. Uses `useHelpDocumentation`
 * which batches concurrent article requests into a single API call.
 */
export function HelpDocumentation({
  articleIds = ['getting-started', 'wallet-connect', 'tipping', 'courses', 'reputation'],
  title = 'Help & Documentation',
  className = '',
}: HelpDocumentationProps) {
  const { articles, loading, error, fetchArticles } = useHelpDocumentation(articleIds);

  return (
    <section
      aria-label={title}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-50">
        <HelpCircle size={18} aria-hidden="true" className="text-blue-500" />
        {title}
      </h2>

      {loading && (
        <div role="status" aria-live="polite" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
          <span className="sr-only">Loading help articles…</span>
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => fetchArticles(articleIds)}
            className="ml-auto underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No help articles found.</p>
      )}

      {!loading && articles.length > 0 && (
        <ul className="space-y-2" aria-label="Help articles">
          {articles.map((article) => (
            <li key={article.id}>
              <ArticleItem article={article} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
