'use client';

import { useEffect, useId, useMemo, useState, type RefObject } from 'react';
import { Settings2, X } from 'lucide-react';
import { useAccessibility, useFocusTrap } from '@/hooks/useAccessibility';

const STORAGE_KEY = 'a11y:settings';

interface AccessibilitySettingsState {
  highContrast: boolean;
  fontScale: number;
  voiceControl: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettingsState = {
  highContrast: false,
  fontScale: 1,
  voiceControl: false,
};

function readSettings(): AccessibilitySettingsState {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettingsState>;
    return {
      highContrast: Boolean(parsed.highContrast),
      fontScale:
        typeof parsed.fontScale === 'number' && parsed.fontScale >= 0.9 && parsed.fontScale <= 1.5
          ? parsed.fontScale
          : DEFAULT_SETTINGS.fontScale,
      voiceControl: Boolean(parsed.voiceControl),
    };
  } catch (_error) {
    return DEFAULT_SETTINGS;
  }
}

function applySettings(settings: AccessibilitySettingsState) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--a11y-font-scale', settings.fontScale.toString());
  root.classList.toggle('a11y-high-contrast', settings.highContrast);
  root.setAttribute('data-a11y-contrast', settings.highContrast ? 'true' : 'false');
}

function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const anyWindow = window as typeof window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition);
}

export function AccessibilitySettings() {
  const { announce } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettingsState>(DEFAULT_SETTINGS);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const titleId = useId();
  const descId = useId();
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    setVoiceSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (!voiceSupported && settings.voiceControl) {
      setSettings((prev) => ({ ...prev, voiceControl: false }));
    }
  }, [voiceSupported, settings.voiceControl]);

  useEffect(() => {
    const next = readSettings();
    setSettings(next);
    applySettings(next);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_error) {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent('a11y:settings-change', {
        detail: settings,
      }),
    );
  }, [settings]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('a11y:open-settings', handleOpen);
    return () => window.removeEventListener('a11y:open-settings', handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const fontPercent = useMemo(() => Math.round(settings.fontScale * 100), [settings.fontScale]);

  const updateSettings = (next: Partial<AccessibilitySettingsState>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  };

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-[9998] flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-offset-gray-950"
        aria-label="Open accessibility settings"
        aria-expanded={open}
        aria-controls="a11y-settings-dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Settings2 size={20} aria-hidden="true" />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[9997] bg-black/30"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <section
            id="a11y-settings-dialog"
            ref={trapRef as RefObject<HTMLElement>}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="fixed bottom-20 right-4 z-[9998] w-[min(calc(100vw-2rem),22rem)] rounded-xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700 dark:bg-gray-900"
          >
            <p id={descId} className="sr-only">
              Customize contrast, text size, and voice control.
            </p>
            <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h2 id={titleId} className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Accessibility settings
              </h2>
              <button
                type="button"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label="Close accessibility settings"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-5 px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">High contrast</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Boost contrast across the interface.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={settings.highContrast}
                    onChange={(event) => {
                      updateSettings({ highContrast: event.target.checked });
                      announce(
                        event.target.checked ? 'High contrast enabled' : 'High contrast disabled',
                      );
                    }}
                  />
                  <span className="text-xs">On</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Font size</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{fontPercent}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={1.3}
                  step={0.05}
                  value={settings.fontScale}
                  aria-label="Font size"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    updateSettings({ fontScale: value });
                  }}
                  onMouseUp={(event) => {
                    const value = Number((event.target as HTMLInputElement).value);
                    announce(`Font size set to ${Math.round(value * 100)} percent`);
                  }}
                  onTouchEnd={(event) => {
                    const value = Number((event.target as HTMLInputElement).value);
                    announce(`Font size set to ${Math.round(value * 100)} percent`);
                  }}
                  className="mt-2 w-full"
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Voice control</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {voiceSupported
                      ? 'Use voice commands to navigate the app.'
                      : 'Voice control is not supported in this browser.'}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={settings.voiceControl && voiceSupported}
                    disabled={!voiceSupported}
                    onChange={(event) => {
                      const next = event.target.checked && voiceSupported;
                      updateSettings({ voiceControl: next });
                      announce(next ? 'Voice control enabled' : 'Voice control disabled');
                    }}
                  />
                  <span className="text-xs">On</span>
                </label>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
