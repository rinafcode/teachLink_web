import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import { useAudioEnhancement } from '../useAudioEnhancement';

type MockAudioParam = {
  value: number;
  setTargetAtTime: ReturnType<typeof vi.fn>;
};

type MockAudioNode = {
  connect: ReturnType<typeof vi.fn>;
};

type MockBiquadFilter = MockAudioNode & {
  type: BiquadFilterType;
  frequency: MockAudioParam;
  Q: MockAudioParam;
  gain: MockAudioParam;
};

type MockCompressor = MockAudioNode & {
  threshold: MockAudioParam;
  knee: MockAudioParam;
  ratio: MockAudioParam;
  attack: MockAudioParam;
  release: MockAudioParam;
};

type MockGain = MockAudioNode & {
  gain: MockAudioParam;
};

const createAudioParam = (initialValue = 0): MockAudioParam => ({
  value: initialValue,
  setTargetAtTime: vi.fn(function setTargetAtTime(this: MockAudioParam, value: number) {
    this.value = value;
  }),
});

const createNode = (): MockAudioNode => ({
  connect: vi.fn(),
});

const createBiquadFilter = (): MockBiquadFilter => ({
  ...createNode(),
  type: 'peaking',
  frequency: createAudioParam(),
  Q: createAudioParam(),
  gain: createAudioParam(),
});

const createCompressor = (): MockCompressor => ({
  ...createNode(),
  threshold: createAudioParam(),
  knee: createAudioParam(),
  ratio: createAudioParam(),
  attack: createAudioParam(),
  release: createAudioParam(),
});

const createGain = (): MockGain => ({
  ...createNode(),
  gain: createAudioParam(1),
});

describe('useAudioEnhancement', () => {
  const originalAudioContext = window.AudioContext;
  const originalWebkitAudioContext = window.webkitAudioContext;

  let createdFilters: MockBiquadFilter[];
  let createdCompressors: MockCompressor[];
  let createdGains: MockGain[];
  let resume: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createdFilters = [];
    createdCompressors = [];
    createdGains = [];
    resume = vi.fn(() => Promise.resolve());
    close = vi.fn(() => Promise.resolve());

    class MockAudioContext {
      currentTime = 4;
      destination = createNode();
      resume = resume;
      close = close;

      createMediaElementSource() {
        return createNode();
      }

      createBiquadFilter() {
        const filter = createBiquadFilter();
        createdFilters.push(filter);
        return filter;
      }

      createDynamicsCompressor() {
        const compressor = createCompressor();
        createdCompressors.push(compressor);
        return compressor;
      }

      createGain() {
        const gain = createGain();
        createdGains.push(gain);
        return gain;
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: originalAudioContext,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      writable: true,
      value: originalWebkitAudioContext,
    });
  });

  it('builds a speech-focused enhancement graph when enabled', () => {
    const video = document.createElement('video');
    const videoRef = { current: video } as RefObject<HTMLVideoElement>;
    const { result } = renderHook(() => useAudioEnhancement(videoRef));

    act(() => result.current.toggle());

    expect(result.current.enabled).toBe(true);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(createdFilters.map((filter) => filter.type)).toEqual([
      'highpass',
      'lowpass',
      'lowshelf',
      'peaking',
    ]);
    expect(createdCompressors).toHaveLength(1);
    expect(createdGains).toHaveLength(1);

    expect(createdFilters[0].frequency.value).toBe(68);
    expect(createdFilters[1].frequency.value).toBe(16280);
    expect(createdFilters[2].gain.value).toBe(6);
    expect(createdFilters[3].gain.value).toBe(6);
    expect(createdCompressors[0].threshold.value).toBe(-27.6);
    expect(createdGains[0].gain.value).toBe(1.018);
  });

  it('clamps enhancement controls before applying them', () => {
    const video = document.createElement('video');
    const videoRef = { current: video } as RefObject<HTMLVideoElement>;
    const { result } = renderHook(() => useAudioEnhancement(videoRef));

    act(() => result.current.toggle());
    act(() => {
      result.current.setBassBoost(50);
      result.current.setVoiceClarity(-4);
      result.current.setNoiseReduction(2);
    });

    expect(result.current.bassBoost).toBe(20);
    expect(result.current.voiceClarity).toBe(0);
    expect(result.current.noiseReduction).toBe(1);
    expect(createdFilters[0].frequency.value).toBe(180);
    expect(createdFilters[1].frequency.value).toBe(7600);
    expect(createdFilters[2].gain.value).toBe(20);
    expect(createdFilters[3].gain.value).toBe(0);
  });

  it('does not expose enhancement controls without Web Audio support', () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const videoRef = { current: document.createElement('video') } as RefObject<HTMLVideoElement>;
    const { result } = renderHook(() => useAudioEnhancement(videoRef));

    act(() => result.current.toggle());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.enabled).toBe(false);
    expect(resume).not.toHaveBeenCalled();
  });
});
