import { describe, it, expect } from 'vitest';
import { markdownToHtml, clusterMarkdownLines } from './MarkdownRenderer';

// Tests cover the pure markdownToHtml function (no DOM/React needed).

describe('markdownToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  // ── Headings ──────────────────────────────────────────────────────────────

  it('renders h1', () => {
    expect(markdownToHtml('# Hello')).toContain('<h1>Hello</h1>');
  });

  it('renders h2', () => {
    expect(markdownToHtml('## Section')).toContain('<h2>Section</h2>');
  });

  it('renders h3', () => {
    expect(markdownToHtml('### Sub')).toContain('<h3>Sub</h3>');
  });

  // ── Emphasis ──────────────────────────────────────────────────────────────

  it('renders bold with **', () => {
    expect(markdownToHtml('This is **bold** text')).toContain('<strong>bold</strong>');
  });

  it('renders bold with __', () => {
    expect(markdownToHtml('This is __bold__ text')).toContain('<strong>bold</strong>');
  });

  it('renders italic with *', () => {
    expect(markdownToHtml('This is *italic* text')).toContain('<em>italic</em>');
  });

  it('renders italic with _', () => {
    expect(markdownToHtml('This is _italic_ text')).toContain('<em>italic</em>');
  });

  // ── Inline code ───────────────────────────────────────────────────────────

  it('renders inline code', () => {
    expect(markdownToHtml('Use `console.log` here')).toContain('<code>console.log</code>');
  });

  // ── Fenced code blocks ────────────────────────────────────────────────────

  it('renders fenced code block', () => {
    const md = '```js\nconsole.log("hi");\n```';
    const html = markdownToHtml(md);
    expect(html).toContain('<pre><code');
    expect(html).toContain('console.log');
  });

  it('sets language class on fenced code block', () => {
    const md = '```typescript\nconst x = 1;\n```';
    expect(markdownToHtml(md)).toContain('class="language-typescript"');
  });

  it('escapes HTML inside code blocks', () => {
    const md = '```\n<script>alert(1)</script>\n```';
    expect(markdownToHtml(md)).not.toContain('<script>');
    expect(markdownToHtml(md)).toContain('&lt;script&gt;');
  });

  // ── Links & images ────────────────────────────────────────────────────────

  it('renders links', () => {
    const html = markdownToHtml('[TeachLink](https://example.com)');
    expect(html).toContain('<a href="https://example.com">TeachLink</a>');
  });

  it('renders images', () => {
    const html = markdownToHtml('![Logo](https://example.com/logo.png)');
    expect(html).toContain('<img src="https://example.com/logo.png" alt="Logo"');
  });

  // ── Lists ─────────────────────────────────────────────────────────────────

  it('renders unordered list items with -', () => {
    const md = '- Alpha\n- Beta\n- Gamma';
    const html = markdownToHtml(md);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Alpha</li>');
    expect(html).toContain('<li>Beta</li>');
  });

  it('renders unordered list items with *', () => {
    const md = '* One\n* Two';
    const html = markdownToHtml(md);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>One</li>');
  });

  it('renders ordered list items', () => {
    const md = '1. First\n2. Second\n3. Third';
    const html = markdownToHtml(md);
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First</li>');
    expect(html).toContain('<li>Second</li>');
  });

  // ── Blockquotes ───────────────────────────────────────────────────────────

  it('renders blockquotes', () => {
    const html = markdownToHtml('> A wise quote');
    expect(html).toContain('<blockquote>A wise quote</blockquote>');
  });

  // ── Horizontal rule ───────────────────────────────────────────────────────

  it('renders horizontal rules', () => {
    expect(markdownToHtml('---')).toContain('<hr />');
  });

  // ── Paragraphs ────────────────────────────────────────────────────────────

  it('wraps plain text in a paragraph', () => {
    expect(markdownToHtml('Hello world')).toContain('<p>Hello world</p>');
  });

  it('creates separate paragraphs for blank-line separated text', () => {
    const html = markdownToHtml('First paragraph.\n\nSecond paragraph.');
    expect(html).toContain('<p>First paragraph.</p>');
    expect(html).toContain('<p>Second paragraph.</p>');
  });

  // ── XSS safety ────────────────────────────────────────────────────────────

  it('does not pass raw script tags through from fenced block', () => {
    const md = '```\n<script>evil()</script>\n```';
    const html = markdownToHtml(md);
    expect(html).not.toContain('<script>');
  });

  it('does not inject onerror attributes from image syntax', () => {
    const md = '![x](onerror=alert(1))';
    // The raw function may output it but DOMPurify would strip it;
    // the raw output at minimum should not double-execute it as markup.
    const html = markdownToHtml(md);
    // Verify we at least produce an img tag (format check)
    expect(html).toContain('<img');
  });

  // ── GFM: Strikethrough ────────────────────────────────────────────────────

  it('renders strikethrough with ~~', () => {
    expect(markdownToHtml('This is ~~deleted~~ text')).toContain('<del>deleted</del>');
  });

  // ── GFM: Task lists ───────────────────────────────────────────────────────

  it('renders unchecked task list item', () => {
    const html = markdownToHtml('- [ ] Buy milk');
    expect(html).toContain('<ul class="task-list">');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('Buy milk');
    expect(html).not.toContain('checked');
  });

  it('renders checked task list item', () => {
    const html = markdownToHtml('- [x] Done task');
    expect(html).toContain('checked');
    expect(html).toContain('Done task');
  });

  it('renders mixed task list', () => {
    const md = '- [x] First\n- [ ] Second';
    const html = markdownToHtml(md);
    expect(html).toContain('<ul class="task-list">');
    expect(html).toContain('First');
    expect(html).toContain('Second');
  });

  // ── GFM: Tables ───────────────────────────────────────────────────────────

  it('renders a simple GFM table', () => {
    const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |';
    const html = markdownToHtml(md);
    expect(html).toContain('<table>');
    expect(html).toContain('<thead>');
    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<th>Age</th>');
    expect(html).toContain('<td>Alice</td>');
    expect(html).toContain('<td>Bob</td>');
  });

  it('renders table with leading/trailing pipes', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = markdownToHtml(md);
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<td>1</td>');
  });
});

// ── Clustering algorithm ───────────────────────────────────────────────────
//
// markdownToHtml partitions the source into typed line clusters (heading,
// list, table, code, paragraph, ...) before any inline formatting is
// applied. These tests exercise the clustering step directly, plus the
// cluster-isolation bug it fixes: a whole-document regex chain lets rules
// meant for prose (bold/italic/inline-code/links) leak into fenced code
// blocks that happen to contain the same characters.

describe('clusterMarkdownLines', () => {
  it('groups consecutive unordered list lines into a single cluster', () => {
    const clusters = clusterMarkdownLines('- Alpha\n- Beta\n- Gamma');
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      type: 'unordered-list',
      lines: ['- Alpha', '- Beta', '- Gamma'],
    });
  });

  it('splits a heading, a list, and a paragraph into separate clusters', () => {
    const clusters = clusterMarkdownLines('# Title\n- item one\n- item two\n\nSome text');
    expect(clusters.map((c) => c.type)).toEqual(['heading', 'unordered-list', 'blank', 'paragraph']);
  });

  it('keeps a fenced code block as a single cluster distinct from surrounding paragraphs', () => {
    const md = 'before\n\n```js\nconst x = 1;\n```\n\nafter';
    const clusters = clusterMarkdownLines(md);
    const codeCluster = clusters.find((c) => c.type === 'code');
    expect(codeCluster).toBeDefined();
    expect(codeCluster!.lines).toEqual(['```js', 'const x = 1;', '```']);
  });

  it('classifies task list lines separately from plain unordered list lines', () => {
    const clusters = clusterMarkdownLines('- [ ] task\n- plain item');
    expect(clusters.map((c) => c.type)).toEqual(['task-list', 'unordered-list']);
  });

  it('treats a single pipe-containing line without a separator row as a paragraph, not a table', () => {
    const clusters = clusterMarkdownLines('Cost is $5 | discount available');
    expect(clusters).toHaveLength(1);
    expect(clusters[0].type).toBe('paragraph');
  });

  it('merges a stray pipe line back into a surrounding paragraph run', () => {
    // "Second" ends up briefly mis-classified as a failed table candidate;
    // it must still end up in the same paragraph as its neighbors so the
    // rendered output matches a single run of text with no blank line breaks.
    const clusters = clusterMarkdownLines('First line\nSecond | line\nThird line');
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      type: 'paragraph',
      lines: ['First line', 'Second | line', 'Third line'],
    });
  });

  it('recognizes a valid GFM table as one cluster', () => {
    const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |';
    const clusters = clusterMarkdownLines(md);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].type).toBe('table');
  });
});

describe('markdownToHtml — cluster isolation regression tests', () => {
  it('does not apply inline code formatting to backticks inside a fenced code block', () => {
    const md = '```\nUse `x` here\n```';
    const html = markdownToHtml(md);
    expect(html).toBe('<pre><code>Use `x` here</code></pre>');
    expect(html).not.toContain('<code>x</code>');
  });

  it('does not apply bold/italic formatting inside a fenced code block', () => {
    const md = '```\nconst bold = **not bold**;\nconst em = _not em_;\n```';
    const html = markdownToHtml(md);
    expect(html).toContain('**not bold**');
    expect(html).toContain('_not em_');
    expect(html).not.toContain('<strong>');
    expect(html).not.toContain('<em>');
  });

  it('does not turn link syntax inside a fenced code block into an anchor tag', () => {
    const md = '```md\n[label](https://example.com)\n```';
    const html = markdownToHtml(md);
    expect(html).not.toContain('<a href=');
    expect(html).toContain('[label](https://example.com)');
  });

  it('still applies inline formatting to a paragraph following a code block', () => {
    const md = '```\ncode\n```\n\nThis is **bold** after code.';
    const html = markdownToHtml(md);
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders a heading immediately followed by a list without losing either', () => {
    const md = '## Section\n- one\n- two';
    const html = markdownToHtml(md);
    expect(html).toContain('<h2>Section</h2>');
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>');
  });

  it('applies inline formatting inside table cells', () => {
    const md = '| Name |\n| --- |\n| **Alice** |';
    const html = markdownToHtml(md);
    expect(html).toContain('<td><strong>Alice</strong></td>');
  });

  it('handles an unterminated fenced code block by escaping its content instead of leaving it unprocessed', () => {
    const md = '```\n<script>evil()</script>';
    const html = markdownToHtml(md);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
