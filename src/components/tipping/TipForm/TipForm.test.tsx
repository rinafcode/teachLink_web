import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/testing/utils/render';
import { createMockUser } from '@/testing/utils/mocks';
import TipForm from './TipForm';

// ── Service mock ──────────────────────────────────────────────────────────
const mockSendTip = vi.fn();

vi.mock('@/services/tipService', () => ({
  sendTip: (...args: unknown[]) => mockSendTip(...args),
}));

describe('TipForm', () => {
  const recipient = createMockUser({ id: 'user-99', name: 'Alice' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with recipient name', () => {
    render(<TipForm recipient={recipient} />);
    expect(screen.getByLabelText(/Tip Alice/i)).toBeInTheDocument();
    expect(screen.getByTestId('tip-submit')).toHaveTextContent('Send Tip');
  });

  it('shows validation error for empty amount', async () => {
    const { user } = render(<TipForm recipient={recipient} />);
    await user.click(screen.getByTestId('tip-submit'));
    expect(screen.getByTestId('tip-error')).toHaveTextContent(/valid tip amount/i);
    expect(mockSendTip).not.toHaveBeenCalled();
  });

  it('shows validation error for zero amount', async () => {
    const { user } = render(<TipForm recipient={recipient} />);
    await user.type(screen.getByTestId('tip-amount-input'), '0');
    await user.click(screen.getByTestId('tip-submit'));
    await waitFor(() => expect(screen.getByTestId('tip-error')).toBeInTheDocument());
  });

  it('shows loading state while sending tip', async () => {
    mockSendTip.mockImplementation(() => new Promise(() => {})); // never resolves
    const { user } = render(<TipForm recipient={recipient} />);
    await user.type(screen.getByTestId('tip-amount-input'), '0.01');
    await user.click(screen.getByTestId('tip-submit'));
    expect(screen.getByTestId('tip-submit')).toBeDisabled();
    expect(screen.getByTestId('tip-submit')).toHaveTextContent('Sending…');
  });

  it('shows success message after successful tip', async () => {
    mockSendTip.mockResolvedValueOnce({
      txHash: '0xabc',
      recipientId: recipient.id,
      amount: 0.05,
      notarizationId: 'notarization-user-99-abc',
      notarizationProof: 'proof-value',
      notarizedAt: new Date().toISOString(),
    });

    const { user } = render(<TipForm recipient={recipient} />);
    await user.type(screen.getByTestId('tip-amount-input'), '0.05');
    await user.click(screen.getByTestId('tip-submit'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
  });

  it('shows error message when tip transaction fails', async () => {
    mockSendTip.mockRejectedValueOnce(new Error('Insufficient funds'));
    const { user } = render(<TipForm recipient={recipient} />);
    await user.type(screen.getByTestId('tip-amount-input'), '999');
    await user.click(screen.getByTestId('tip-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('tip-error')).toHaveTextContent(/Insufficient funds/i),
    );
  });
});
