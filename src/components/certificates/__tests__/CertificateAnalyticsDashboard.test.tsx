/**
 * Tests for CertificateAnalyticsDashboard component (issue #472)
 *
 * Strategy:
 *  - Mock global.fetch so the component never hits the network.
 *  - Use @testing-library/react + vitest (jsdom environment).
 *  - Mock recharts' ResponsiveContainer to a fixed size so SVG renders
 *    deterministically in jsdom (no ResizeObserver).
 *  - Mock framer-motion so animations resolve instantly.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CertificateAnalyticsDashboard } from '../CertificateAnalyticsDashboard';
import type { CertificateAnalytics } from '@/services/certificate-service';

// ── Mocks ────────────────────────────────────────────────────────────────────

// recharts ResponsiveContainer requires a real DOM size — stub it out
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

// Framer-motion: render children immediately without animation wrappers
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get:
          (_target, prop) =>
          ({ children, ...rest }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
            const Tag = prop as keyof JSX.IntrinsicElements;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return <Tag {...(rest as any)}>{children}</Tag>;
          },
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const buildAnalytics = (overrides: Partial<CertificateAnalytics> = {}): CertificateAnalytics => {
  const today = new Date();
  const issuedByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().slice(0, 10), count: i === 29 ? 3 : 0 };
  });

  return {
    totalIssued: 5,
    totalActive: 4,
    totalRevoked: 1,
    issuedByDay,
    issuedByCourse: [
      { courseName: 'Intro to TypeScript', count: 3 },
      { courseName: 'Advanced React', count: 2 },
    ],
    avgCompletionToIssuanceDays: 1.5,
    ...overrides,
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockFetchSuccess = (data: CertificateAnalytics) => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
};

const mockFetchError = (message = 'Internal Server Error') => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ error: message }),
  } as Response);
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CertificateAnalyticsDashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Rendering with initialData (no fetch) ─────────────────────────────────

  describe('when initialData is provided', () => {
    it('renders the section heading', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('heading', { name: /certificate analytics/i }),
      ).toBeInTheDocument();
    });

    it('displays all four stat card labels', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(screen.getByText('Total Issued')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Revoked')).toBeInTheDocument();
      expect(screen.getByText('Avg. Issuance Lag')).toBeInTheDocument();
    });

    it('shows the correct totalIssued value', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics({ totalIssued: 42 })} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('shows the correct totalActive value', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics({ totalActive: 38 })} />);
      expect(screen.getByText('38')).toBeInTheDocument();
    });

    it('shows the correct totalRevoked value', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics({ totalRevoked: 4 })} />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('shows avgCompletionToIssuanceDays formatted with "d" suffix', () => {
      render(
        <CertificateAnalyticsDashboard initialData={buildAnalytics({ avgCompletionToIssuanceDays: 2.5 })} />,
      );
      expect(screen.getByText('2.5d')).toBeInTheDocument();
    });

    it('shows "< 1 day" when avgCompletionToIssuanceDays is 0', () => {
      render(
        <CertificateAnalyticsDashboard
          initialData={buildAnalytics({ avgCompletionToIssuanceDays: 0 })}
        />,
      );
      expect(screen.getByText('< 1 day')).toBeInTheDocument();
    });

    it('renders the 30-day trend chart region', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('region', { name: /30-day certificate issuance trend/i }),
      ).toBeInTheDocument();
    });

    it('renders the by-course chart region', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('region', { name: /certificates issued by course/i }),
      ).toBeInTheDocument();
    });

    it('renders the active vs revoked chart region', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('region', { name: /active versus revoked/i }),
      ).toBeInTheDocument();
    });

    it('renders accessible sr-only table for 30-day trend', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('table', { name: /30-day certificate issuance trend/i }),
      ).toBeInTheDocument();
    });

    it('renders accessible sr-only table for course breakdown', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('table', { name: /certificates issued by course/i }),
      ).toBeInTheDocument();
    });

    it('renders accessible sr-only table for active vs revoked', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('table', { name: /active versus revoked/i }),
      ).toBeInTheDocument();
    });

    it('shows "No data yet" when issuedByCourse is empty', () => {
      render(
        <CertificateAnalyticsDashboard
          initialData={buildAnalytics({ issuedByCourse: [] })}
        />,
      );
      expect(screen.getByText('No data yet')).toBeInTheDocument();
    });

    it('shows "No certificates issued yet" when totalIssued is 0', () => {
      render(
        <CertificateAnalyticsDashboard
          initialData={buildAnalytics({
            totalIssued: 0,
            totalActive: 0,
            totalRevoked: 0,
            issuedByCourse: [],
          })}
        />,
      );
      expect(screen.getByText(/no certificates issued yet/i)).toBeInTheDocument();
    });

    it('renders the Refresh button', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(screen.getByRole('button', { name: /refresh analytics/i })).toBeInTheDocument();
    });

    it('does not call fetch when initialData is supplied', () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── Client-side fetch on mount ────────────────────────────────────────────

  describe('when no initialData is given', () => {
    it('calls fetch on mount and renders analytics after resolution', async () => {
      const data = buildAnalytics({ totalIssued: 7 });
      mockFetchSuccess(data);

      render(<CertificateAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/certificates/analytics',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('shows an error message when the fetch fails', async () => {
      mockFetchError('Service unavailable');

      render(<CertificateAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument();
      });
    });

    it('shows a Retry button inside the error state', async () => {
      mockFetchError();

      render(<CertificateAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('re-fetches when the Retry button is clicked', async () => {
      const data = buildAnalytics({ totalIssued: 3 });
      // First call fails, second succeeds
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'oops' }) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => data } as Response);

      render(<CertificateAnalyticsDashboard />);

      // Wait for error state
      const retryBtn = await screen.findByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ── Manual Refresh button ─────────────────────────────────────────────────

  describe('Refresh button', () => {
    it('re-fetches data when the header Refresh button is clicked', async () => {
      const data = buildAnalytics({ totalIssued: 10 });
      mockFetchSuccess(data);

      render(<CertificateAnalyticsDashboard initialData={buildAnalytics({ totalIssued: 1 })} />);

      fireEvent.click(screen.getByRole('button', { name: /refresh analytics/i }));

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has a labelled section landmark', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(
        screen.getByRole('region', { name: /certificate analytics/i }),
      ).toBeInTheDocument();
    });

    it('stat cards have region roles with accessible names', () => {
      render(<CertificateAnalyticsDashboard initialData={buildAnalytics()} />);
      expect(screen.getByRole('region', { name: 'Total Issued' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Active' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Revoked' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Avg. Issuance Lag' })).toBeInTheDocument();
    });
  });
});
