'use client';

import { Receipt } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAudioInvoice } from '@/hooks/useAudioInvoice';
import { AudioInvoiceList } from './AudioInvoiceList';
import { AudioInvoiceDetail } from './AudioInvoiceDetail';

interface AudioInvoiceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId?: string;
}

export function AudioInvoiceManager({ isOpen, onClose, lessonId }: AudioInvoiceManagerProps) {
  const { invoices, summary, filter, setFilter, selectedInvoice, selectInvoice, clearFilter } =
    useAudioInvoice(lessonId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Management">
      <div className="min-h-[300px]">
        {selectedInvoice ? (
          <AudioInvoiceDetail invoice={selectedInvoice} onBack={() => selectInvoice(null)} />
        ) : (
          <AudioInvoiceList
            invoices={invoices}
            summary={summary}
            filter={filter}
            onFilterChange={setFilter}
            onSelectInvoice={selectInvoice}
            onClearFilter={clearFilter}
          />
        )}
      </div>
    </Modal>
  );
}

export function AudioInvoiceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-3 rounded bg-white/20 hover:bg-white/30 transition-colors md:p-2"
      title="Invoices"
      aria-label="Open invoice management"
      type="button"
    >
      <Receipt size={20} className="md:w-4 md:h-4" />
    </button>
  );
}
