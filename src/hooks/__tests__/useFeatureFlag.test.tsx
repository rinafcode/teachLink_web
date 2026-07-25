import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useFeatureFlag, useAllFeatureFlags } from '../useFeatureFlag';

describe('useFeatureFlag', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads a feature flag evaluation successfully', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ flag: 'flag_new_dashboard', isEnabled: true }),
    }));
    vi.stubGlobal('fetch', mockFetch as any);

    const { result } = renderHook(() => useFeatureFlag('flag_new_dashboard', { userId: 'user-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.flag).toBe('flag_new_dashboard');
    expect(result.current.isEnabled).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/feature-flags/evaluate?id=flag_new_dashboard&userId=user-1',
    );
  });

  it('sets error state when evaluation fails', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    }));
    vi.stubGlobal('fetch', mockFetch as any);

    const { result } = renderHook(() => useFeatureFlag('flag_new_dashboard', { userId: 'user-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.flag).toBeNull();
    expect(result.current.error).toContain('Internal server error');
  });
});

describe('useAllFeatureFlags', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads all feature flags successfully', async () => {
    const mockFlags = [
      { id: 'flag_new_dashboard', name: 'New Dashboard', enabled: true },
      { id: 'flag_video_speed', name: 'Video Speed Controls', enabled: false },
    ];
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ flags: mockFlags }),
    }));
    vi.stubGlobal('fetch', mockFetch as any);

    const { result } = renderHook(() => useAllFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.flags).toEqual(mockFlags);
  });

  it('captures errors when the flags list cannot be loaded', async () => {
    const mockFetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    }));
    vi.stubGlobal('fetch', mockFetch as any);

    const { result } = renderHook(() => useAllFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.flags).toEqual([]);
    expect(result.current.error).toContain('Server error: Not found');
  });
});
