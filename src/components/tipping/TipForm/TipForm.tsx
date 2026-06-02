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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-5 w-5" />
          Tip sent successfully!
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Your support for {recipient.name} has been routed through the{' '}
          <strong>{selectedGroup.name}</strong> interest group.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="tip-form"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <Gift className="h-5 w-5 text-sky-500" />
          <span>Tip {recipient.name}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose a special interest group so your tip supports the right community and content
          category.
        </p>
      </div>

      <div className="grid gap-3">
        <label
          className="text-sm font-medium text-slate-800 dark:text-slate-200"
          htmlFor="tip-group"
        >
          Special Interest Group
        </label>
        <select
          id="tip-group"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
          value={selectedGroupId}
          onChange={(event) => setSelectedGroupId(event.target.value)}
          aria-describedby="tip-group-description"
          data-testid="tip-group-select"
        >
          {availableGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <p id="tip-group-description" className="text-xs text-slate-500 dark:text-slate-400">
          {selectedGroup.description}
        </p>
      </div>

      <div className="grid gap-3">
        <label
          className="text-sm font-medium text-slate-800 dark:text-slate-200"
          htmlFor="tip-amount"
        >
          Amount (ETH)
        </label>
        <input
          id="tip-amount"
          name="tip-amount"
          type="number"
          inputMode="decimal"
          step="0.001"
          min="0.001"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.01"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
          data-testid="tip-amount-input"
        />
      </div>

      {error ? (
        <p
          role="alert"
          data-testid="tip-error"
          className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-200"
        >
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
