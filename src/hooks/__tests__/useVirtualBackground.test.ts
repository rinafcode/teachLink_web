/**
 * useVirtualBackground Hook - Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualBackground } from '../useVirtualBackground';
import { useSettingsStore } from '@/lib/settings/store';

vi.mock('@/lib/settings/store', () => ({
  useSettingsStore: vi.fn(),
}));

const mockedUseSettingsStore = vi.mocked(useSettingsStore);

describe('useVirtualBackground Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct configuration when virtual background is disabled', () => {
    mockedUseSettingsStore.mockImplementation((selector: any) =>
      selector({
        settings: {
          virtualBackgroundEnabled: false,
          virtualBackgroundType: 'none',
          virtualBackgroundImage: '',
          virtualBackgroundBlur: 10,
          virtualBackgroundColor: '#000000',
          version: 3,
          theme: 'system',
          language: 'en',
          notificationsEnabled: true,
          emailNotifications: true,
          prefetchingEnabled: true,
          reducedMotion: false,
          electronicSignatureEnabled: false,
          signatureName: '',
          requireSignatureOnCertificates: false,
        },
      }),
    );

    const { result } = renderHook(() => useVirtualBackground());

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.config.enabled).toBe(false);
    expect(result.current.config.type).toBe('none');
  });

  it('returns correct configuration when virtual background is enabled with image', () => {
    mockedUseSettingsStore.mockImplementation((selector: any) =>
      selector({
        settings: {
          virtualBackgroundEnabled: true,
          virtualBackgroundType: 'image',
          virtualBackgroundImage: 'https://example.com/bg.jpg',
          virtualBackgroundBlur: 10,
          virtualBackgroundColor: '#000000',
          version: 3,
          theme: 'system',
          language: 'en',
          notificationsEnabled: true,
          emailNotifications: true,
          prefetchingEnabled: true,
          reducedMotion: false,
          electronicSignatureEnabled: false,
          signatureName: '',
          requireSignatureOnCertificates: false,
        },
      }),
    );

    const { result } = renderHook(() => useVirtualBackground());

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.config.enabled).toBe(true);
    expect(result.current.config.type).toBe('image');
    expect(result.current.config.imageUrl).toBe('https://example.com/bg.jpg');
  });

  it('returns correct configuration when virtual background is enabled with blur', () => {
    mockedUseSettingsStore.mockImplementation((selector: any) =>
      selector({
        settings: {
          virtualBackgroundEnabled: true,
          virtualBackgroundType: 'blur',
          virtualBackgroundImage: '',
          virtualBackgroundBlur: 25,
          virtualBackgroundColor: '#000000',
          version: 3,
          theme: 'system',
          language: 'en',
          notificationsEnabled: true,
          emailNotifications: true,
          prefetchingEnabled: true,
          reducedMotion: false,
          electronicSignatureEnabled: false,
          signatureName: '',
          requireSignatureOnCertificates: false,
        },
      }),
    );

    const { result } = renderHook(() => useVirtualBackground());

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.config.enabled).toBe(true);
    expect(result.current.config.type).toBe('blur');
    expect(result.current.config.blurIntensity).toBe(25);
  });

  it('returns correct configuration when virtual background is enabled with color', () => {
    mockedUseSettingsStore.mockImplementation((selector: any) =>
      selector({
        settings: {
          virtualBackgroundEnabled: true,
          virtualBackgroundType: 'color',
          virtualBackgroundImage: '',
          virtualBackgroundBlur: 10,
          virtualBackgroundColor: '#FF5733',
          version: 3,
          theme: 'system',
          language: 'en',
          notificationsEnabled: true,
          emailNotifications: true,
          prefetchingEnabled: true,
          reducedMotion: false,
          electronicSignatureEnabled: false,
          signatureName: '',
          requireSignatureOnCertificates: false,
        },
      }),
    );

    const { result } = renderHook(() => useVirtualBackground());

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.config.enabled).toBe(true);
    expect(result.current.config.type).toBe('color');
    expect(result.current.config.backgroundColor).toBe('#FF5733');
  });
});
