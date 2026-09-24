import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts, type ShortcutCommand } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const keydownListeners = new Set<EventListenerOrEventListenerObject>();
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        ((
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: AddEventListenerOptions | boolean,
        ) => {
          if (type === 'keydown') {
            keydownListeners.add(listener);
          }

          EventTarget.prototype.addEventListener.call(document, type, listener, options);
        }) as typeof document.addEventListener,
      );

    removeEventListenerSpy = vi
      .spyOn(document, 'removeEventListener')
      .mockImplementation(
        ((
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: EventListenerOptions | boolean,
        ) => {
          if (type === 'keydown') {
            keydownListeners.delete(listener);
          }

          EventTarget.prototype.removeEventListener.call(document, type, listener, options);
        }) as typeof document.removeEventListener,
      );
  });

  afterEach(() => {
    keydownListeners.clear();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('removes the keyboard listener on unmount and does not duplicate handlers after remount', () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    const firstCommands: ShortcutCommand[] = [
      {
        id: 'openCommandPalette',
        title: 'Open command palette',
        description: 'Opens the command palette',
        run: firstHandler,
      },
    ];

    const secondCommands: ShortcutCommand[] = [
      {
        id: 'openCommandPalette',
        title: 'Open command palette',
        description: 'Opens the command palette',
        run: secondHandler,
      },
    ];

    const firstRender = renderHook(({ commands }) => useKeyboardShortcuts(commands), {
      initialProps: { commands: firstCommands },
    });

    expect(keydownListeners.size).toBe(1);
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    expect(firstHandler).toHaveBeenCalledTimes(1);

    firstRender.unmount();

    expect(keydownListeners.size).toBe(0);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    renderHook(({ commands }) => useKeyboardShortcuts(commands), {
      initialProps: { commands: secondCommands },
    });

    expect(keydownListeners.size).toBe(1);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });
});
