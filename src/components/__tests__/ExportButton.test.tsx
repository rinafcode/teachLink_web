import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportButton } from '../ExportButton';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('ExportButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables the button when templateId is empty or whitespace', () => {
    const { rerender } = render(<ExportButton templateId="" label="Export Data" />);
    const button = screen.getByRole('button', { name: 'Export Data' });
    expect(button).toBeDisabled();

    rerender(<ExportButton templateId="   " label="Export Data" />);
    expect(button).toBeDisabled();
  });

  it('enables the button when valid templateId is provided', () => {
    render(<ExportButton templateId="template-123" label="Export Data" />);
    const button = screen.getByRole('button', { name: 'Export Data' });
    expect(button).not.toBeDisabled();
  });

  it('handles error state properly and displays red error text and failed stage', async () => {
    const onError = vi.fn();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Server Error: Failed to execute export'),
    );

    render(<ExportButton templateId="template-123" onError={onError} />);

    const button = screen.getByRole('button', { name: 'Run Export' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText('Server Error: Failed to execute export').length).toBeGreaterThan(0);
    });

    const errorMessage = screen.getAllByText('Server Error: Failed to execute export')[1];
    expect(errorMessage).toHaveClass('text-red-600');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles successful export flow', async () => {
    const onComplete = vi.fn();
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      result: {
        success: true,
        fileName: 'report.csv',
        fileSize: 2048,
        contentType: 'text/csv',
        rowCount: 50,
        progress: [{ stage: 'completed', percent: 100, message: 'Done' }],
      },
    });

    render(<ExportButton templateId="template-123" onComplete={onComplete} />);

    const button = screen.getByRole('button', { name: 'Run Export' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/report\.csv ready/i)).toBeInTheDocument();
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'report.csv',
        rowCount: 50,
      }),
    );
  });
});
