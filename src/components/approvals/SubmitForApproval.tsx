'use client';

import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { PermissionGate } from '@/app/components/auth/PermissionGate';
import { Permission, User } from '@/types/api';
import type { ApprovalItem, SubmitApprovalRequest } from '@/types/api';

interface SubmitForApprovalProps {
  user: User | null | undefined;
  contentId: string;
  contentType: SubmitApprovalRequest['contentType'];
  title: string;
  /** Called after a successful submission */
  onSubmitted?: (item: ApprovalItem) => void;
}

/**
 * Allows non-admin users (instructors) to submit content for admin review.
 * Implements RunAsNonRoot: the action is available without elevated privileges.
 * Admins are not shown this button — they review via ApprovalQueue instead.
 */
export function SubmitForApproval({
  user,
  contentId,
  contentType,
  title,
  onSubmitted,
}: SubmitForApprovalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async () => {
    if (!user) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          title,
          submittedBy: user.id,
        } satisfies SubmitApprovalRequest & { submittedBy: string }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('done');
        onSubmitted?.(json.data);
      } else {
        setErrorMsg(json.message ?? 'Submission failed');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    // Only users with CONTENT_UPLOAD can submit; admins (CONTENT_APPROVE) review instead
    <PermissionGate user={user} permission={Permission.CONTENT_UPLOAD} fallback={null}>
      {/* Hide for admins who have CONTENT_APPROVE — they use ApprovalQueue */}
      <PermissionGate
        user={user}
        permission={Permission.CONTENT_APPROVE}
        fallback={
          <div className="inline-flex flex-col gap-1">
            {status === 'done' ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                Submitted for review
              </span>
            ) : (
              <>
                <button
                  onClick={submit}
                  disabled={status === 'loading'}
                  aria-label={`Submit "${title}" for approval`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {status === 'loading' ? 'Submitting…' : 'Submit for Approval'}
                </button>
                {status === 'error' && (
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {errorMsg}
                  </p>
                )}
              </>
            )}
          </div>
        }
      >
        {/* Admin sees nothing here — they use ApprovalQueue */}
        {null}
      </PermissionGate>
    </PermissionGate>
  );
}
