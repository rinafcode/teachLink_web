import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import CertificateGenerationPage from '../page';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('CertificateGenerationPage', () => {
  it('submits certificate generation data and displays a success message', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ certificateId: 'cert-123' });

    render(<CertificateGenerationPage />);

    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: '123e4567-e89b-12d3-a456-426614174000' },
    });
    fireEvent.change(screen.getByLabelText(/Student Name/i), {
      target: { value: 'Jane Doe' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate certificate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Certificate generated successfully/i)).toBeInTheDocument();
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/certificates/generate', {
      courseId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
    });
  });
});
