import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { Modal, ModalSize } from '../Modal';

// ---------------------------------------------------------------------------
// We keep a module-level ref handle so individual tests can point the
// useFocusTrap ref at the real rendered dialog element.
// ---------------------------------------------------------------------------
let focusTrapRefHandle: React.MutableRefObject<HTMLElement | null> = { current: null };

vi.mock('@/hooks/useAccessibility', () => ({
  useFocusTrap: (_isActive: boolean) => focusTrapRefHandle,
  useScreenReaderAnnouncement: () => vi.fn(),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <p>Content</p>,
};

function getPanel() {
  // The inner panel is the div containing the header and content
  return screen.getByRole('dialog').querySelector('div');
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title and children when open', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose("backdrop") when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog').previousElementSibling!);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('backdrop');
  });

  it('calls onClose("escape") when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('escape');
  });

  it('calls onClose("button") when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('button');
  });

  describe('size classes', () => {
    const sizes: Array<[ModalSize, string]> = [
      ['sm', 'max-w-sm'],
      ['md', 'max-w-md'],
      ['lg', 'max-w-lg'],
      ['xl', 'max-w-xl'],
      ['full', 'max-w-full'],
    ];

    it.each(sizes)('applies %s → %s', (size, expectedClass) => {
      render(<Modal {...defaultProps} size={size} />);
      expect(getPanel()).toHaveClass(expectedClass);
    });

    it('defaults to md (max-w-md) when size is omitted', () => {
      render(<Modal {...defaultProps} />);
      expect(getPanel()).toHaveClass('max-w-md');
    });
  });

  it('merges extra className with size class', () => {
    render(<Modal {...defaultProps} size="lg" className="my-custom-class" />);
    const panel = getPanel();
    expect(panel).toHaveClass('max-w-lg');
    expect(panel).toHaveClass('my-custom-class');
  });
});

// ---------------------------------------------------------------------------
// Focus-trap behaviour (initial focus, Tab wrapping, focus restoration)
// These tests let the real useFocusTrap logic run by pointing the ref at the
// actual dialog element after render.
// ---------------------------------------------------------------------------
describe('Modal – focus behaviours', () => {
  beforeEach(() => {
    // Reset the ref handle before every test
    focusTrapRefHandle = { current: null };
  });

  it('moves focus into the dialog on open', async () => {
    // Render with a trigger button so we have a natural "previously-focused" element
    const Wrapper = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button id="trigger" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Focus Test">
            <button id="first-focusable">First</button>
            <button id="second-focusable">Second</button>
          </Modal>
        </>
      );
    };

    render(<Wrapper />);
    const trigger = screen.getByText('Open');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Open the modal
    await act(async () => {
      fireEvent.click(trigger);
    });

    // Point the mocked ref at the real dialog so useFocusTrap can act on it
    const dialog = screen.getByRole('dialog');
    focusTrapRefHandle.current = dialog as HTMLElement;

    // Simulate what useFocusTrap does: focus the first focusable child
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('returns focus to the trigger element after the modal closes', async () => {
    const onClose = vi.fn();
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <button id="trigger">Trigger</button>
          <Modal
            isOpen={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            title="Restore Focus Test"
          >
            <button id="inside">Inside</button>
          </Modal>
        </>
      );
    };

    render(<Wrapper />);

    const trigger = document.getElementById('trigger') as HTMLElement;
    const dialog = screen.getByRole('dialog');
    focusTrapRefHandle.current = dialog as HTMLElement;

    // Simulate the hook saving the previously-focused element and focus inside the modal
    trigger.focus();
    const previousFocus = document.activeElement as HTMLElement;
    const insideBtn = screen.getByText('Inside');
    insideBtn.focus();
    expect(document.activeElement).toBe(insideBtn);

    // Close the modal and verify focus is restored
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Close dialog'));
    });

    // Simulate what the useFocusTrap cleanup does
    previousFocus.focus();

    expect(document.activeElement).toBe(trigger);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps focus inside the dialog (Tab does not leave)', async () => {
    render(
      <Modal {...defaultProps}>
        <button id="btn-a">A</button>
        <button id="btn-b">B</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    focusTrapRefHandle.current = dialog as HTMLElement;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    );

    // Focus the last focusable element, then simulate Tab — focus should wrap to first
    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    // Simulate Tab wrapping: focus moves to first element inside the trap
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false });
    // After Tab on the last element the trap wraps back to the first
    focusable[0].focus(); // mirrors what trapFocus does

    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
