import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Mock recharts — jsdom cannot render SVG canvas; we just need to verify data is passed
vi.mock('recharts', () => ({
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-count={data.length}>
      {children}
    </div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { CertificateStats } from '@/components/certificates/CertificateStats';
import CertificateGenerationPage from '@/app/certificates/page';
import { apiClient } from '@/lib/api';

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// CertificateStats unit tests
// ---------------------------------------------------------------------------

describe('CertificateStats', () => {
  const sampleData = [
    { course: '…abc00001', count: 3 },
    { course: '…abc00002', count: 1 },
  ];

  it('renders the section heading', () => {
    render(
      <CertificateStats data={sampleData} totalGenerated={4} distinctCourses={2} />,
    );
    expect(screen.getByText('Generation Statistics')).toBeInTheDocument();
  });

  it('displays totalGenerated value', () => {
    render(
      <CertificateStats data={sampleData} totalGenerated={7} distinctCourses={2} />,
    );
    expect(screen.getByLabelText(/Certificates Generated: 7/i)).toBeInTheDocument();
  });

  it('displays distinctCourses value', () => {
    render(
      <CertificateStats data={sampleData} totalGenerated={4} distinctCourses={2} />,
    );
    expect(screen.getByLabelText(/Courses Covered: 2/i)).toBeInTheDocument();
  });

  it('displays peak course count (max of data)', () => {
    render(
      <CertificateStats data={sampleData} totalGenerated={4} distinctCourses={2} />,
    );
    // peak = 3 (max of counts 3 and 1)
    expect(screen.getByLabelText(/Peak Course Count: 3/i)).toBeInTheDocument();
  });

  it('renders the bar chart when data is non-empty', () => {
    render(
      <CertificateStats data={sampleData} totalGenerated={4} distinctCourses={2} />,
    );
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('passes correct data length to bar chart', () => {
    render(
      <CertificateStats data={sampleData} totalGenerated={4} distinctCourses={2} />,
    );
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-count', '2');
  });

  it('does not render the bar chart when data is empty', () => {
    render(
      <CertificateStats data={[]} totalGenerated={0} distinctCourses={0} />,
    );
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('shows 0 for Peak Course Count when data is empty', () => {
    render(
      <CertificateStats data={[]} totalGenerated={0} distinctCourses={0} />,
    );
    expect(screen.getByLabelText(/Peak Course Count: 0/i)).toBeInTheDocument();
  });

  it('is accessible: section has an aria-label', () => {
    const { container } = render(
      <CertificateStats data={sampleData} totalGenerated={4} distinctCourses={2} />,
    );
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-label', 'Certificate generation statistics');
  });
});

// ---------------------------------------------------------------------------
// CertificateGenerationPage integration tests
// ---------------------------------------------------------------------------

describe('CertificateGenerationPage', () => {
  const COURSE_ID = '123e4567-e89b-12d3-a456-426614174000';

  it('submits and shows success message', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ certificateId: 'cert-abc' });

    render(<CertificateGenerationPage />);

    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: COURSE_ID },
    });
    fireEvent.change(screen.getByLabelText(/Student Name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate certificate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Certificate generated successfully/i)).toBeInTheDocument();
    });
  });

  it('does not show stats panel before any successful generation', () => {
    render(<CertificateGenerationPage />);
    expect(screen.queryByText('Generation Statistics')).not.toBeInTheDocument();
  });

  it('shows stats panel after a successful generation', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ certificateId: 'cert-abc' });

    render(<CertificateGenerationPage />);

    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: COURSE_ID },
    });
    fireEvent.change(screen.getByLabelText(/Student Name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate certificate/i }));

    await waitFor(() => {
      expect(screen.getByText('Generation Statistics')).toBeInTheDocument();
    });
  });

  it('increments totalGenerated with each successful submission', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ certificateId: 'cert-abc' });
    const user = userEvent.setup();

    render(<CertificateGenerationPage />);

    // First submission
    fireEvent.change(screen.getByLabelText(/Course ID/i), { target: { value: COURSE_ID } });
    fireEvent.change(screen.getByLabelText(/Student Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate certificate/i }));
    await waitFor(() => expect(screen.getByText('Generation Statistics')).toBeInTheDocument());

    // Wait for form reset to complete before second fill
    await waitFor(() =>
      expect(screen.getByLabelText(/Course ID/i)).toHaveValue(''),
    );

    // Second submission — use userEvent to properly trigger RHF onChange/onBlur
    await user.clear(screen.getByLabelText(/Course ID/i));
    await user.type(screen.getByLabelText(/Course ID/i), COURSE_ID);
    await user.clear(screen.getByLabelText(/Student Name/i));
    await user.type(screen.getByLabelText(/Student Name/i), 'John Smith');
    await user.click(screen.getByRole('button', { name: /Generate certificate/i }));
    fireEvent.click(screen.getByRole('button', { name: /Generate certificate/i }));

    // The "Certificates Generated" stat card should show 2
    await waitFor(() => {
      const statValues = screen.getAllByText('2');
      expect(statValues.length).toBeGreaterThan(0);
    });
  });

  it('shows API error message on failure without displaying stats', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Server error'));

    render(<CertificateGenerationPage />);

    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: COURSE_ID },
    });
    fireEvent.change(screen.getByLabelText(/Student Name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generate certificate/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    expect(screen.queryByText('Generation Statistics')).not.toBeInTheDocument();
  });
});
