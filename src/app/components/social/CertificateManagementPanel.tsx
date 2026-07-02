'use client';

import { useState } from 'react';
import type { ForumCertificate } from '@/app/hooks/useStudyGroups';

interface CertificateManagementPanelProps {
  certificates: ForumCertificate[];
  onIssue: (input: {
    subjectUserId: string;
    subjectName: string;
    fingerprint: string;
    validFrom: string;
    validUntil: string;
  }) => void;
  onRevoke: (certificateId: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

export default function CertificateManagementPanel({
  certificates,
  onIssue,
  onRevoke,
}: CertificateManagementPanelProps) {
  const [subjectName, setSubjectName] = useState('');
  const [subjectUserId, setSubjectUserId] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [validFrom, setValidFrom] = useState(today());
  const [validUntil, setValidUntil] = useState(tomorrow());
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    try {
      onIssue({
        subjectName,
        subjectUserId,
        fingerprint,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
      });
      setSubjectName('');
      setSubjectUserId('');
      setFingerprint('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to issue certificate.');
    }
  };

  return (
    <section aria-labelledby="certificate-management-heading" className="space-y-5">
      <div>
        <h3
          id="certificate-management-heading"
          className="text-lg font-semibold text-gray-900 dark:text-gray-50"
        >
          Certificate Management
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Issue and revoke SHA-256 fingerprint certificates for trusted forum participation.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subject name
          <input
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Subject user ID
          <input
            value={subjectUserId}
            onChange={(event) => setSubjectUserId(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
          SHA-256 fingerprint
          <input
            value={fingerprint}
            onChange={(event) => setFingerprint(event.target.value)}
            placeholder="64 hex characters"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Valid from
          <input
            type="date"
            value={validFrom}
            onChange={(event) => setValidFrom(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
        </label>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Valid until
          <input
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400 md:col-span-2">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={submit}
          disabled={!subjectName.trim() || !subjectUserId.trim() || !fingerprint.trim()}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:col-span-2"
        >
          Issue certificate
        </button>
      </div>

      <div className="space-y-3" aria-live="polite">
        {certificates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            No forum certificates have been issued for this group.
          </p>
        ) : (
          certificates.map((certificate) => (
            <article
              key={certificate.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-50">
                    {certificate.subjectName}
                  </h4>
                  <p className="mt-1 break-all font-mono text-xs text-gray-500 dark:text-gray-400">
                    {certificate.fingerprint}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Valid until {new Date(certificate.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {certificate.status}
                  </span>
                  {certificate.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => onRevoke(certificate.id)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
