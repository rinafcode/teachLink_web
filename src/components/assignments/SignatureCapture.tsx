'use client';

/**
 * Assignment System: Electronic Signature (#420).
 *
 * Canvas-based signature capture suitable for assignment submission. Captures
 * pointer strokes (mouse + touch) and exposes a base64 PNG data URL via a
 * consumer-supplied `onChange` callback. Includes Clear and Accept actions,
 * a typed-name fallback when canvas is unavailable, and accessibility wiring.
 */

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';

export interface SignatureCaptureHandle {
  clear: () => void;
  toDataURL: () => string | null;
}

export interface SignatureCaptureProps {
  width?: number;
  height?: number;
  /** Called whenever the captured signature changes. */
  onChange?: (dataUrl: string | null) => void;
  /** Approval-required — when true, accept button must be pressed to commit. */
  requireAccept?: boolean;
  ariaLabel?: string;
}

export const SignatureCapture = forwardRef<SignatureCaptureHandle, SignatureCaptureProps>(
  function SignatureCapture(
    { width = 480, height = 160, onChange, requireAccept = true, ariaLabel = 'Signature canvas' },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingRef = useRef(false);
    const [hasStrokes, setHasStrokes] = useState(false);
    const [accepted, setAccepted] = useState(!requireAccept);
    const [fallbackName, setFallbackName] = useState('');
    const [hasCanvas, setHasCanvas] = useState(true);

    useEffect(() => {
      if (typeof HTMLCanvasElement === 'undefined') {
        setHasCanvas(false);
      }
    }, []);

    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const getCtx = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return null;
      if (!ctxRef.current) {
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#111';
          ctxRef.current = ctx;
        }
      }
      return ctxRef.current;
    }, []);

    const point = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const c = canvasRef.current;
      if (!c) return null;
      const rect = c.getBoundingClientRect();
      if ('touches' in e) {
        const t = e.touches[0] ?? e.changedTouches[0];
        return {
          x: (t.clientX - rect.left) * (c.width / rect.width),
          y: (t.clientY - rect.top) * (c.height / rect.height),
        };
      }
      return {
        x: (e.clientX - rect.left) * (c.width / rect.width),
        y: (e.clientY - rect.top) * (c.height / rect.height),
      };
    };

    const begin = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        const p = point(e);
        const ctx = getCtx();
        if (!p || !ctx) return;
        drawingRef.current = true;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      },
      [getCtx],
    );

    const move = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawingRef.current) return;
        const p = point(e);
        const ctx = getCtx();
        if (!p || !ctx) return;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      },
      [getCtx],
    );

    const end = useCallback(() => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      setHasStrokes(true);
      const url = canvasRef.current?.toDataURL('image/png') ?? null;
      onChange?.(url);
    }, [onChange]);

    const clear = useCallback(() => {
      const c = canvasRef.current;
      const ctx = getCtx();
      if (c && ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
      }
      setHasStrokes(false);
      setAccepted(!requireAccept);
      onChange?.(null);
    }, [getCtx, onChange, requireAccept]);

    const toDataURL = useCallback(() => {
      return canvasRef.current?.toDataURL('image/png') ?? null;
    }, []);

    useImperativeHandle(ref, () => ({ clear, toDataURL }), [clear, toDataURL]);

    const handleAccept = useCallback(() => {
      setAccepted(true);
      onChange?.(canvasRef.current?.toDataURL('image/png') ?? null);
    }, [onChange]);

    if (!hasCanvas) {
      return (
        <div className="signature-fallback">
          <label>
            Typed signature
            <input
              type="text"
              value={fallbackName}
              placeholder="Type your full name"
              onChange={(e) => {
                setFallbackName(e.target.value);
                onChange?.(e.target.value ? `text:${e.target.value}` : null);
              }}
            />
          </label>
        </div>
      );
    }

    return (
      <div className="signature-capture">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          aria-label={ariaLabel}
          role="img"
          onMouseDown={begin}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={begin}
          onTouchMove={move}
          onTouchEnd={end}
          style={{
            touchAction: 'none',
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            width: '100%',
            maxWidth: width,
          }}
        />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={clear}>
            Clear
          </button>
          {requireAccept ? (
            <button type="button" disabled={!hasStrokes || accepted} onClick={handleAccept}>
              {accepted ? 'Accepted' : 'Accept signature'}
            </button>
          ) : null}
          {!hasStrokes ? (
            <span role="status" aria-live="polite" className="text-sm text-gray-500">
              Sign in the box above.
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);

export default SignatureCapture;
