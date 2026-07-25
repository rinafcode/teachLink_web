import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioInvoiceBadge } from '../AudioInvoiceBadge';
import { AudioInvoiceList } from '../AudioInvoiceList';
import { AudioInvoiceDetail } from '../AudioInvoiceDetail';
import { AudioInvoiceManager, AudioInvoiceButton } from '../AudioInvoiceManager';
import { useAudioInvoice } from '@/hooks/useAudioInvoice';
import type { Invoice, InvoiceFilter, InvoiceSummary } from '@/types/invoice';

// ─── AudioInvoiceBadge ────────────────────────────────────────────────────

describe('AudioInvoiceBadge', () => {
  it('renders paid status', () => {
    render(<AudioInvoiceBadge status="paid" />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Invoice status: Paid');
  });

  it('renders pending status', () => {
    render(<AudioInvoiceBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders failed status', () => {
    render(<AudioInvoiceBadge status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders refunded status', () => {
    render(<AudioInvoiceBadge status="refunded" />);
    expect(screen.getByText('Refunded')).toBeInTheDocument();
  });

  it('renders cancelled status', () => {
    render(<AudioInvoiceBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});

// ─── AudioInvoiceButton ───────────────────────────────────────────────────

describe('AudioInvoiceButton', () => {
  it('renders and calls onClick', () => {
    const onClick = vi.fn();
    render(<AudioInvoiceButton onClick={onClick} />);
    const btn = screen.getByLabelText('Open invoice management');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ─── AudioInvoiceList ─────────────────────────────────────────────────────

const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    contentId: 'c1',
    contentType: 'lesson',
    title: 'Music Theory',
    amount: 29.99,
    currency: 'USD',
    status: 'paid',
    issuedAt: '2026-05-01T10:00:00Z',
    paidAt: '2026-05-01T10:05:00Z',
    buyerName: 'Alice',
    buyerEmail: 'alice@test.com',
  },
  {
    id: 'inv-002',
    contentId: 'c2',
    contentType: 'audio',
    title: 'Podcast Ep 5',
    amount: 14.99,
    currency: 'USD',
    status: 'pending',
    issuedAt: '2026-05-15T14:30:00Z',
    buyerName: 'Bob',
    buyerEmail: 'bob@test.com',
  },
];

const defaultSummary: InvoiceSummary = {
  totalInvoices: 2,
  totalAmount: 29.99,
  pendingCount: 1,
  paidCount: 1,
  failedCount: 0,
  refundedCount: 0,
  cancelledCount: 0,
};

const defaultFilter: InvoiceFilter = { status: 'all', contentType: 'all', search: '' };

describe('AudioInvoiceList', () => {
  it('renders invoice items', () => {
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    expect(screen.getByText('Music Theory')).toBeInTheDocument();
    expect(screen.getByText('Podcast Ep 5')).toBeInTheDocument();
  });

  it('renders summary counts', () => {
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('$29.99')).toHaveLength(2);
  });

  it('shows empty state when no invoices', () => {
    render(
      <AudioInvoiceList
        invoices={[]}
        summary={{
          totalInvoices: 0,
          totalAmount: 0,
          pendingCount: 0,
          paidCount: 0,
          failedCount: 0,
          refundedCount: 0,
          cancelledCount: 0,
        }}
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
  });

  it('calls onSelectInvoice when invoice clicked', () => {
    const onSelect = vi.fn();
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={defaultFilter}
        onFilterChange={vi.fn()}
        onSelectInvoice={onSelect}
        onClearFilter={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('View invoice Music Theory'));
    expect(onSelect).toHaveBeenCalledWith('inv-001');
  });

  it('calls onFilterChange when search input changes', () => {
    const onFilter = vi.fn();
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={defaultFilter}
        onFilterChange={onFilter}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Search invoices'), { target: { value: 'Alice' } });
    expect(onFilter).toHaveBeenCalledWith(expect.objectContaining({ search: 'Alice' }));
  });

  it('calls onFilterChange when status dropdown changes', () => {
    const onFilter = vi.fn();
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={defaultFilter}
        onFilterChange={onFilter}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'paid' } });
    expect(onFilter).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
  });

  it('calls onFilterChange when content type dropdown changes', () => {
    const onFilter = vi.fn();
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={defaultFilter}
        onFilterChange={onFilter}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Filter by content type'), {
      target: { value: 'audio' },
    });
    expect(onFilter).toHaveBeenCalledWith(expect.objectContaining({ contentType: 'audio' }));
  });

  it('shows clear button when filters active', () => {
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={{ status: 'paid', contentType: 'all', search: '' }}
        onFilterChange={vi.fn()}
        onSelectInvoice={vi.fn()}
        onClearFilter={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
  });

  it('calls onClearFilter when clear button clicked', () => {
    const onClear = vi.fn();
    render(
      <AudioInvoiceList
        invoices={mockInvoices}
        summary={defaultSummary}
        filter={{ status: 'paid', contentType: 'all', search: '' }}
        onFilterChange={vi.fn()}
        onSelectInvoice={vi.fn()}
        onClearFilter={onClear}
      />,
    );
    fireEvent.click(screen.getByLabelText('Clear all filters'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

// ─── AudioInvoiceDetail ───────────────────────────────────────────────────

describe('AudioInvoiceDetail', () => {
  const mockInvoice: Invoice = {
    id: 'inv-001',
    contentId: 'c1',
    contentType: 'lesson',
    title: 'Music Theory',
    amount: 29.99,
    currency: 'USD',
    status: 'paid',
    issuedAt: '2026-05-01T10:00:00Z',
    paidAt: '2026-05-01T10:05:00Z',
    buyerName: 'Alice Johnson',
    buyerEmail: 'alice@test.com',
    description: 'Full lesson access',
  };

  it('renders invoice details', () => {
    render(<AudioInvoiceDetail invoice={mockInvoice} onBack={vi.fn()} />);
    expect(screen.getByText('Music Theory')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('inv-001'))).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('29.99 USD')).toBeInTheDocument();
    expect(screen.getByText('Full lesson access')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders paid date when available', () => {
    render(<AudioInvoiceDetail invoice={mockInvoice} onBack={vi.fn()} />);
    expect(screen.getByText(/Paid on:/)).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<AudioInvoiceDetail invoice={mockInvoice} onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Back to invoice list'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ─── AudioInvoiceManager (integration) ────────────────────────────────────

describe('AudioInvoiceManager', () => {
  it('renders invoice list when open', () => {
    render(<AudioInvoiceManager isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Invoice Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search invoices...')).toBeInTheDocument();
  });

  it('shows invoice titles from mock data', () => {
    render(<AudioInvoiceManager isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Introduction to Music Theory')).toBeInTheDocument();
    expect(screen.getByText('Podcast Episode 5: Mastering Audio')).toBeInTheDocument();
    expect(screen.getByText('Complete Audio Engineering 2026')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AudioInvoiceManager isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Invoice Management')).not.toBeInTheDocument();
  });
});

// ─── useAudioInvoice hook ─────────────────────────────────────────────────

describe('useAudioInvoice', () => {
  it('returns invoices and summary', () => {
    function TestComponent() {
      const { invoices, summary } = useAudioInvoice();
      return (
        <div>
          <span data-testid="count">{invoices.length}</span>
          <span data-testid="paid">{summary.paidCount}</span>
          <span data-testid="pending">{summary.pendingCount}</span>
          <span data-testid="total">{summary.totalAmount}</span>
        </div>
      );
    }
    render(<TestComponent />);
    expect(screen.getByTestId('count').textContent).toBe('5');
    expect(screen.getByTestId('paid').textContent).toBe('1');
    expect(screen.getByTestId('pending').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('29.99');
  });

  it('filters invoices by status', () => {
    function TestComponent() {
      const { invoices, filter, setFilter } = useAudioInvoice();
      return (
        <div>
          <button onClick={() => setFilter({ ...filter, status: 'paid' })}>Filter Paid</button>
          <span data-testid="count">{invoices.length}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Filter Paid'));
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('filters invoices by content type', () => {
    function TestComponent() {
      const { invoices, filter, setFilter } = useAudioInvoice();
      return (
        <div>
          <button onClick={() => setFilter({ ...filter, contentType: 'audio' })}>
            Filter Audio
          </button>
          <span data-testid="count">{invoices.length}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Filter Audio'));
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('searches invoices by title', () => {
    function TestComponent() {
      const { invoices, filter, setFilter } = useAudioInvoice();
      return (
        <div>
          <button onClick={() => setFilter({ ...filter, search: 'podcast' })}>Search</button>
          <span data-testid="count">{invoices.length}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('selects an invoice', () => {
    function TestComponent() {
      const { invoices, selectInvoice, selectedInvoice } = useAudioInvoice();
      return (
        <div>
          <button onClick={() => selectInvoice(invoices[0].id)}>Select</button>
          <span data-testid="selected">{selectedInvoice?.title ?? 'none'}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByTestId('selected').textContent).toBe('Introduction to Music Theory');
  });

  it('clears filter', () => {
    function TestComponent() {
      const { invoices, filter, setFilter, clearFilter } = useAudioInvoice();
      return (
        <div>
          <button onClick={() => setFilter({ ...filter, search: 'podcast' })}>Set</button>
          <button onClick={clearFilter}>Clear</button>
          <span data-testid="count">{invoices.length}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Set'));
    expect(screen.getByTestId('count').textContent).toBe('1');
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByTestId('count').textContent).toBe('5');
  });

  it('checks content purchase status', () => {
    function TestComponent() {
      const { isContentPurchased } = useAudioInvoice();
      return (
        <div>
          <span data-testid="purchased">{isContentPurchased('lesson-101') ? 'yes' : 'no'}</span>
          <span data-testid="not-purchased">
            {isContentPurchased('nonexistent') ? 'yes' : 'no'}
          </span>
        </div>
      );
    }
    render(<TestComponent />);
    expect(screen.getByTestId('purchased').textContent).toBe('yes');
    expect(screen.getByTestId('not-purchased').textContent).toBe('no');
  });

  it('adds an invoice', () => {
    function TestComponent() {
      const { invoices, addInvoice } = useAudioInvoice();
      return (
        <div>
          <button
            onClick={() =>
              addInvoice({
                id: 'inv-new',
                contentId: 'new',
                contentType: 'lesson',
                title: 'New Invoice',
                amount: 9.99,
                currency: 'USD',
                status: 'pending',
                issuedAt: new Date().toISOString(),
                buyerName: 'Test',
                buyerEmail: 'test@test.com',
              })
            }
          >
            Add
          </button>
          <span data-testid="count">{invoices.length}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByTestId('count').textContent).toBe('6');
  });

  it('updates invoice status', () => {
    function TestComponent() {
      const { invoices, updateInvoiceStatus } = useAudioInvoice();
      return (
        <div>
          <button onClick={() => updateInvoiceStatus('inv-002', 'paid')}>Pay</button>
          <span data-testid="status">{invoices.find((i) => i.id === 'inv-002')?.status}</span>
        </div>
      );
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Pay'));
    expect(screen.getByTestId('status').textContent).toBe('paid');
  });
});
