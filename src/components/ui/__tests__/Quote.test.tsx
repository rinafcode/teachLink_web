import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Quote } from '../Quote';

describe('Quote Component', () => {
  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders the quote text', () => {
    render(<Quote text="This is a test quote" />);
    expect(screen.getByText('This is a test quote')).toBeInTheDocument();
  });

  it('renders with author', () => {
    render(<Quote text="Test quote" author="John Doe" />);
    expect(screen.getByText('— John Doe')).toBeInTheDocument();
  });

  it('renders with source', () => {
    render(<Quote text="Test quote" source="Book Title" />);
    expect(screen.getByText('Book Title')).toBeInTheDocument();
  });

  it('renders with author and source', () => {
    render(<Quote text="Test quote" author="John Doe" source="Book Title" />);
    expect(screen.getByText('— John Doe')).toBeInTheDocument();
    expect(screen.getByText('Book Title')).toBeInTheDocument();
  });

  it('renders copy button by default', () => {
    render(<Quote text="Test quote" />);
    const copyButton = screen.getByLabelText(/copy quote/i);
    expect(copyButton).toBeInTheDocument();
  });

  it('hides copy button when showCopyButton is false', () => {
    render(<Quote text="Test quote" showCopyButton={false} />);
    const copyButton = screen.queryByLabelText(/copy quote/i);
    expect(copyButton).not.toBeInTheDocument();
  });

  it('copies text to clipboard when copy button is clicked', async () => {
    const onCopy = vi.fn();
    render(<Quote text="Test quote" onCopy={onCopy} />);

    const copyButton = screen.getByLabelText(/copy quote/i);
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test quote');
    expect(onCopy).toHaveBeenCalledWith('Test quote');
  });

  it('shows check icon after copying', async () => {
    render(<Quote text="Test quote" />);

    const copyButton = screen.getByLabelText(/copy quote/i);
    fireEvent.click(copyButton);

    await waitFor(() => {
      const checkIcon = screen.getByLabelText(/copied to clipboard/i);
      expect(checkIcon).toBeInTheDocument();
    });
  });

  it('resets copied state after 2 seconds', () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    render(<Quote text="Test quote" />);

    const copyButton = screen.getByLabelText(/copy quote/i);
    fireEvent.click(copyButton);

    // Check icon should be present after click
    const checkIcon = screen.getByLabelText(/copied to clipboard/i);
    expect(checkIcon).toBeInTheDocument();

    // Verify setTimeout was called with 2000ms
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);

    setTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('calls onCopy callback when text is copied', () => {
    const onCopy = vi.fn();
    render(<Quote text="Test quote" onCopy={onCopy} />);

    const copyButton = screen.getByLabelText(/copy quote/i);
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalledWith('Test quote');
  });

  it('renders navigation arrows when showNavigation is true', () => {
    render(
      <Quote
        text="Test quote"
        showNavigation={true}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Previous quote')).toBeInTheDocument();
    expect(screen.getByLabelText('Next quote')).toBeInTheDocument();
  });

  it('calls onSwipeLeft when left navigation button is clicked', () => {
    const onSwipeLeft = vi.fn();
    render(<Quote text="Test quote" showNavigation={true} onSwipeLeft={onSwipeLeft} />);

    const leftButton = screen.getByLabelText('Previous quote');
    fireEvent.click(leftButton);

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('calls onSwipeRight when right navigation button is clicked', () => {
    const onSwipeRight = vi.fn();
    render(<Quote text="Test quote" showNavigation={true} onSwipeRight={onSwipeRight} />);

    const rightButton = screen.getByLabelText('Next quote');
    fireEvent.click(rightButton);

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it('does not render navigation arrows when showNavigation is false', () => {
    render(<Quote text="Test quote" showNavigation={false} />);

    expect(screen.queryByLabelText('Previous quote')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next quote')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Quote text="Test quote" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with custom icon', () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(<Quote text="Test quote" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<Quote text="Test quote" author="John Doe" />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Quote by John Doe');
  });

  it('has proper ARIA label when author is missing', () => {
    render(<Quote text="Test quote" />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Quote by Unknown author');
  });

  it('renders with dark mode support', () => {
    const { container } = render(<Quote text="Test quote" />);
    expect(container.firstChild).toHaveClass('dark:from-purple-900/20');
  });
});
