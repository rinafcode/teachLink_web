import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
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
});
