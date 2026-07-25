import { renderHook, act } from '@testing-library/react';
import { useGdprConsent } from '../useGdprConsent';

const STORAGE_KEY = 'gdpr_consent';

beforeEach(() => {
  localStorage.clear();
});

describe('useGdprConsent', () => {
  it('returns null consent and showBanner=true when no stored value', () => {
    const { result } = renderHook(() => useGdprConsent());
    expect(result.current.consent).toBeNull();
    expect(result.current.showBanner).toBe(true);
  });

  it('reads accepted consent from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    const { result } = renderHook(() => useGdprConsent());
    expect(result.current.consent).toBe('accepted');
    expect(result.current.showBanner).toBe(false);
  });

  it('reads rejected consent from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    const { result } = renderHook(() => useGdprConsent());
    expect(result.current.consent).toBe('rejected');
    expect(result.current.showBanner).toBe(false);
  });

  it('accept() sets consent to accepted and persists to localStorage', () => {
    const { result } = renderHook(() => useGdprConsent());
    act(() => result.current.accept());
    expect(result.current.consent).toBe('accepted');
    expect(result.current.showBanner).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted');
  });

  it('reject() sets consent to rejected and persists to localStorage', () => {
    const { result } = renderHook(() => useGdprConsent());
    act(() => result.current.reject());
    expect(result.current.consent).toBe('rejected');
    expect(result.current.showBanner).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('rejected');
  });

  it('ignores unknown stored values and shows banner', () => {
    localStorage.setItem(STORAGE_KEY, 'unknown_value');
    const { result } = renderHook(() => useGdprConsent());
    expect(result.current.consent).toBeNull();
    expect(result.current.showBanner).toBe(true);
  });
});
