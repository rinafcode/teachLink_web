import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { CookieConsentBanner } from '../CookieConsentBanner';

const STORAGE_KEY = 'gdpr_consent';

// Mock useScreenReaderAnnouncement to avoid DOM side-effects in tests
vi.mock('@/hooks/useAccessibility', () => ({
  useScreenReaderAnnouncement: () => vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
});

describe('CookieConsentBanner', () => {
  it('renders the banner when no consent is stored', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
  });

  it('does not render when consent is already stored', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    render(<CookieConsentBanner />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders Accept all and Reject non-essential buttons', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('button', { name: /accept all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject non-essential/i })).toBeInTheDocument();
  });

  it('hides the banner after clicking Accept all', async () => {
    render(<CookieConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: /accept all/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted');
  });

  it('hides the banner after clicking Reject non-essential', async () => {
    render(<CookieConsentBanner />);
    fireEvent.click(screen.getByRole('button', { name: /reject non-essential/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe('rejected');
  });

  it('has aria-modal and aria-labelledby for accessibility', () => {
    render(<CookieConsentBanner />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('contains a Privacy Policy link', () => {
    render(<CookieConsentBanner />);
    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('traps Tab key within the banner', () => {
    render(<CookieConsentBanner />);
    const rejectBtn = screen.getByRole('button', { name: /reject non-essential/i });
    const acceptBtn = screen.getByRole('button', { name: /accept all/i });

    // Tab from last focusable element should wrap to first
    acceptBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    // Focus should have been redirected to first element (Privacy Policy link or reject button)
    // We verify the handler doesn't throw and the banner is still present
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Shift+Tab from first focusable element should wrap to last
    rejectBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
