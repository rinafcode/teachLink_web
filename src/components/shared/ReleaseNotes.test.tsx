import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReleaseNotes from './ReleaseNotes';

describe('ReleaseNotes', () => {
  it('renders loading state initially', () => {
    render(<ReleaseNotes />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders release notes after loading', async () => {
    render(<ReleaseNotes />);

    // Wait for the component to finish "fetching" (500ms mock delay)
    await waitFor(
      () => {
        expect(screen.getByText('Release Notes')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    expect(screen.getByText('v1.2.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
    expect(screen.getByText('Added Lazy Loading support')).toBeInTheDocument();
  });
});
