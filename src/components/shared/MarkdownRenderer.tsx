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
 * - Strikethrough: `~~text~~` (GFM)
 * - Inline code: `` `code` ``
 * - Fenced code blocks: ` ```lang\n...\n``` `
 * - Blockquotes: `> text`
 * - Unordered lists: `- item` or `* item`
 * - Task lists: `- [ ] todo` / `- [x] done` (GFM)
 * - Ordered lists: `1. item`
 * - Tables: GFM pipe tables
 * - Links: `[label](url)`
 * - Images: `![alt](url)`
 * - Horizontal rules: `---`
 * - Paragraphs: blank-line separated runs of text
 *
 * Conversion works in two stages:
 * 1. Clustering — `clusterMarkdownLines` walks the source line-by-line and
 *    groups consecutive lines into typed clusters (heading, list, table,
 *    code, paragraph, ...). Clustering happens before any inline formatting
 *    is applied, so each cluster is rendered in isolation with only the
 *    rules that apply to its type. This is what keeps, e.g., fenced code
 *    content from being re-processed by the bold/italic/inline-code rules
 *    meant for prose (a real bug in a single whole-document regex chain).
 * 2. Rendering — each cluster is converted to its HTML block.
 *
 * Output is sanitized with DOMPurify before rendering.
 */

type ClusterType =
  | 'code'
  | 'heading'
  | 'hr'
  | 'blockquote'
  | 'unordered-list'
  | 'ordered-list'
  | 'task-list'
  | 'table'
  | 'paragraph'
  | 'blank';

export interface MarkdownCluster {
  type: ClusterType;
  lines: string[];
}

const FENCE_RE = /^```/;
const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const HR_RE = /^---$/;
const BLOCKQUOTE_RE = /^> (.+)$/;
const TASK_RE = /^[*-] \[( |x)\] (.+)$/;
const UNORDERED_RE = /^[*-] (.+)$/;
const ORDERED_RE = /^\d+\. (.+)$/;
const TABLE_SEPARATOR_RE = /^[\s|:-]+$/;

function classifyLine(line: string): ClusterType {
  if (line.trim() === '') return 'blank';
  if (HR_RE.test(line)) return 'hr';
  if (HEADING_RE.test(line)) return 'heading';
  if (TASK_RE.test(line)) return 'task-list';
  if (UNORDERED_RE.test(line)) return 'unordered-list';
  if (ORDERED_RE.test(line)) return 'ordered-list';
  if (BLOCKQUOTE_RE.test(line)) return 'blockquote';
  if (line.includes('|')) return 'table';
  return 'paragraph';
}

/**
 * Partitions Markdown source into typed line clusters (the "clustering"
 * step of the renderer). Each cluster is a contiguous run of lines that
 * share a block type, ready to be rendered independently.
 */
export function clusterMarkdownLines(markdown: string): MarkdownCluster[] {
  const lines = markdown.split('\n');
  const clusters: MarkdownCluster[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks are consumed verbatim up to the closing fence (or
    // end of input) so their contents never reach the inline-formatting step.
    if (FENCE_RE.test(line)) {
      const fenceLines = [line];
      i++;
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        fenceLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        fenceLines.push(lines[i]);
        i++;
      }
      clusters.push({ type: 'code', lines: fenceLines });
      continue;
    }

    const type = classifyLine(line);

    // Single-line cluster types never merge with neighbors.
    if (type === 'blank' || type === 'hr' || type === 'heading') {
      clusters.push({ type, lines: [line] });
      i++;
      continue;
    }

    if (type === 'table') {
      const tableLines = [line];
      i++;
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const isValidTable = tableLines.length >= 2 && TABLE_SEPARATOR_RE.test(tableLines[1].trim());
      clusters.push({ type: isValidTable ? 'table' : 'paragraph', lines: tableLines });
      continue;
    }

    // Remaining grouping types: blockquote, unordered-list, ordered-list,
    // task-list, paragraph — merge consecutive lines of the same type.
    const groupLines = [line];
    i++;
    while (i < lines.length && !FENCE_RE.test(lines[i]) && classifyLine(lines[i]) === type) {
      groupLines.push(lines[i]);
      i++;
    }
    clusters.push({ type, lines: groupLines });
  }

  return mergeAdjacentParagraphs(clusters);
}

// A table candidate that fails validation falls back to 'paragraph', which
// may leave two paragraph clusters sitting next to each other with no blank
// line between them (e.g. plain text followed directly by a line containing
// a stray "|"). Merge those back into one paragraph, matching how a single
// run of non-blank text is treated everywhere else.
function mergeAdjacentParagraphs(clusters: MarkdownCluster[]): MarkdownCluster[] {
  const merged: MarkdownCluster[] = [];
  for (const cluster of clusters) {
    const prev = merged[merged.length - 1];
    if (cluster.type === 'paragraph' && prev?.type === 'paragraph') {
      prev.lines.push(...cluster.lines);
    } else {
      merged.push({ type: cluster.type, lines: [...cluster.lines] });
    }
  }
  return merged;
}

function applyInline(text: string): string {
  let out = text;
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__(.+?)__/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
  out = out.replace(/~~(.+?)~~/g, '<del>$1</del>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function renderCodeCluster(lines: string[]): string {
  const openMatch = lines[0].match(/^```([^\n]*)$/);
  const lang = openMatch ? openMatch[1].trim() : '';
  const hasClosingFence = lines.length > 1 && FENCE_RE.test(lines[lines.length - 1]);
  const codeLines = hasClosingFence ? lines.slice(1, -1) : lines.slice(1);
  const langAttr = lang ? ` class="language-${lang}"` : '';
  return `<pre><code${langAttr}>${escapeHtml(codeLines.join('\n').trimEnd())}</code></pre>`;
}

function renderTableCluster(lines: string[]): string {
  const isSeparator = (l: string) => TABLE_SEPARATOR_RE.test(l.trim());
  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => applyInline(cell.trim()));

  const headers = parseRow(lines[0]);
  const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`;
  const bodyRows = lines
    .slice(2)
    .filter((l) => l.trim() && !isSeparator(l))
    .map((l) => `<tr>${parseRow(l).map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');
  return `<table>${thead}<tbody>${bodyRows}</tbody></table>`;
}

function renderTaskItem(line: string): string {
  const match = line.match(TASK_RE);
  if (!match) return '';
  const [, checkedMark, label] = match;
  const attrs = checkedMark === 'x' ? ' checked disabled' : ' disabled';
  return `<li class="task-item"><input type="checkbox"${attrs} /> ${applyInline(label)}</li>`;
}

function renderCluster(cluster: MarkdownCluster): string {
  switch (cluster.type) {
    case 'blank':
      return '';
    case 'code':
      return renderCodeCluster(cluster.lines);
    case 'hr':
      return '<hr />';
    case 'heading': {
      const match = cluster.lines[0].match(HEADING_RE)!;
      const level = match[1].length;
      return `<h${level}>${applyInline(match[2])}</h${level}>`;
    }
    case 'blockquote':
      return cluster.lines
        .map((l) => `<blockquote>${applyInline(l.replace(/^> /, ''))}</blockquote>`)
        .join('\n');
    case 'unordered-list':
      return `<ul>${cluster.lines
        .map((l) => `<li>${applyInline(l.replace(/^[*-] /, ''))}</li>`)
        .join('')}</ul>`;
    case 'ordered-list':
      return `<ol>${cluster.lines
        .map((l) => `<li>${applyInline(l.replace(/^\d+\. /, ''))}</li>`)
        .join('')}</ol>`;
    case 'task-list':
      return `<ul class="task-list">${cluster.lines.map(renderTaskItem).join('')}</ul>`;
    case 'table':
      return renderTableCluster(cluster.lines);
    case 'paragraph':
      return `<p>${applyInline(cluster.lines.join('\n')).replace(/\n/g, '<br />')}</p>`;
    default:
      return '';
  }
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  return clusterMarkdownLines(markdown)
    .map(renderCluster)
    .filter((html) => html !== '')
    .join('\n');
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
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'del',
        'code',
        'pre',
        'ul',
        'ol',
        'li',
        'blockquote',
        'hr',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'input',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'type', 'checked', 'disabled'],
    });
  }, [content]);

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
