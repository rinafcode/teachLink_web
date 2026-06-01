import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LeaderboardConference } from '../LeaderboardConference';
import type { LeaderboardEntry, Conference } from '../LeaderboardConference';

// VideoConference uses socket.io and WebRTC — mock it to keep tests focused
vi.mock('@/components/collaboration/VideoConference', () => ({
  VideoConference: ({ roomId }: { roomId: string }) => (
    <div data-testid="video-conference" data-room-id={roomId} />
  ),
}));

const ENTRIES: LeaderboardEntry[] = [
  { id: '1', name: 'Alice', score: 5000, rank: 1 },
  { id: '2', name: 'Bob', score: 4000, rank: 2 },
  { id: '3', name: 'Carol', score: 3000, rank: 3 },
  { id: '4', name: 'Dave', score: 2000, rank: 4 },
];

const CONFERENCES: Conference[] = [
  { id: 'c1', name: 'Study Hall', roomId: 'room-1', participants: 3 },
];

describe('LeaderboardConference', () => {
  describe('Leaderboard section', () => {
    it('renders the leaderboard heading', () => {
      render(<LeaderboardConference entries={ENTRIES} />);
      expect(screen.getByRole('region', { name: /leaderboard/i })).toBeInTheDocument();
    });

    it('renders all entries in rank order', () => {
      render(<LeaderboardConference entries={ENTRIES} />);
      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Alice');
      expect(items[1]).toHaveTextContent('Bob');
      expect(items[2]).toHaveTextContent('Carol');
      expect(items[3]).toHaveTextContent('Dave');
    });

    it('displays formatted scores', () => {
      render(<LeaderboardConference entries={ENTRIES} />);
      expect(screen.getByText('5,000 pts')).toBeInTheDocument();
      expect(screen.getByText('4,000 pts')).toBeInTheDocument();
    });

    it('shows rank number for entries beyond top 3', () => {
      render(<LeaderboardConference entries={ENTRIES} />);
      expect(screen.getByLabelText('Rank 4')).toHaveTextContent('4');
    });

    it('renders default mock entries when none provided', () => {
      render(<LeaderboardConference />);
      expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    });
  });

  describe('Conference management section', () => {
    it('renders the conferences heading', () => {
      render(<LeaderboardConference />);
      expect(screen.getByRole('region', { name: /conference management/i })).toBeInTheDocument();
    });

    it('shows empty state when no conferences', () => {
      render(<LeaderboardConference conferences={[]} />);
      expect(screen.getByText(/no conferences yet/i)).toBeInTheDocument();
    });

    it('renders provided conferences', () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      expect(screen.getByText('Study Hall')).toBeInTheDocument();
    });

    it('toggles create form on New button click', async () => {
      render(<LeaderboardConference conferences={[]} />);
      const newBtn = screen.getByRole('button', { name: /new/i });

      expect(screen.queryByPlaceholderText(/conference name/i)).not.toBeInTheDocument();
      await userEvent.click(newBtn);
      expect(screen.getByPlaceholderText(/conference name/i)).toBeInTheDocument();

      await userEvent.click(newBtn);
      expect(screen.queryByPlaceholderText(/conference name/i)).not.toBeInTheDocument();
    });

    it('creates a new conference', async () => {
      render(<LeaderboardConference conferences={[]} />);
      await userEvent.click(screen.getByRole('button', { name: /new/i }));

      const input = screen.getByPlaceholderText(/conference name/i);
      await userEvent.type(input, 'My Room');
      await userEvent.click(screen.getByRole('button', { name: /^create$/i }));

      expect(screen.getByText('My Room')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/conference name/i)).not.toBeInTheDocument();
    });

    it('creates a conference on Enter key', async () => {
      render(<LeaderboardConference conferences={[]} />);
      await userEvent.click(screen.getByRole('button', { name: /new/i }));

      const input = screen.getByPlaceholderText(/conference name/i);
      await userEvent.type(input, 'Enter Room{Enter}');

      expect(screen.getByText('Enter Room')).toBeInTheDocument();
    });

    it('does not create a conference with empty name', async () => {
      render(<LeaderboardConference conferences={[]} />);
      await userEvent.click(screen.getByRole('button', { name: /new/i }));
      await userEvent.click(screen.getByRole('button', { name: /^create$/i }));

      // Form stays open, no new item added
      expect(screen.getByPlaceholderText(/conference name/i)).toBeInTheDocument();
      expect(screen.getByText(/no conferences yet/i)).toBeInTheDocument();
    });

    it('deletes a conference', async () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      expect(screen.getByText('Study Hall')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /delete conference study hall/i }));
      expect(screen.queryByText('Study Hall')).not.toBeInTheDocument();
    });
  });

  describe('Video conference integration', () => {
    it('does not render VideoConference by default', () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      expect(screen.queryByTestId('video-conference')).not.toBeInTheDocument();
    });

    it('shows VideoConference when a conference is joined', async () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      await userEvent.click(screen.getByRole('button', { name: /^join$/i }));

      const vc = screen.getByTestId('video-conference');
      expect(vc).toBeInTheDocument();
      expect(vc).toHaveAttribute('data-room-id', 'room-1');
    });

    it('hides VideoConference when leaving a conference', async () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      await userEvent.click(screen.getByRole('button', { name: /^join$/i }));
      expect(screen.getByTestId('video-conference')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /^leave$/i }));
      expect(screen.queryByTestId('video-conference')).not.toBeInTheDocument();
    });

    it('hides VideoConference when the active conference is deleted', async () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      await userEvent.click(screen.getByRole('button', { name: /^join$/i }));
      expect(screen.getByTestId('video-conference')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /delete conference study hall/i }));
      expect(screen.queryByTestId('video-conference')).not.toBeInTheDocument();
    });

    it('join button is aria-pressed when conference is active', async () => {
      render(<LeaderboardConference conferences={CONFERENCES} />);
      const joinBtn = screen.getByRole('button', { name: /^join$/i });
      expect(joinBtn).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(joinBtn);
      expect(screen.getByRole('button', { name: /^leave$/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  describe('Keyboard interaction', () => {
    it('New button aria-expanded reflects form visibility', async () => {
      render(<LeaderboardConference conferences={[]} />);
      const newBtn = screen.getByRole('button', { name: /new/i });
      expect(newBtn).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(newBtn);
      expect(newBtn).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
