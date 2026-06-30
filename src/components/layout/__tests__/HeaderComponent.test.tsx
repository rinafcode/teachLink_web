import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HeaderComponent from '../HeaderComponent';
import { useWallet } from '@/hooks/useWallet';

vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

global.fetch = vi.fn();

describe('HeaderComponent — Grant Management Pipeline Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show basic wallet action buttons when disconnected', () => {
    (useWallet as any).mockReturnValue({ connected: false, publicKey: null });
    render(<HeaderComponent />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('should synchronize active ledger grants upon successful connection', async () => {
    (useWallet as any).mockReturnValue({ connected: true, publicKey: 'GABC...123' });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        activeGrants: [
          { id: 'g1', grantee: 'GXYZ...999', scope: 'budget_management', authorizedAmount: '500' },
        ],
        pendingApprovalsCount: 1,
      }),
    });

    render(<HeaderComponent />);

    await waitFor(() => {
      expect(screen.getByText('1 Scope Grant Authorized')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Counter badge
    });
  });

  it('should allow a user to dispatch a revocation signal directly from the menu drop overlay', async () => {
    (useWallet as any).mockReturnValue({ connected: true, publicKey: 'GABC...123' });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        activeGrants: [{ id: 'g1', grantee: 'GXYZ...999', scope: 'budget_management' }],
        pendingApprovalsCount: 0,
      }),
    });

    render(<HeaderComponent />);

    const dropdownButton = await screen.findByText('1 Scope Grant Authorized');
    fireEvent.click(dropdownButton);

    expect(screen.getByText('BUDGET MANAGEMENT')).toBeInTheDocument();

    // Mock successful revocation endpoint cycle
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    const revokeButton = screen.getByText('Revoke');
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(screen.queryByText('BUDGET MANAGEMENT')).not.toBeInTheDocument();
    });
  });
});
