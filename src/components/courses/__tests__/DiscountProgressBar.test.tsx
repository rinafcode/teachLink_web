import { render, screen } from '@testing-library/react';
import DiscountProgressBar from '../DiscountProgressBar';

describe('DiscountProgressBar', () => {
  it('shows next tier message when no spend', () => {
    render(<DiscountProgressBar currentSpend={0} />);
    expect(screen.getByText(/away from/i)).toBeInTheDocument();
  });

  it('shows first tier as unlocked when spend meets threshold', () => {
    render(<DiscountProgressBar currentSpend={49.99} />);
    expect(screen.getByText(/Free Support Upgrade/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Unlocked/i).length).toBeGreaterThan(0);
  });

  it('shows all unlocked when spend exceeds max threshold', () => {
    render(<DiscountProgressBar currentSpend={200} />);
    expect(screen.getByText(/All rewards unlocked/i)).toBeInTheDocument();
  });

  it('has correct progressbar aria attributes', () => {
    render(<DiscountProgressBar currentSpend={75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles floating point addition boundaries gracefully', () => {
    // 49.99 + 50.00 = 99.99 (Hits Tier 2 exactly)
    render(<DiscountProgressBar currentSpend={49.99 + 50.0} />);
    expect(screen.getByText(/10% Off Your Order/i)).toBeInTheDocument();

    // Should show unlocked checkmark for the second tier
    const unlockedElements = screen.getAllByText(/Unlocked/i);
    expect(unlockedElements.length).toBe(2);
  });
});
