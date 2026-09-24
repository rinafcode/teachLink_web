import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CookieConsentBanner } from '../CookieConsentBanner';
import { useConsentStore } from '@/lib/consent/store';
import { createDefaultConsentState } from '@/lib/consent/types';
import { clearStorageClassRegistry, setClassifiedItem } from '@/lib/consent/storageClasses';

beforeEach(() => {
  localStorage.clear();
  useConsentStore.setState(createDefaultConsentState());
  clearStorageClassRegistry();
});

describe('CookieConsentBanner storage class enforcement', () => {
  it('purges storage for a category that was revoked before the banner mounted', () => {
    useConsentStore.getState().acceptAll();
    setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, '123');
    useConsentStore.getState().rejectAll();
    expect(localStorage.getItem('ga_client_id')).toBe('123');

    render(<CookieConsentBanner />);

    expect(localStorage.getItem('ga_client_id')).toBeNull();
  });

  it('still renders the banner normally while enforcing storage classes', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('region', { name: /cookie consent/i })).toBeInTheDocument();
  });
});
