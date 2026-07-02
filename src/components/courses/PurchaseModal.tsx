'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PricingOption {
  id: string;
  title: string;
  price: number;
  features: string[];
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  selectedOption: PricingOption | null;
  onSuccess: (optionId: string) => void;
}

export function PurchaseModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  selectedOption,
  onSuccess,
}: PurchaseModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!selectedOption) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedOption.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Enrollment failed. Please try again.');
      }

      toast.success('Enrollment successful! Welcome to the course.');
      onSuccess(selectedOption.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!selectedOption) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Enrollment" className="max-w-sm">
      <div className="space-y-5">
        {/* Order summary */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
          <p className="font-medium text-gray-900 dark:text-gray-100 leading-snug">{courseTitle}</p>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{selectedOption.title}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ${selectedOption.price.toFixed(2)}
            </span>
          </div>

          <ul className="space-y-1.5 pt-1">
            {selectedOption.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
          <span>Total</span>
          <span className="text-xl text-blue-600 dark:text-blue-400">
            ${selectedOption.price.toFixed(2)}
          </span>
        </div>

        {/* Guarantee note */}
        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <ShieldCheck size={14} className="text-green-500 shrink-0" />
          30-day money-back guarantee
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Processing…' : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
