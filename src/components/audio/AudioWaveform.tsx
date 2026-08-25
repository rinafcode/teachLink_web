import React, { useEffect, useRef } from 'react';

export interface AudioWaveformProps {
  /** Ref to the <audio> element to visualize. */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Whether the audio is currently playing – drives the animation loop. */
  isPlaying: boolean;
  /** Number of bars rendered across the canvas width. */
  barCount?: number;
  /** Bar fill color (any valid canvas fillStyle). */
  barColor?: string;
  /** Additional class names for the canvas element. */
  className?: string;
}

/**
 * AudioWaveform – draws a live frequency-bar visualization for an <audio> element
 * using the Web Audio API's AnalyserNode. Falls back to an empty canvas when the
 * Web Audio API is unavailable (e.g. unsupported browsers or non-DOM test
 * environments) instead of throwing.
 */
export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioRef,
  isPlaying,
  barCount = 32,
  barColor = '#4f46e5',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Lazily set up the AudioContext/AnalyserNode graph once per audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || analyserRef.current) return;

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch {
      // The element may already be attached to another AudioContext, or the
      // browser may block AudioContext creation before a user gesture.
      analyserRef.current = null;
    }

    return () => {
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [audioRef]);

  // Draw loop – only runs while playing and the analyser graph is ready.
  useEffect(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!isPlaying || !analyser || !canvas || !ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const step = Math.max(1, Math.floor(bufferLength / barCount));

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = barColor;

      const barWidth = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] ?? 0;
        const barHeight = Math.max(2, (value / 255) * height);
        ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.7, barHeight);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, barCount, barColor]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Audio waveform visualization"
      width={320}
      height={48}
      className={`w-full h-12 ${className}`}
    />
  );
};
