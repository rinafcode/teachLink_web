import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from '../useFocusTrap';

function FocusTrapHarness() {
  const [open, setOpen] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useFocusTrap<HTMLDivElement>(open, { initialFocusRef });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      {open ? (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Test dialog">
          <button ref={initialFocusRef} type="button">
            First action
          </button>
          <button type="button" onClick={() => setOpen(false)}>
            Close dialog
          </button>
        </div>
      ) : null}
    </>
  );
}

describe('useFocusTrap', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('focuses the requested element, wraps Tab navigation, and restores the opener', () => {
    render(<FocusTrapHarness />);

    const opener = screen.getByRole('button', { name: 'Open dialog' });
    opener.focus();
    fireEvent.click(opener);

    const firstAction = screen.getByRole('button', { name: 'First action' });
    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    expect(document.activeElement).toBe(firstAction);

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(firstAction);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.click(closeButton);
    expect(document.activeElement).toBe(opener);
  });

  it('removes focus trap listeners when the dialog closes', () => {
    render(<FocusTrapHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'focusin',
      expect.any(Function),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', expect.any(Function));
  });
});
