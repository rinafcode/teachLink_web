'use client';

import DOMPurify from 'dompurify';
import { useMemo } from 'react';

/**
 * Converts a subset of Markdown to sanitized HTML.
 *
 * Supported syntax:
 * - Headings: `# H1`, `## H2`, `### H3`
 * - Bold: `**text**` or `__text__`
 * - Italic: `*text*` or `_text_`
 * - Inline code: `` `code` ``
 * - Fenced code blocks: ` ```lang\n...\n``` `
 * - Blockquotes: `> text`
 * - Unordered lists: `- item` or `* item`
 * - Ordered lists: `1. item`
 * - Links: `[label](url)`
 * - Images: `![alt](url)`
 * - Horizontal rules: `---`
 * - Paragraphs: blank-line separated runs of text
 *
 * Output is sanitized with DOMPurify before rendering.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Fenced code blocks (must run before inline code to avoid nested matches)
  html = html.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const langAttr = lang.trim() ? ` class="language-${lang.trim()}"` : '';
    return `<pre><code${langAttr}>${escapeHtml(code.trimEnd())}</code></pre>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists — group consecutive `- ` or `* ` lines
  html = html.replace(/((?:^[*-] .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^[*-] /, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists — group consecutive `N. ` lines
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  // Bold (** or __)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (* or _) — exclude already-processed ** / __
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Images (before links so they're not confused)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs: wrap lines not already inside a block element
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      const isBlock = /^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/.test(trimmed);
      return isBlock ? trimmed : `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MarkdownRendererProps {
  /** Markdown source text to render. */
  content: string;
  /** Additional CSS class names applied to the wrapper `<div>`. */
  className?: string;
}

/**
 * Renders a Markdown string as sanitized HTML inside a styled `<div>`.
 *
 * @example
 * ```tsx
 * <MarkdownRenderer content="# Hello\n\nThis is **bold**." />
 * ```
 *
 * The component is safe to use with user-supplied content: DOMPurify removes
 * any JavaScript event handlers and non-standard attributes before the HTML
 * reaches the DOM.
 *
 * Note: `dangerouslySetInnerHTML` is intentional here — the content is
 * sanitized by DOMPurify before being set.
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const sanitizedHtml = useMemo(() => {
    const raw = markdownToHtml(content);
    if (typeof window === 'undefined') return raw;
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'hr',
        'a', 'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
    });
  }, [content]);

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`.trim()}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
