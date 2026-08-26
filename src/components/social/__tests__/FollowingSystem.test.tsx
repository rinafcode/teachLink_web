import React, { Profiler } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FollowingSystem from '../FollowingSystem';
import { apiClient } from '@/lib/api';
import { makeProfilerRecorder } from '@/testing/utils/renderProfiler';
import type { SocialUser } from '../SocialProfile';

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

function makeUsers(count: number): SocialUser[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `u-${i}`,
    name: `User ${i}`,
    followerCount: 0,
    followingCount: 0,
  }));
}

describe('FollowingSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/follow/')) return Promise.resolve({ isFollowing: false });
      return Promise.resolve(makeUsers(20));
    });
  });

  it('only shows the first page of followers', async () => {
    render(<FollowingSystem userId="me" />);
    await waitFor(() => expect(screen.getByText('User 0')).toBeInTheDocument());

    expect(screen.getAllByText(/^User \d+$/)).toHaveLength(15);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.queryByText('User 15')).not.toBeInTheDocument();
  });

  it('navigates to the next page', async () => {
    render(<FollowingSystem userId="me" />);
    await waitFor(() => expect(screen.getByText('User 0')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('User 15')).toBeInTheDocument();
  });

  it('resets to page 1 when switching tabs', async () => {
    render(<FollowingSystem userId="me" />);
    await waitFor(() => expect(screen.getByText('User 0')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'following' }));
    await waitFor(() => expect(screen.getByText('User 0')).toBeInTheDocument());
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('[bench] re-rendering after one user follows stays cheap for a 50-user list', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/follow/')) return Promise.resolve({ isFollowing: false });
      return Promise.resolve(makeUsers(50));
    });

    const recorder = makeProfilerRecorder();
    render(
      <Profiler id="following-list" onRender={recorder.onRender}>
        <FollowingSystem userId="me" />
      </Profiler>,
    );
    await waitFor(() => expect(screen.getByText('User 0')).toBeInTheDocument());
    recorder.reset();

    // Toggling a single row's own follow state (internal to that row's
    // `useFollowUser` hook) should not force the other 49 memoized rows to
    // re-render.
    fireEvent.click(screen.getAllByRole('button', { name: /^follow$/i })[0]);

    // eslint-disable-next-line no-console
    console.info(
      `[bench:FollowingSystem] 1 row follow-toggle / 50 rows -> ${recorder.renderCount()} commit(s), ${recorder
        .totalDuration()
        .toFixed(3)}ms total actualDuration`,
    );
    expect(recorder.totalDuration()).toBeLessThan(200);
  });
});
