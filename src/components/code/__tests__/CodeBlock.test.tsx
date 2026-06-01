import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeBlock } from '../CodeBlock';

// Mock SyntaxHighlighter to keep tests focused on CodeBlock behaviour
vi.mock('../SyntaxHighlighter', () => ({
  SyntaxHighlighter: ({ language }: { language: string }) => (
    <span data-testid="syntax-highlighter">{language}</span>
  ),
}));

const SHORT_CODE = 'const x = 1;';
const LONG_CODE = Array.from({ length: 20 }, (_, i) => `const line${i} = ${i};`).join('\n');

describe('CodeBlock', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders code content', () => {
    render(<CodeBlock code={SHORT_CODE} />);
    expect(screen.getByText(SHORT_CODE)).toBeInTheDocument();
  });

  it('renders language badge via SyntaxHighlighter', () => {
    render(<CodeBlock code={SHORT_CODE} language="typescript" />);
    expect(screen.getByTestId('syntax-highlighter')).toHaveTextContent('typescript');
  });

  it('does not show expand toggle for short code', () => {
    render(<CodeBlock code={SHORT_CODE} collapseThreshold={15} />);
    expect(screen.queryByRole('button', { name: /show/i })).not.toBeInTheDocument();
  });

  it('shows expand toggle when line count exceeds collapseThreshold', () => {
    render(<CodeBlock code={LONG_CODE} collapseThreshold={15} />);
    expect(screen.getByRole('button', { name: /show \d+ more line/i })).toBeInTheDocument();
  });

  it('toggles expanded state on expand button click', () => {
    render(<CodeBlock code={LONG_CODE} collapseThreshold={15} />);
    const toggle = screen.getByRole('button', { name: /show \d+ more line/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /collapse/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('copies code to clipboard and shows Copied! feedback', async () => {
    render(<CodeBlock code={SHORT_CODE} />);
    const copyBtn = screen.getByRole('button', { name: /copy code/i });
    fireEvent.click(copyBtn);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument(),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SHORT_CODE);
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<CodeBlock code={SHORT_CODE} className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('uses collapseThreshold prop for max-height style', () => {
    const { container } = render(
      <CodeBlock code={LONG_CODE} collapseThreshold={10} />,
    );
    const codeArea = container.querySelector('[style*="max-height"]') as HTMLElement;
    expect(codeArea.style.maxHeight).toBe(`${10 * 1.625}rem`);
  });

  it('removes max-height constraint when expanded', () => {
    const { container } = render(
      <CodeBlock code={LONG_CODE} collapseThreshold={10} />,
    );
    const toggle = screen.getByRole('button', { name: /show \d+ more line/i });
    fireEvent.click(toggle);
    const codeArea = container.querySelector('[style*="max-height"]') as HTMLElement;
    expect(codeArea.style.maxHeight).toBe('9999px');
  });
});
