
import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/testing'
import { createMockUser, asyncMock, asyncErrorMock } from '@/testing/utils/mocks'

// ── Service mock ──────────────────────────────────────────────────────────
const mockSendTip = vi.fn()

vi.mock('@/services/tipService', () => ({
  sendTip: (...args: unknown[]) => mockSendTip(...args),
}))

// ── Inline minimal TipForm (replace with real import) ─────────────────────
interface TipFormProps {
  recipient: ReturnType<typeof createMockUser>
}

function TipForm({ recipient }: TipFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid tip amount.')
      return
    }

    setLoading(true)
    try {
      await mockSendTip({ recipientId: recipient.id, amount: Number(amount) })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transaction failed.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <p data-testid="success-msg">Tip sent successfully! 🎉</p>
  }

  return (
    <form onSubmit={handleSubmit} data-testid="tip-form">
      <label htmlFor="tip-amount">Tip {recipient.name}</label>
      <input
        id="tip-amount"
        type="number"
        step="0.001"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.01 ETH"
        data-testid="tip-amount-input"
      />
      {error && <p role="alert" data-testid="tip-error">{error}</p>}
      <button type="submit" disabled={loading} data-testid="tip-submit">
        {loading ? 'Sending…' : 'Send Tip'}
      </button>
    </form>
  )
}
// ─────────────────────────────────────────────────────────────────────────

describe('TipForm', () => {
  const recipient = createMockUser({ id: 'user-99', name: 'Alice' })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form with recipient name', () => {
    renderWithProviders(<TipForm recipient={recipient} />)
    expect(screen.getByLabelText(/Tip Alice/i)).toBeInTheDocument()
    expect(screen.getByTestId('tip-submit')).toHaveTextContent('Send Tip')
  })

  it('shows validation error for empty amount', async () => {
    const { user } = renderWithProviders(<TipForm recipient={recipient} />)
    await user.click(screen.getByTestId('tip-submit'))
    expect(screen.getByTestId('tip-error')).toHaveTextContent(/valid tip amount/i)
    expect(mockSendTip).not.toHaveBeenCalled()
  })

  it('shows validation error for zero amount', async () => {
    const { user } = renderWithProviders(<TipForm recipient={recipient} />)
    await user.type(screen.getByTestId('tip-amount-input'), '0')
    await user.click(screen.getByTestId('tip-submit'))
    expect(screen.getByTestId('tip-error')).toBeInTheDocument()
  })

  it('shows loading state while sending tip', async () => {
    mockSendTip.mockImplementation(() => new Promise(() => {})) // never resolves
    const { user } = renderWithProviders(<TipForm recipient={recipient} />)
    await user.type(screen.getByTestId('tip-amount-input'), '0.01')
    await user.click(screen.getByTestId('tip-submit'))
    expect(screen.getByTestId('tip-submit')).toBeDisabled()
    expect(screen.getByTestId('tip-submit')).toHaveTextContent('Sending…')
  })

  it('shows success message after successful tip', async () => {
    mockSendTip.mockResolvedValueOnce({ txHash: '0xabc' })
    const { user } = renderWithProviders(<TipForm recipient={recipient} />)
    await user.type(screen.getByTestId('tip-amount-input'), '0.05')
    await user.click(screen.getByTestId('tip-submit'))
    await waitFor(() =>
      expect(screen.getByTestId('success-msg')).toBeInTheDocument(),
    )
  })

  it('shows error message when tip transaction fails', async () => {
    mockSendTip.mockRejectedValueOnce(new Error('Insufficient funds'))
    const { user } = renderWithProviders(<TipForm recipient={recipient} />)
    await user.type(screen.getByTestId('tip-amount-input'), '999')
    await user.click(screen.getByTestId('tip-submit'))
    await waitFor(() =>
      expect(screen.getByTestId('tip-error')).toHaveTextContent(/Insufficient funds/i),
    )
  })
})