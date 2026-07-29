import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ModalFeedbackLoop } from '../ModalFeedbackLoop';

vi.mock('@/hooks/useAccessibility', () => ({
  useFocusTrap: () => ({ current: null }),
  useScreenReaderAnnouncement: () => vi.fn(),
}));

function setup(overrides: Partial<React.ComponentProps<typeof ModalFeedbackLoop<{ id: string }>>> = {}) {
  const onClose = vi.fn();
  const onFeedback = vi.fn().mockResolvedValue(undefined);
  render(
    <ModalFeedbackLoop
      isOpen
      title="Primary modal"
      modalData={{ id: 'abc' }}
      onFeedback={onFeedback}
      onClose={onClose}
      {...overrides}
    >
      <p>Primary content</p>
    </ModalFeedbackLoop>
  );
  return { onClose, onFeedback };
}

describe('ModalFeedbackLoop', () => {
  it('closes the whole flow on Escape, without showing the feedback prompt', () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('How was that experience?')).not.toBeInTheDocument();
  });

  it('closes the whole flow on backdrop click, without showing the feedback prompt', () => {
    const { onClose } = setup();
    const backdrop = screen.getByRole('dialog').previousElementSibling!;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('How was that experience?')).not.toBeInTheDocument();
  });

  it('still advances to the feedback prompt on explicit close (X button)', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByLabelText('Close dialog'));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('How was that experience?')).toBeInTheDocument();
  });

  it('lets the user skip the feedback prompt, which closes the flow', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByLabelText('Close dialog'));
    fireEvent.click(screen.getByText('Skip'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends feedback then closes the flow', async () => {
    const { onClose, onFeedback } = setup();
    fireEvent.click(screen.getByLabelText('Close dialog'));
    fireEvent.click(screen.getByLabelText('5 of 5'));
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() =>
      expect(onFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 5, sourceData: { id: 'abc' } })
      )
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 2000 });
  });
});