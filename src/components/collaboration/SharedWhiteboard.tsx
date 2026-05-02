'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type CollaborationUser, type WhiteboardStroke, useCollaboration } from '../../hooks/useCollaboration';

interface SharedWhiteboardProps {
  roomId: string;
  user: CollaborationUser;
  websocketUrl?: string;
}

const TOOL_OPTIONS = [
  { id: 'pen', label: 'Pen' },
  { id: 'eraser', label: 'Eraser' },
] as const;

export function SharedWhiteboard({ roomId, user, websocketUrl }: SharedWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCaptureRef = useRef(false);
  const currentStrokeRef = useRef<WhiteboardStroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb');
  const [width, setWidth] = useState(4);

  const { whiteboardStrokes, addWhiteboardStroke, clearWhiteboard } = useCollaboration(roomId, user, websocketUrl);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    const allStrokes = [...whiteboardStrokes];
    if (currentStrokeRef.current) {
      allStrokes.push(currentStrokeRef.current);
    }

    for (const stroke of allStrokes) {
      if (!stroke.path.length) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.path[0].x, stroke.path[0].y);
      for (const point of stroke.path.slice(1)) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whiteboardStrokes]);

  const createStroke = (x: number, y: number) => {
    const stroke: WhiteboardStroke = {
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      color: tool === 'eraser' ? '#ffffff' : color,
      width: tool === 'eraser' ? width * 2 : width,
      path: [{ x, y }],
    };
    currentStrokeRef.current = stroke;
  };

  const pushStroke = () => {
    if (!currentStrokeRef.current) return;
    addWhiteboardStroke(currentStrokeRef.current);
    currentStrokeRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    pointerCaptureRef.current = true;
    const rect = canvas.getBoundingClientRect();
    createStroke(event.clientX - rect.left, event.clientY - rect.top);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerCaptureRef.current || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    currentStrokeRef.current.path.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    drawCanvas();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerCaptureRef.current) return;
    pointerCaptureRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(event.pointerId);
    pushStroke();
  };

  const previewStrokes = useMemo(() => whiteboardStrokes.slice(-3).reverse(), [whiteboardStrokes]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Shared whiteboard</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Draw, annotate, and review ideas together in real time.</p>
        </div>
        <button
          type="button"
          onClick={clearWhiteboard}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear board
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2 pb-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Tool: {tool}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
              Color: <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Stroke: {width}px</span>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="h-[420px] w-full touch-none rounded-3xl bg-white dark:bg-slate-950"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              {TOOL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTool(option.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${tool === option.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Line color
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Brush thickness
              <input
                type="range"
                min={1}
                max={16}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent activity</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Latest strokes from the shared canvas.</p>
            <div className="mt-4 space-y-3">
              {previewStrokes.length ? (
                previewStrokes.map((stroke) => (
                  <div key={stroke.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span>{stroke.userId}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{stroke.path.length} points</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: stroke.color }} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No whiteboard annotations yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
