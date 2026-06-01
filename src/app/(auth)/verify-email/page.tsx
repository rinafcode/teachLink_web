'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@/hooks/useMutation';
import { apiClient } from '@/lib/api';
import { FormError } from '../../../components/forms/FormError';
import { SubmitButton } from '../../../components/forms/SubmitButton';

type VerificationResponse = {
  message: string;
  verification: {
    status: 'pending' | 'verified' | 'already_verified' | 'expired' | 'cooldown' | 'not_found';
  };
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get('email') ?? '', [searchParams]);
  const initialToken = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const initialRestore = useMemo(() => searchParams.get('restore') === '1', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [backupCode, setBackupCode] = useState('');
  const [restoreMode, setRestoreMode] = useState(initialRestore);
  const [statusMessage, setStatusMessage] = useState('');

  const verifyMutation = useMutation(
    async () => apiClient.post<VerificationResponse>('/api/auth/email-verification/verify', { token, email }),
    {
      onSuccess: (data) => setStatusMessage(data.message),
    },
  );

  const resendMutation = useMutation(
    async () => apiClient.post<VerificationResponse>('/api/auth/email-verification/resend', { email }),
    {
      onSuccess: (data) => setStatusMessage(data.message),
    },
  );

  const restoreMutation = useMutation(
    async () =>
      apiClient.post<VerificationResponse>('/api/auth/email-verification/restore', {
        email,
        backupCode,
      }),
    {
      onSuccess: (data) => setStatusMessage(data.message),
    },
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Email verification</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Recover or verify your account</h1>
          <p className="mt-3 text-slate-600">
            Use the verification link, resend a fresh email, or restore access with your backup code.
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => setRestoreMode(false)}
            className={`rounded-lg border px-4 py-2 ${
              !restoreMode ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 text-slate-700'
            }`}
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => setRestoreMode(true)}
            className={`rounded-lg border px-4 py-2 ${
              restoreMode ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 text-slate-700'
            }`}
          >
            Restore
          </button>
        </div>

        {statusMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="you@example.com"
            />
          </div>

          {!restoreMode ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Verification token</label>
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Paste the token from your email"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Backup code</label>
              <input
                value={backupCode}
                onChange={(event) => setBackupCode(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter your backup code"
              />
            </div>
          )}

          <FormError
            error={
              verifyMutation.error?.message ??
              resendMutation.error?.message ??
              restoreMutation.error?.message
            }
            id="verify-email-error"
          />

          {!restoreMode ? (
            <div className="flex flex-col gap-3">
              <SubmitButton
                type="button"
                isLoading={verifyMutation.isLoading}
                loadingText="Verifying…"
                onClick={() => verifyMutation.mutate()}
                className="w-full rounded-lg bg-cyan-600 py-3 font-semibold text-white hover:bg-cyan-700"
              >
                Verify email
              </SubmitButton>
              <SubmitButton
                type="button"
                isLoading={resendMutation.isLoading}
                loadingText="Sending…"
                onClick={() => resendMutation.mutate()}
                className="w-full rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Resend verification email
              </SubmitButton>
            </div>
          ) : (
            <SubmitButton
              type="button"
              isLoading={restoreMutation.isLoading}
              loadingText="Restoring…"
              onClick={() => restoreMutation.mutate()}
              className="w-full rounded-lg bg-cyan-600 py-3 font-semibold text-white hover:bg-cyan-700"
            >
              Restore verification access
            </SubmitButton>
          )}
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Need to go back?{' '}
            <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-700">
              Sign in
            </Link>
          </p>
          <p>
            No account yet?{' '}
            <Link href="/signup" className="font-medium text-cyan-600 hover:text-cyan-700">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

