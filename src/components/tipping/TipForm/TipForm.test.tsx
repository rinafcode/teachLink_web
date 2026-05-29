import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/testing/utils/render';
import { createMockUser } from '@/testing/utils/mocks';
import { TipForm } from './TipForm';

const mockSendTip = vi.fn();

vi.mock('@/services/tipService', () => ({
  sendTip: (...args: unknown[]) => mockSendTip(...args),
}));

describe('TipForm', () => {
  const recipient = createMockUser({ id: 'user-99', name: 'Alice' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with recipient name and interest group selector', () => {
    render(<TipForm recipient={recipient} />);
    expect(screen.getByText(/Tip Alice/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Special Interest Group/i })).toBeInTheDocument();
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

    expect(screen.getByTestId('tip-error')).toBeInTheDocument();
    expect(mockSendTip).not.toHaveBeenCalled();
  });

  it('includes selected special interest group in tip payload', async () => {
    mockSendTip.mockResolvedValueOnce({ success: true, tipId: 'tip-123', createdAt: '2026-05-29T00:00:00Z' });
    const { user } = render(<TipForm recipient={recipient} />);

    await user.selectOptions(screen.getByRole('combobox', { name: /Special Interest Group/i }), 'web3');
    await user.type(screen.getByTestId('tip-amount-input'), '0.05');
    await user.click(screen.getByTestId('tip-submit'));

    await waitFor(() => expect(mockSendTip).toHaveBeenCalledWith({
      recipientId: recipient.id,
      amount: 0.05,
      groupId: 'web3',
      groupName: 'Web3',
    }));
  });

  it('shows loading state while sending tip', async () => {
    mockSendTip.mockImplementation(() => new Promise(() => {}));
    const { user } = render(<TipForm recipient={recipient} />);

    await user.type(screen.getByTestId('tip-amount-input'), '0.01');
    await user.click(screen.getByTestId('tip-submit'));

    expect(screen.getByTestId('tip-submit')).toBeDisabled();
    expect(screen.getByTestId('tip-submit')).toHaveTextContent('Sending…');
  });

  it('shows success message after successful tip', async () => {
    mockSendTip.mockResolvedValueOnce({ success: true, tipId: 'tip-abc', createdAt: '2026-05-29T00:00:00Z' });
    const { user } = render(<TipForm recipient={recipient} />);

    await user.type(screen.getByTestId('tip-amount-input'), '0.05');
    await user.click(screen.getByTestId('tip-submit'));

    await waitFor(() => expect(screen.getByText(/Tip sent successfully!/i)).toBeInTheDocument());
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
