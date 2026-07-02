'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RefObject } from 'react';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface AudioEnhancementState {
  enabled: boolean;
  bassBoost: number; // 0-20 dB
  voiceClarity: number; // 0-20 dB
  noiseReduction: number; // 0-1 speech-focused filtering amount
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getAudioContextConstructor = () => {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? window.webkitAudioContext;
};

const setAudioParam = (param: AudioParam, value: number, context: AudioContext) => {
  if (typeof param.setTargetAtTime === 'function') {
    param.setTargetAtTime(value, context.currentTime, 0.015);
    return;
  }

  param.value = value;
};

export function useAudioEnhancement(
  videoRef: RefObject<HTMLVideoElement>,
): UseAudioEnhancementReturn {
  const isSupported = !!getAudioContextConstructor();

  const [state, setState] = useState<AudioEnhancementState>(DEFAULT_STATE);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const voiceFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const connectedRef = useRef(false);

  // Build the audio graph once the video element is available.
  const initGraph = useCallback(() => {
    if (!isSupported || !videoRef.current || connectedRef.current) return;

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return;

    const ctx = new AudioContextConstructor();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaElementSource(videoRef.current);
    sourceRef.current = source;

    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 20;
    highPass.Q.value = 0.7;
    highPassFilterRef.current = highPass;

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 20000;
    lowPass.Q.value = 0.7;
    lowPassFilterRef.current = lowPass;

    // Bass boost: low-shelf filter around 100 Hz.
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 100;
    bass.gain.value = 0;
    bassFilterRef.current = bass;

    // Voice clarity: broad speech presence boost.
    const voice = ctx.createBiquadFilter();
    voice.type = 'peaking';
    voice.frequency.value = 3000;
    voice.Q.value = 1;
    voice.gain.value = 0;
    voiceFilterRef.current = voice;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.18;
    compressorRef.current = compressor;

    const outputGain = ctx.createGain();
    outputGain.gain.value = 1;
    outputGainRef.current = outputGain;

    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(bass);
    bass.connect(voice);
    voice.connect(compressor);
    compressor.connect(outputGain);
    outputGain.connect(ctx.destination);

    connectedRef.current = true;
  }, [isSupported, videoRef]);

  // Apply current state values to the audio nodes.
  const applyState = useCallback((next: AudioEnhancementState) => {
    const context = audioCtxRef.current;
    if (!connectedRef.current || !context) return;

    const bassGain = next.enabled ? next.bassBoost : 0;
    const voiceGain = next.enabled ? next.voiceClarity : 0;
    const noiseReduction = next.enabled ? next.noiseReduction : 0;

    // Trim low rumble and high-frequency hiss without globally lowering volume.
    const highPassFrequency = 20 + noiseReduction * 160;
    const lowPassFrequency = 20000 - noiseReduction * 12400;
    const compressorThreshold = -24 - noiseReduction * 12;
    const outputGain = next.enabled ? 1 + noiseReduction * 0.06 : 1;

    if (highPassFilterRef.current) {
      setAudioParam(highPassFilterRef.current.frequency, highPassFrequency, context);
    }
    if (lowPassFilterRef.current) {
      setAudioParam(lowPassFilterRef.current.frequency, lowPassFrequency, context);
    }
    if (bassFilterRef.current) setAudioParam(bassFilterRef.current.gain, bassGain, context);
    if (voiceFilterRef.current) setAudioParam(voiceFilterRef.current.gain, voiceGain, context);
    if (compressorRef.current) {
      setAudioParam(compressorRef.current.threshold, compressorThreshold, context);
    }
    if (outputGainRef.current) setAudioParam(outputGainRef.current.gain, outputGain, context);
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;
    initGraph();
    // Resume AudioContext if suspended by browser autoplay policy.
    void audioCtxRef.current?.resume();
    setState((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      applyState(next);
      return next;
    });
  }, [isSupported, initGraph, applyState]);

  const setBassBoost = useCallback(
    (value: number) => {
      setState((prev) => {
        const next = { ...prev, bassBoost: clamp(value, 0, 20) };
        applyState(next);
        return next;
      });
    },
    [applyState],
  );

  const setVoiceClarity = useCallback(
    (value: number) => {
      setState((prev) => {
        const next = { ...prev, voiceClarity: clamp(value, 0, 20) };
        applyState(next);
        return next;
      });
    },
    [applyState],
  );

  const setNoiseReduction = useCallback(
    (value: number) => {
      setState((prev) => {
        const next = { ...prev, noiseReduction: clamp(value, 0, 1) };
        applyState(next);
        return next;
      });
    },
    [applyState],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      void audioCtxRef.current?.close();
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
