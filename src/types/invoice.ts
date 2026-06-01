export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export type InvoiceContentType = 'lesson' | 'course' | 'audio' | 'video' | 'material';

export interface Invoice {
  id: string;
  contentId: string;
  contentType: InvoiceContentType;
  title: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
  buyerName: string;
  buyerEmail: string;
  description?: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  pendingCount: number;
  paidCount: number;
  failedCount: number;
  refundedCount: number;
  cancelledCount: number;
}

export interface InvoiceFilter {
  status?: InvoiceStatus | 'all';
  contentType?: InvoiceContentType | 'all';
  search?: string;
}
