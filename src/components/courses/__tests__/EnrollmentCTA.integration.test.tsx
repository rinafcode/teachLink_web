import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EnrollmentCTA from '../EnrollmentCTA';

// Simple mock for Lucide icons
vi.mock('lucide-react', () => ({
  Tag: () => <div data-testid="tag-icon" />,
  Gift: () => <div data-testid="gift-icon" />,
  Truck: () => <div data-testid="truck-icon" />,
}));

// Mock the modal out of the way
vi.mock('./PurchaseModal', () => ({
  PurchaseModal: () => <div data-testid="purchase-modal" />,
}));

describe('EnrollmentCTA & DiscountProgressBar Integration', () => {
  const customPricingOptions = [
    { id: 'tier-1', title: 'Course Tier One', price: 50.0, features: [] },
    { id: 'tier-2', title: 'Course Tier Two', price: 100.0, features: [] },
  ];

  it('calculates aggregate spend across item selection states and pushes state to progress metrics', () => {
    render(<EnrollmentCTA pricingOptions={customPricingOptions} />);

    // Initial State ($0 Spend)
    expect(screen.getByText(/away from/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Free Support Upgrade/i).length).toBeGreaterThan(0);

    const basicOptionCard = screen.getByText('Course Tier One');
    const premiumOptionCard = screen.getByText('Course Tier Two');

    // Select first item ($50.00 spend) -> Crosses Tier 1 ($49.99)
    fireEvent.click(basicOptionCard);

    expect(screen.getAllByText(/10% Off Your Order/i).length).toBeGreaterThan(0);
    // Use exact string matching to target just the badges and ignore the header text
    expect(screen.getAllByText('✓ Unlocked').length).toBe(1);

    // Select second item ($100.00 spend) -> Total $150.00 (Crosses max tier $149.99)
    fireEvent.click(premiumOptionCard);

    expect(screen.getByText(/All rewards unlocked/i)).toBeInTheDocument();
    // This will now perfectly match only the 3 item checkmarks
    expect(screen.getAllByText('✓ Unlocked').length).toBe(3);
  });
});
