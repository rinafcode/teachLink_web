import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Modal, ModalSize } from '../Modal';

vi.mock('@/hooks/useAccessibility', () => ({
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

describe('Modal – focus behaviours', () => {
  it('keeps focus inside the dialog and returns it to the trigger on close', () => {
    const Wrapper = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button id="trigger" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Focus test">
            <button type="button">Last dialog action</button>
          </Modal>
        </>
      );
    };

    render(<Wrapper />);
    const trigger = screen.getByText('Open');
    trigger.focus();
    fireEvent.click(trigger);

    const closeButton = screen.getByLabelText('Close dialog');
    const lastAction = screen.getByRole('button', { name: 'Last dialog action' });
    expect(document.activeElement).toBe(closeButton);

    lastAction.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastAction);

    fireEvent.click(closeButton);
    expect(document.activeElement).toBe(trigger);
  });
});
