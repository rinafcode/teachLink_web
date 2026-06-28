import { ArrowLeft, Calendar, DollarSign, FileText, Mail, User } from 'lucide-react';
import { AudioInvoiceBadge } from './AudioInvoiceBadge';
import type { Invoice } from '@/types/invoice';

interface AudioInvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
}

export function AudioInvoiceDetail({ invoice, onBack }: AudioInvoiceDetailProps) {
  return (
    <div role="region" aria-label={`Invoice detail for ${invoice.title}`}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        aria-label="Back to invoice list"
      >
        <ArrowLeft size={16} />
        Back to invoices
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{invoice.title}</h3>
            <p className="text-sm text-gray-500 mt-1">Invoice #{invoice.id}</p>
          </div>
          <AudioInvoiceBadge status={invoice.status} />
        </div>

        {invoice.description && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <FileText size={16} className="mt-0.5 flex-shrink-0" />
            <span>{invoice.description}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User size={16} className="flex-shrink-0" />
            <span>{invoice.buyerName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={16} className="flex-shrink-0" />
            <span>{invoice.buyerEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign size={16} className="flex-shrink-0" />
            <span>
              {invoice.amount.toFixed(2)} {invoice.currency}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} className="flex-shrink-0" />
            <span>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {invoice.paidAt && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Calendar size={16} />
            <span>Paid on: {new Date(invoice.paidAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
