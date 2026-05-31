'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RefObject } from 'react';

export interface AudioEnhancementState {
  enabled: boolean;
  bassBoost: number;   // 0–20 dB
  voiceClarity: number; // 0–20 dB
  noiseReduction: number; // 0–1 (gain reduction)
}

export interface UseAudioEnhancementReturn extends AudioEnhancementState {
  toggle: () => void;
  setBassBoost: (value: number) => void;
  setVoiceClarity: (value: number) => void;
  setNoiseReduction: (value: number) => void;
  isSupported: boolean;
}

const DEFAULT_STATE: AudioEnhancementState = {
  enabled: false,
  bassBoost: 6,
  voiceClarity: 6,
  noiseReduction: 0.3,
};

export function useAudioEnhancement(
  videoRef: RefObject<HTMLVideoElement>,
): UseAudioEnhancementReturn {
  const isSupported = typeof window !== 'undefined' && 'AudioContext' in window;

  const [state, setState] = useState<AudioEnhancementState>(DEFAULT_STATE);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const connectedRef = useRef(false);

  // Build the audio graph once the video element is available.
  const initGraph = useCallback(() => {
    if (!isSupported || !videoRef.current || connectedRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaElementSource(videoRef.current);
    sourceRef.current = source;

    // Bass boost — low-shelf filter around 100 Hz
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 100;
    bass.gain.value = 0; // off by default
    bassFilterRef.current = bass;

    // Voice clarity — peaking filter around 3 kHz
    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 3000;
    mid.Q.value = 1;
    mid.gain.value = 0; // off by default
    midFilterRef.current = mid;

    // Noise reduction approximated via a gain node (subtle attenuation)
    const gain = ctx.createGain();
    gain.gain.value = 1; // off by default
    gainRef.current = gain;

    source.connect(bass);
    bass.connect(mid);
    mid.connect(gain);
    gain.connect(ctx.destination);

    connectedRef.current = true;
  }, [isSupported, videoRef]);

  // Apply current state values to the audio nodes.
  const applyState = useCallback((next: AudioEnhancementState) => {
    if (!connectedRef.current) return;

    const bassGain = next.enabled ? next.bassBoost : 0;
    const midGain = next.enabled ? next.voiceClarity : 0;
    // Noise reduction: reduce gain slightly when enabled
    const gainValue = next.enabled ? 1 - next.noiseReduction * 0.2 : 1;

    if (bassFilterRef.current) bassFilterRef.current.gain.value = bassGain;
    if (midFilterRef.current) midFilterRef.current.gain.value = midGain;
    if (gainRef.current) gainRef.current.gain.value = gainValue;
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;
    initGraph();
    // Resume AudioContext if suspended (browser autoplay policy)
    audioCtxRef.current?.resume();
    setState((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      applyState(next);
      return next;
    });
  }, [isSupported, initGraph, applyState]);

  const setBassBoost = useCallback(
    (value: number) => {
      setState((prev) => {
        const next = { ...prev, bassBoost: value };
        applyState(next);
        return next;
      });
    },
    [applyState],
  );

  const setVoiceClarity = useCallback(
    (value: number) => {
      setState((prev) => {
        const next = { ...prev, voiceClarity: value };
        applyState(next);
        return next;
      });
    },
    [applyState],
  );

  const setNoiseReduction = useCallback(
    (value: number) => {
      setState((prev) => {
        const next = { ...prev, noiseReduction: value };
        applyState(next);
        return next;
      });
    },
    [applyState],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      connectedRef.current = false;
    };
  }, []);

  return {
    ...state,
    toggle,
    setBassBoost,
    setVoiceClarity,
    setNoiseReduction,
    isSupported,
  };
}
