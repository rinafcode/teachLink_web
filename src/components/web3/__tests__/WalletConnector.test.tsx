import React from 'react';
import { render, screen } from '@testing-library/react';
import { WalletConnector } from '../WalletConnector';

describe('WalletConnector', () => {
  it('renders scanning state initially', () => {
    render(<WalletConnector />);
    expect(screen.getByText(/Scanning for wallets/i)).toBeInTheDocument();
  });
});
