import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilterHelpPopover } from '../FilterHelpPopover';
import { FilterSupportGuide } from '../FilterSupportGuide';
import { useFilterCustomerSupport } from '@/hooks/useFilterCustomerSupport';

// Guide content is static; verify it matches what we render
import type { FilterHelpContent } from '@/hooks/useFilterCustomerSupport';

const MOCK_CONTENT: FilterHelpContent = {
  id: 'test-filter',
  title: 'Test Filter',
  description: 'This is a test filter description.',
  tips: ['Tip one', 'Tip two', 'Tip three'],
  faqs: [
    { question: 'Test question?', answer: 'Test answer.' },
    { question: 'Another question?', answer: 'Another answer.' },
  ],
};

const MOCK_ALL_CONTENT: Record<string, FilterHelpContent> = {
  'test-filter': MOCK_CONTENT,
  'test-filter-2': {
    id: 'test-filter-2',
    title: 'Another Filter',
    description: 'Another description.',
    tips: ['Another tip'],
    faqs: [],
  },
};

describe('FilterHelpPopover', () => {
  it('renders help button', () => {
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={false}
        onToggle={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByLabelText(/help: test filter/i)).toBeInTheDocument();
  });

  it('shows popover content when open', () => {
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Test Filter')).toBeInTheDocument();
    expect(
      screen.getByText('This is a test filter description.'),
    ).toBeInTheDocument();
  });

  it('displays tips and FAQs', () => {
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Tip one')).toBeInTheDocument();
    expect(screen.getByText('Tip two')).toBeInTheDocument();
    expect(screen.getByText('Q: Test question?')).toBeInTheDocument();
    expect(screen.getByText('A: Test answer.')).toBeInTheDocument();
  });

  it('calls onToggle when button is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={false}
        onToggle={onToggle}
        onClose={() => {}}
      />,
    );
    await userEvent.click(screen.getByLabelText(/help: test filter/i));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={true}
        onToggle={() => {}}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByLabelText('Close help'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={true}
        onToggle={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper aria attributes when closed', () => {
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={false}
        onToggle={() => {}}
        onClose={() => {}}
      />,
    );
    const btn = screen.getByLabelText(/help: test filter/i);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('has proper aria attributes when open', () => {
    render(
      <FilterHelpPopover
        content={MOCK_CONTENT}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
      />,
    );
    const btn = screen.getByLabelText(/help: test filter/i);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('FilterSupportGuide', () => {
  it('does not render when closed', () => {
    render(
      <FilterSupportGuide
        isOpen={false}
        onClose={() => {}}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    expect(screen.queryByText('Filter Controls Help')).not.toBeInTheDocument();
  });

  it('renders guide content when open', () => {
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={() => {}}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    expect(screen.getByText('Filter Controls Help')).toBeInTheDocument();
    expect(screen.getByText('Guide')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('shows sections in guide tab', () => {
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={() => {}}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    expect(screen.getByText('Test Filter')).toBeInTheDocument();
    expect(screen.getByText('Another Filter')).toBeInTheDocument();
  });

  it('expands section on click', async () => {
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={() => {}}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    const sectionBtn = screen.getByText('Test Filter').closest('button')!;
    await userEvent.click(sectionBtn);
    expect(
      screen.getByText('This is a test filter description.'),
    ).toBeInTheDocument();
  });

  it('switches to FAQ tab', async () => {
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={() => {}}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    await userEvent.click(screen.getByText('FAQ'));
    expect(screen.getByText(/Test question/)).toBeInTheDocument();
    expect(screen.getByText(/Another question/)).toBeInTheDocument();
  });

  it('switches to Contact Support tab', async () => {
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={() => {}}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    await userEvent.click(screen.getByText('Contact Support'));
    expect(screen.getByText(/Still need help/)).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't find what you need/),
    ).toBeInTheDocument();
  });

  it('shows "No FAQs" when no FAQs exist', async () => {
    const noFaqContent: Record<string, FilterHelpContent> = {
      faqless: {
        id: 'faqless',
        title: 'No FAQs',
        description: 'No FAQs here',
        tips: [],
        faqs: [],
      },
    };
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={() => {}}
        helpContent={noFaqContent}
      />,
    );
    await userEvent.click(screen.getByText('FAQ'));
    expect(
      screen.getByText('No FAQs available at this time.'),
    ).toBeInTheDocument();
  });

  it('calls onClose when clicking close button', async () => {
    const onClose = vi.fn();
    render(
      <FilterSupportGuide
        isOpen={true}
        onClose={onClose}
        helpContent={MOCK_ALL_CONTENT}
      />,
    );
    await userEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('useFilterCustomerSupport', () => {
  it('returns help content for known filter IDs', () => {
    function TestComponent() {
      const support = useFilterCustomerSupport();
      const content = support.getHelpContent('difficulty');
      return <div data-testid="result">{content ? content.title : 'not found'}</div>;
    }
    render(<TestComponent />);
    expect(screen.getByTestId('result')).toHaveTextContent('Difficulty Level');
  });

  it('toggles activeHelpId', async () => {
    function TestComponent() {
      const support = useFilterCustomerSupport();
      return (
        <div>
          <span data-testid="active">{support.activeHelpId ?? 'none'}</span>
          <button onClick={() => support.toggleHelp('price')}>Toggle</button>
        </div>
      );
    }
    render(<TestComponent />);
    expect(screen.getByTestId('active')).toHaveTextContent('none');
    await userEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('active')).toHaveTextContent('price');
    await userEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });

  it('closes help and resets activeHelpId', async () => {
    function TestComponent() {
      const support = useFilterCustomerSupport();
      return (
        <div>
          <span data-testid="active">{support.activeHelpId ?? 'none'}</span>
          <button onClick={() => support.toggleHelp('topics')}>Open</button>
          <button onClick={support.closeHelp}>Close</button>
        </div>
      );
    }
    render(<TestComponent />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByTestId('active')).toHaveTextContent('topics');
    await userEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });

  it('manages guideOpen state', async () => {
    function TestComponent() {
      const support = useFilterCustomerSupport();
      return (
        <div>
          <span data-testid="guide-open">
            {support.guideOpen ? 'open' : 'closed'}
          </span>
          <button onClick={support.openGuide}>Open Guide</button>
          <button onClick={support.closeGuide}>Close Guide</button>
        </div>
      );
    }
    render(<TestComponent />);
    expect(screen.getByTestId('guide-open')).toHaveTextContent('closed');
    await userEvent.click(screen.getByText('Open Guide'));
    expect(screen.getByTestId('guide-open')).toHaveTextContent('open');
    await userEvent.click(screen.getByText('Close Guide'));
    expect(screen.getByTestId('guide-open')).toHaveTextContent('closed');
  });

  it('has all help content sections', () => {
    function TestComponent() {
      const support = useFilterCustomerSupport();
      const ids = Object.keys(support.FILTER_HELP_CONTENT);
      return <div data-testid="ids">{ids.join(',')}</div>;
    }
    render(<TestComponent />);
    const ids = screen.getByTestId('ids').textContent!.split(',');
    expect(ids).toContain('difficulty');
    expect(ids).toContain('duration');
    expect(ids).toContain('price');
    expect(ids).toContain('topics');
    expect(ids).toContain('instructor');
    expect(ids).toContain('content-type');
    expect(ids).toContain('rating');
  });
});
