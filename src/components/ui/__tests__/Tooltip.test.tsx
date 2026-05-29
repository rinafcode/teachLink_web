/**
 * Unit tests for Tooltip component and useTooltipAnomalyDetection hook
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from '../Tooltip';
import { useTooltipAnomalyDetection } from '../../../hooks/useTooltipAnomalyDetection';
import { renderHook } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Tooltip component tests
// ---------------------------------------------------------------------------

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders children without tooltip initially', () => {
    render(
      <Tooltip content="Hello">
        <button>trigger</button>
      </Tooltip>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip after delay on mouseenter', () => {
    render(
      <Tooltip content="Hello" delayMs={200}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).toBeNull();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Hello');
  });

  it('hides tooltip on mouseleave', () => {
    render(
      <Tooltip content="Hello" delayMs={0}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip on focus and hides on blur', () => {
    render(
      <Tooltip content="Focus tip" delayMs={0}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.focus(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('does not show tooltip when disabled', () => {
    render(
      <Tooltip content="Hidden" disabled delayMs={0}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(0));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('sets aria-describedby on trigger when visible', () => {
    render(
      <Tooltip content="Aria tip" delayMs={0}>
        <button>trigger</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    act(() => vi.advanceTimersByTime(0));
    const btn = screen.getByRole('button');
    const tooltip = screen.getByRole('tooltip');
    expect(btn.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('calls onAnomaly after rapid toggles', () => {
    const onAnomaly = vi.fn();
    render(
      <Tooltip content="Rapid" delayMs={0} onAnomaly={onAnomaly}>
        <button>trigger</button>
      </Tooltip>
    );
    const btn = screen.getByRole('button');
    // Open 6 times quickly
    for (let i = 0; i < 6; i++) {
      fireEvent.mouseEnter(btn);
      act(() => vi.advanceTimersByTime(0));
      fireEvent.mouseLeave(btn);
    }
    expect(onAnomaly).toHaveBeenCalledWith('rapid-toggle');
  });
});

// ---------------------------------------------------------------------------
// useTooltipAnomalyDetection hook tests
// ---------------------------------------------------------------------------

describe('useTooltipAnomalyDetection', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with no anomalies', () => {
    const { result } = renderHook(() => useTooltipAnomalyDetection());
    expect(result.current.anomalies).toHaveLength(0);
  });

  it('detects rapid-toggle anomaly', () => {
    const onAnomaly = vi.fn();
    const { result } = renderHook(() =>
      useTooltipAnomalyDetection({ rapidToggleThreshold: 3, rapidToggleWindowMs: 3000, onAnomaly })
    );
    act(() => {
      for (let i = 0; i < 4; i++) result.current.onOpen('tip1');
    });
    expect(onAnomaly).toHaveBeenCalledWith(expect.objectContaining({ type: 'rapid-toggle', tooltipId: 'tip1' }));
  });

  it('detects long-hover anomaly', () => {
    const onAnomaly = vi.fn();
    const { result } = renderHook(() =>
      useTooltipAnomalyDetection({ longHoverThresholdMs: 5000, onAnomaly })
    );
    act(() => result.current.onOpen('tip2'));
    act(() => vi.advanceTimersByTime(5000));
    expect(onAnomaly).toHaveBeenCalledWith(expect.objectContaining({ type: 'long-hover', tooltipId: 'tip2' }));
  });

  it('cancels long-hover timer on close', () => {
    const onAnomaly = vi.fn();
    const { result } = renderHook(() =>
      useTooltipAnomalyDetection({ longHoverThresholdMs: 5000, onAnomaly })
    );
    act(() => result.current.onOpen('tip3'));
    act(() => result.current.onClose('tip3'));
    act(() => vi.advanceTimersByTime(5000));
    expect(onAnomaly).not.toHaveBeenCalled();
  });

  it('detects multi-open anomaly', () => {
    const onAnomaly = vi.fn();
    const { result } = renderHook(() =>
      useTooltipAnomalyDetection({ multiOpenThreshold: 2, onAnomaly })
    );
    act(() => {
      result.current.onOpen('a');
      result.current.onOpen('b');
      result.current.onOpen('c'); // exceeds threshold of 2
    });
    expect(onAnomaly).toHaveBeenCalledWith(expect.objectContaining({ type: 'multi-open' }));
  });

  it('clearAnomalies resets the log', () => {
    const { result } = renderHook(() =>
      useTooltipAnomalyDetection({ rapidToggleThreshold: 2, rapidToggleWindowMs: 3000 })
    );
    act(() => {
      result.current.onOpen('x');
      result.current.onOpen('x');
      result.current.onOpen('x');
    });
    expect(result.current.anomalies.length).toBeGreaterThan(0);
    act(() => result.current.clearAnomalies());
    expect(result.current.anomalies).toHaveLength(0);
  });
});
