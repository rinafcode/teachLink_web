import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioPlayer } from '../../components/audio/AudioPlayer';

/**
 * Mock HTMLAudioElement to control events.
 */
class MockAudio extends EventTarget {
  public src = '';
  public controls = false;
  public autoplay = false;
  public play = jest.fn(() => Promise.resolve());
}

// @ts-ignore – replace the native constructor globally for the test.
window.HTMLAudioElement = MockAudio as any;

describe('AudioPlayer', () => {
  const mockSrc = 'https://example.com/audio.mp3';

  test('shows loading animation initially', () => {
    render(<AudioPlayer src={mockSrc} />);
    // AccessibleLoading component uses aria-label "Loading audio…"
    expect(screen.getByLabelText('Loading audio…')).toBeInTheDocument();
  });

  test('hides loading when audio can play', async () => {
    render(<AudioPlayer src={mockSrc} />);
    const audio = screen.getByRole('audio');
    // Fire canplay event on the mock audio element.
    fireEvent(audio, new Event('canplay'));
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading audio…')).not.toBeInTheDocument();
    });
  });
});
