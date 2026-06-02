import { CheckCircle, Clock, XCircle, AlertTriangle, Ban } from 'lucide-react';
import type { InvoiceStatus } from '@/types/invoice';

const statusConfig: Record<
  InvoiceStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  paid: {
    label: 'Paid',
    icon: <CheckCircle size={14} />,
    className: 'text-green-700 bg-green-100',
  },
  pending: {
    label: 'Pending',
    icon: <Clock size={14} />,
    className: 'text-yellow-700 bg-yellow-100',
  },
  failed: {
    label: 'Failed',
    icon: <XCircle size={14} />,
    className: 'text-red-700 bg-red-100',
  },
  refunded: {
    label: 'Refunded',
    icon: <AlertTriangle size={14} />,
    className: 'text-orange-700 bg-orange-100',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <Ban size={14} />,
    className: 'text-gray-600 bg-gray-200',
  },
};

interface AudioInvoiceBadgeProps {
  status: InvoiceStatus;
}

export function AudioInvoiceBadge({ status }: AudioInvoiceBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      role="status"
      aria-label={`Invoice status: ${config.label}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
