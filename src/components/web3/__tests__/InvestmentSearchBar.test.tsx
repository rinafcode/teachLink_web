import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvestmentSearchBar, InvestmentItem } from '../InvestmentSearchBar';

const mockData: InvestmentItem[] = [
  { id: '1', name: 'Ethereum Staking', symbol: 'ETH', apy: 4.5, tvl: 1000000, riskLevel: 'Low' },
  { id: '2', name: 'Polygon Yield', symbol: 'MATIC', apy: 8.2, tvl: 500000, riskLevel: 'Medium' },
  { id: '3', name: 'Degen Pool', symbol: 'DEGEN', apy: 45.0, tvl: 10000, riskLevel: 'High' },
];

describe('InvestmentSearchBar', () => {
  it('renders correctly with placeholder', () => {
    render(<InvestmentSearchBar items={mockData} onResultsChange={vi.fn()} />);
    expect(
      screen.getByPlaceholderText('Search tokens, protocols, or pools...'),
    ).toBeInTheDocument();
  });

  it('filters results based on search query', async () => {
    const user = userEvent.setup();
    const onResultsChange = vi.fn();
    render(<InvestmentSearchBar items={mockData} onResultsChange={onResultsChange} />);

    const input = screen.getByLabelText('Search investments');
    await user.type(input, 'eth');

    // Should be called multiple times during typing, check the last call
    const lastCall = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0].symbol).toBe('ETH');
  });

  it('toggles filters visibility', async () => {
    const user = userEvent.setup();
    render(<InvestmentSearchBar items={mockData} onResultsChange={vi.fn()} />);

    // Filters should be hidden initially
    expect(screen.queryByLabelText('Filter by risk level')).not.toBeInTheDocument();

    // Click toggle button
    const toggleBtn = screen.getByLabelText('Toggle investment filters');
    await user.click(toggleBtn);

    expect(screen.getByLabelText('Filter by risk level')).toBeInTheDocument();
  });

  it('filters results by risk level', async () => {
    const user = userEvent.setup();
    const onResultsChange = vi.fn();
    render(<InvestmentSearchBar items={mockData} onResultsChange={onResultsChange} />);

    await user.click(screen.getByLabelText('Toggle investment filters'));
    await user.selectOptions(screen.getByLabelText('Filter by risk level'), 'High');

    const lastCall = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0].symbol).toBe('DEGEN');
  });

  it('filters results by minimum APY', async () => {
    const user = userEvent.setup();
    const onResultsChange = vi.fn();
    render(<InvestmentSearchBar items={mockData} onResultsChange={onResultsChange} />);

    await user.click(screen.getByLabelText('Toggle investment filters'));
    await user.type(screen.getByLabelText('Filter by minimum APY'), '10');

    const lastCall = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0].symbol).toBe('DEGEN');
  });

  it('sorts results by APY', async () => {
    const user = userEvent.setup();
    const onResultsChange = vi.fn();
    render(<InvestmentSearchBar items={mockData} onResultsChange={onResultsChange} />);

    // Default is TVL descending, so ETH should be first
    let currentResults = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(currentResults[0].symbol).toBe('ETH');

    await user.click(screen.getByLabelText('Toggle investment filters'));
    await user.click(screen.getByText('Highest APY'));

    // After sorting by APY, DEGEN should be first
    currentResults = onResultsChange.mock.calls[onResultsChange.mock.calls.length - 1][0];
    expect(currentResults[0].symbol).toBe('DEGEN');
    expect(currentResults[1].symbol).toBe('MATIC');
    expect(currentResults[2].symbol).toBe('ETH');
  });
});
