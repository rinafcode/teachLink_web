'use client';

import { useState, type FormEvent } from 'react';
import { sendTip } from '@/services/tipService';

interface TipFormProps {
  recipient: {
    id: string;
    name: string;
  };
}

export default function TipForm({ recipient }: TipFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [proof, setProof] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid tip amount.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendTip({ recipientId: recipient.id, amount: parsedAmount });
      // `sendTip` extends notarization response which provides `proof` and `recordedAt`
      setProof((result as any).proof ?? null);
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send tip at this time.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900"
        data-testid="success-msg"
        role="status"
      >
        <p>Tip sent successfully! 🎉</p>
        {proof ? <p className="mt-2">Notarization proof: {proof}</p> : null}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} data-testid="tip-form" className="space-y-3">
      <label htmlFor="tip-amount" className="block text-sm font-medium text-gray-700">
        Tip {recipient.name}
      </label>
      <input
        id="tip-amount"
        name="tipAmount"
        type="number"
        inputMode="decimal"
        step="0.001"
        min="0.001"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="0.01"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        data-testid="tip-amount-input"
      />

      {error && (
        <p role="alert" data-testid="tip-error" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="tip-submit"
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading ? 'Sending…' : 'Send Tip'}
      </button>
    </form>
  );
}
