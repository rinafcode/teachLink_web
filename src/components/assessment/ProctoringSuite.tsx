'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shield, Eye, AlertOctagon, Lock, Unlock } from 'lucide-react';

export function ProctoringSuite() {
  const [lockdownActive, setLockdownActive] = useState(false);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [contextMenuAttempts, setContextMenuAttempts] = useState(0);
  const [keyboardFlags, setKeyboardFlags] = useState(0);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        setFocusLossCount((count) => count + 1);
      }
    };

    const handleCopy = () => setCopyAttempts((count) => count + 1);
    const handlePaste = () => setPasteAttempts((count) => count + 1);
    const handleContextMenu = (event: MouseEvent) => {
      if (lockdownActive) {
        event.preventDefault();
      }
      setContextMenuAttempts((count) => count + 1);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const blocked =
        (event.ctrlKey || event.metaKey) &&
        ['c', 'v', 'x', 'a', 's', 'u', 'p'].includes(event.key.toLowerCase());
      if (blocked && lockdownActive) {
        event.preventDefault();
        setKeyboardFlags((count) => count + 1);
      }
      if (event.key === 'F12' && lockdownActive) {
        event.preventDefault();
        setKeyboardFlags((count) => count + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [lockdownActive]);

  useEffect(() => {
    if (!lockdownActive) {
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';
      return;
    }

    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [lockdownActive]);

  const totalFlags = useMemo(
    () => focusLossCount + copyAttempts + pasteAttempts + contextMenuAttempts + keyboardFlags,
    [focusLossCount, copyAttempts, pasteAttempts, contextMenuAttempts, keyboardFlags],
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Proctoring suite
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Browser lockdown, behavior monitoring, and anti-cheating detection tools for high-stakes
            assessments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLockdownActive((active) => !active)}
          className="inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {lockdownActive ? <Unlock size={16} /> : <Lock size={16} />}{' '}
          {lockdownActive ? 'Disable lockdown' : 'Enable lockdown'}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_0.6fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Shield size={18} /> Monitoring dashboard
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="text-sm text-slate-500 dark:text-slate-400">Focus changes</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {focusLossCount}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="text-sm text-slate-500 dark:text-slate-400">Clipboard events</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {copyAttempts + pasteAttempts}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="text-sm text-slate-500 dark:text-slate-400">Context menu blocks</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {contextMenuAttempts}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="text-sm text-slate-500 dark:text-slate-400">Keyboard flags</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {keyboardFlags}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Eye size={18} /> Risk summary
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="text-slate-500 dark:text-slate-400">Total incidents</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {totalFlags}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="font-semibold">Status</div>
              <div
                className={`mt-2 rounded-3xl px-3 py-2 text-sm font-semibold ${
                  lockdownActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {lockdownActive ? 'Locked down' : 'Monitoring ready'}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-4 dark:bg-slate-950">
              <div className="text-slate-500 dark:text-slate-400">Guidance</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                When lockdown is enabled, the browser disables copy/paste and right click to help
                keep assessments secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <AlertOctagon size={18} /> Incident log
        </div>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          <div className="flex items-center justify-between py-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Focus switches</span>
            <span>{focusLossCount}</span>
          </div>
          <div className="flex items-center justify-between py-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Copy attempts</span>
            <span>{copyAttempts}</span>
          </div>
          <div className="flex items-center justify-between py-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Paste attempts</span>
            <span>{pasteAttempts}</span>
          </div>
          <div className="flex items-center justify-between py-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Context menu</span>
            <span>{contextMenuAttempts}</span>
          </div>
          <div className="flex items-center justify-between py-3 text-sm text-slate-600 dark:text-slate-300">
            <span>Keyboard restrictions</span>
            <span>{keyboardFlags}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
