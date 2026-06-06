import { Search, X } from 'lucide-react';
import { AudioInvoiceBadge } from './AudioInvoiceBadge';
import type {
  Invoice,
  InvoiceFilter,
  InvoiceSummary,
  InvoiceStatus,
  InvoiceContentType,
} from '@/types/invoice';

interface AudioInvoiceListProps {
  invoices: Invoice[];
  summary: InvoiceSummary;
  filter: InvoiceFilter;
  onFilterChange: (filter: InvoiceFilter) => void;
  onSelectInvoice: (id: string) => void;
  onClearFilter: () => void;
}

const statusOptions: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];

const contentTypeOptions: { value: InvoiceContentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'lesson', label: 'Lesson' },
  { value: 'course', label: 'Course' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'material', label: 'Material' },
];

export function AudioInvoiceList({
  invoices,
  summary,
  filter,
  onFilterChange,
  onSelectInvoice,
  onClearFilter,
}: AudioInvoiceListProps) {
  const hasActiveFilter =
    filter.status !== 'all' || filter.contentType !== 'all' || !!filter.search;

  return (
    <div className="space-y-4" role="region" aria-label="Invoice list">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search invoices..."
            value={filter.search ?? ''}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search invoices"
          />
        </div>

        <select
          value={filter.status ?? 'all'}
          onChange={(e) =>
            onFilterChange({ ...filter, status: e.target.value as InvoiceStatus | 'all' })
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filter.contentType ?? 'all'}
          onChange={(e) =>
            onFilterChange({ ...filter, contentType: e.target.value as InvoiceContentType | 'all' })
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by content type"
        >
          {contentTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            onClick={onClearFilter}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            aria-label="Clear all filters"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>
          Total: <strong>{summary.totalInvoices}</strong>
        </span>
        <span>
          Paid: <strong>{summary.paidCount}</strong>
        </span>
        <span>
          Pending: <strong>{summary.pendingCount}</strong>
        </span>
        <span>
          Failed: <strong>{summary.failedCount}</strong>
        </span>
        <span>
          Refunded: <strong>{summary.refundedCount}</strong>
        </span>
        <span>
          Cancelled: <strong>{summary.cancelledCount}</strong>
        </span>
        <span>
          Revenue: <strong>${summary.totalAmount.toFixed(2)}</strong>
        </span>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No invoices found</p>
          {hasActiveFilter && (
            <button onClick={onClearFilter} className="mt-2 text-sm text-blue-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg" role="list">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <button
                onClick={() => onSelectInvoice(invoice.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                aria-label={`View invoice ${invoice.title}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{invoice.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {invoice.buyerName} &middot; {new Date(invoice.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">
                    ${invoice.amount.toFixed(2)}
                  </span>
                  <AudioInvoiceBadge status={invoice.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
