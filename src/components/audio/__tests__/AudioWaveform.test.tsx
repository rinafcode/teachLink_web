import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioWaveform } from '../AudioWaveform';

describe('AudioWaveform', () => {
  it('renders a canvas with an accessible label', () => {
    const audioRef = createRef<HTMLAudioElement>();
    render(<AudioWaveform audioRef={audioRef} isPlaying={false} />);

    expect(screen.getByRole('img', { name: 'Audio waveform visualization' })).toBeInTheDocument();
  });

  it('does not throw when the Web Audio API is unavailable (jsdom default)', () => {
    const audioRef = createRef<HTMLAudioElement>();
    expect(() => render(<AudioWaveform audioRef={audioRef} isPlaying />)).not.toThrow();
  });

  it('does not throw when audioRef.current is null', () => {
    const audioRef = { current: null } as React.RefObject<HTMLAudioElement>;
    expect(() => render(<AudioWaveform audioRef={audioRef} isPlaying={false} />)).not.toThrow();
  });

  it('applies a custom className to the canvas', () => {
    const audioRef = createRef<HTMLAudioElement>();
    render(<AudioWaveform audioRef={audioRef} isPlaying={false} className="custom-class" />);

    expect(screen.getByRole('img')).toHaveClass('custom-class');
  });
});
