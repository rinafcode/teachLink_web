'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  Invoice,
  InvoiceStatus,
  InvoiceContentType,
  InvoiceSummary,
  InvoiceFilter,
} from '@/types/invoice';

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    contentId: 'lesson-101',
    contentType: 'lesson',
    title: 'Introduction to Music Theory',
    amount: 29.99,
    currency: 'USD',
    status: 'paid',
    issuedAt: '2026-05-01T10:00:00Z',
    paidAt: '2026-05-01T10:05:00Z',
    buyerName: 'Alice Johnson',
    buyerEmail: 'alice@example.com',
    description: 'Full lesson access',
  },
  {
    id: 'inv-002',
    contentId: 'audio-201',
    contentType: 'audio',
    title: 'Podcast Episode 5: Mastering Audio',
    amount: 14.99,
    currency: 'USD',
    status: 'pending',
    issuedAt: '2026-05-15T14:30:00Z',
    buyerName: 'Bob Smith',
    buyerEmail: 'bob@example.com',
    description: 'Audio streaming license',
  },
  {
    id: 'inv-003',
    contentId: 'course-301',
    contentType: 'course',
    title: 'Complete Audio Engineering 2026',
    amount: 199.99,
    currency: 'USD',
    status: 'failed',
    issuedAt: '2026-05-20T09:00:00Z',
    buyerName: 'Charlie Davis',
    buyerEmail: 'charlie@example.com',
    description: 'Full course bundle',
  },
  {
    id: 'inv-004',
    contentId: 'video-401',
    contentType: 'video',
    title: 'Masterclass: Sound Design',
    amount: 49.99,
    currency: 'USD',
    status: 'refunded',
    issuedAt: '2026-04-10T08:00:00Z',
    paidAt: '2026-04-10T08:02:00Z',
    buyerName: 'Diana Evans',
    buyerEmail: 'diana@example.com',
    description: 'Video tutorial access – refund requested',
  },
  {
    id: 'inv-005',
    contentId: 'material-501',
    contentType: 'material',
    title: 'Audio Production Toolkit',
    amount: 79.99,
    currency: 'USD',
    status: 'cancelled',
    issuedAt: '2026-03-05T11:00:00Z',
    buyerName: 'Eve Foster',
    buyerEmail: 'eve@example.com',
    description: 'Downloadable resource pack – cancelled',
  },
];

function computeSummary(invoices: Invoice[]): InvoiceSummary {
  const totalInvoices = invoices.length;
  const totalAmount = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
  const failedCount = invoices.filter((inv) => inv.status === 'failed').length;
  const refundedCount = invoices.filter((inv) => inv.status === 'refunded').length;
  const cancelledCount = invoices.filter((inv) => inv.status === 'cancelled').length;

  return {
    totalInvoices,
    totalAmount,
    pendingCount,
    paidCount,
    failedCount,
    refundedCount,
    cancelledCount,
  };
}

export function useAudioInvoice(lessonId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [filter, setFilter] = useState<InvoiceFilter>({
    status: 'all',
    contentType: 'all',
    search: '',
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const statusMatch = filter.status === 'all' || inv.status === filter.status;
      const contentTypeMatch =
        filter.contentType === 'all' || inv.contentType === filter.contentType;
      const searchMatch =
        !filter.search ||
        inv.title.toLowerCase().includes(filter.search.toLowerCase()) ||
        inv.buyerName.toLowerCase().includes(filter.search.toLowerCase()) ||
        inv.buyerEmail.toLowerCase().includes(filter.search.toLowerCase());
      return statusMatch && contentTypeMatch && searchMatch;
    });
  }, [invoices, filter]);

  const summary = useMemo(() => computeSummary(filteredInvoices), [filteredInvoices]);

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId],
  );

  const selectInvoice = useCallback((id: string | null) => {
    setSelectedInvoiceId(id);
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({ status: 'all', contentType: 'all', search: '' });
  }, []);

  const isContentPurchased = useCallback(
    (contentId: string) => {
      return invoices.some((inv) => inv.contentId === contentId && inv.status === 'paid');
    },
    [invoices],
  );

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice]);
  }, []);

  const updateInvoiceStatus = useCallback((invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const updated = { ...inv, status: newStatus };
        if (newStatus === 'paid') {
          updated.paidAt = new Date().toISOString();
        }
        return updated;
      }),
    );
  }, []);

  return {
    invoices: filteredInvoices,
    summary,
    filter,
    setFilter,
    selectedInvoice,
    selectInvoice,
    isContentPurchased,
    addInvoice,
    updateInvoiceStatus,
    clearFilter,
  };
}
