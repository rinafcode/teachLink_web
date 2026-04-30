'use client';

import { useEffect } from 'react';
import { useInternationalization } from '@/hooks/useInternationalization';

interface LanguageManagerProps {
  /** Syncs lang/dir attributes on the document element (default true). */
  syncDocument?: boolean;
}

export function LanguageManager({ syncDocument = true }: LanguageManagerProps) {
  const { language, direction } = useInternationalization();

  useEffect(() => {
    if (!syncDocument || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.lang = language;
    root.dir = direction;
    root.setAttribute('data-language', language);
    root.setAttribute('data-direction', direction);
  }, [language, direction, syncDocument]);

  return null;
}
