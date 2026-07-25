'use client';

import { useState, useEffect, useCallback } from 'react';

export type ConsentChoice = 'accepted' | 'rejected' | null;

const STORAGE_KEY = 'gdpr_consent';

function readStoredConsent(): ConsentChoice {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'accepted' || raw === 'rejected') return raw;
  } catch {
    // localStorage unavailable (e.g. private browsing with strict settings)
  }
  return null;
}

function writeConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined' || choice === null) return;
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // ignore
  }
}

export interface UseGdprConsentReturn {
  /** null = not yet decided, banner should be shown */
  consent: ConsentChoice;
  /** Whether the banner should be visible */
  showBanner: boolean;
  accept: () => void;
  reject: () => void;
}

export function useGdprConsent(): UseGdprConsentReturn {
  const [consent, setConsent] = useState<ConsentChoice>(null);

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  const accept = useCallback(() => {
    writeConsent('accepted');
    setConsent('accepted');
  }, []);

  const reject = useCallback(() => {
    writeConsent('rejected');
    setConsent('rejected');
  }, []);

  return {
    consent,
    showBanner: consent === null,
    accept,
    reject,
  };
}
