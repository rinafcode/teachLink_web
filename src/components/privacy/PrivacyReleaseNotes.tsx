'use client';

import { useMemo, useState } from 'react';

export type ReleaseNoteKind =
  | 'added'
  | 'changed'
  | 'fixed'
  | 'security'
  | 'deprecated';

export interface ReleaseNote {
  kind: ReleaseNoteKind;
  text: string;
}

export interface PrivacyRelease {
  version: string;
  /** ISO date the release goes (or went) effective. */
  effectiveAt: string;
  notes: ReleaseNote[];
}

const KIND_LABEL: Record<ReleaseNoteKind, string> = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  security: 'Security',
  deprecated: 'Deprecated',
};

const KIND_COLOR: Record<ReleaseNoteKind, string> = {
  added: 'bg-emerald-100 text-emerald-800',
  changed: 'bg-blue-100 text-blue-800',
  fixed: 'bg-amber-100 text-amber-800',
  security: 'bg-rose-100 text-rose-800',
  deprecated: 'bg-gray-200 text-gray-700',
};

export interface PrivacyReleaseNotesProps {
  notes: PrivacyRelease[];
  /** Initial version expanded; defaults to the latest. */
  initialVersion?: string;
}

function slug(version: string): string {
  return version.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export default function PrivacyReleaseNotes({
  notes,
  initialVersion,
}: PrivacyReleaseNotesProps) {
  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt)),
    [notes],
  );

  const [openVersion, setOpenVersion] = useState<string | null>(
    initialVersion ?? sorted[0]?.version ?? null,
  );

  if (sorted.length === 0) {
    return (
      <p role="status" aria-live="polite">
        No privacy-policy release notes available.
      </p>
    );
  }

  return (
    <section aria-label="Privacy policy release notes">
      <h2>Privacy Policy — Release Notes</h2>
      <ul className="divide-y">
        {sorted.map((release) => {
          const open = openVersion === release.version;
          return (
            <li key={release.version} className="py-3">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`rel-${slug(release.version)}`}
                onClick={() =>
                  setOpenVersion(open ? null : release.version)
                }
                className="w-full text-left"
              >
                <span className="font-medium">v{release.version}</span>{' '}
                <span className="text-sm text-gray-500">
                  — effective {release.effectiveAt}
                </span>
              </button>
              {open ? (
                <ul
                  id={`rel-${slug(release.version)}`}
                  className="mt-2 space-y-2"
                >
                  {release.notes.map((n, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span
                        className={
                          'inline-flex shrink-0 rounded px-2 py-0.5 text-xs font-semibold ' +
                          KIND_COLOR[n.kind]
                        }
                      >
                        {KIND_LABEL[n.kind]}
                      </span>
                      <span>{n.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
