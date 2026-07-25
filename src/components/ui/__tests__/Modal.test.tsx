import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Modal, ModalSize } from '../Modal';

vi.mock('@/hooks/useAccessibility', () => ({
  useFocusTrap: () => ({ current: null }),
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

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog').previousElementSibling!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
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
