import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import OnboardingPage from '../page';

// Mock useRouter from next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock notifications hook to prevent toasted popups during testing
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockLoading = vi.fn(() => 'toast-loading-id');
const mockDismiss = vi.fn();

vi.mock('@/hooks/use-notification', () => ({
  useNotification: () => ({
    success: mockSuccess,
    error: mockError,
    loading: mockLoading,
    dismiss: mockDismiss,
  }),
}));

describe('Onboarding Page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Step 1 (Personal & Role Setup) successfully on mount', () => {
    render(<OnboardingPage />);

    expect(screen.getByText('Welcome to Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();

    // Check that we display the two role options
    expect(screen.getByText('Student / Learner')).toBeInTheDocument();
    expect(screen.getByText('Instructor / Teacher')).toBeInTheDocument();

    // Check progress is showing Step 1 of 3
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('shows error messages if required Step 1 fields are missing on Next click', async () => {
    render(<OnboardingPage />);

    const nextButton = screen.getByRole('button', { name: /Next/i });

    await act(async () => {
      fireEvent.click(nextButton);
    });

    // It should trigger validation errors
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Please select a role to continue')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
    });
  });

  it('navigates to Step 2 (Preferences) when Step 1 fields are valid', async () => {
    render(<OnboardingPage />);

    // Fill username
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: 'janedoe' } });
    fireEvent.blur(usernameInput);

    // Click Student role card
    const studentCard = screen.getByText('Student / Learner').closest('button')!;
    fireEvent.click(studentCard);

    // Fill date of birth
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    fireEvent.change(dobInput, { target: { value: '1995-05-15' } });
    fireEvent.blur(dobInput);

    // Click Next
    const nextButton = screen.getByRole('button', { name: /Next/i });

    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Check we navigated to Step 2
    await waitFor(() => {
      expect(screen.getByText('Set your preferences')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });
  });

  it('validates Step 2 and moves to Step 3 (Wallet Connection)', async () => {
    render(<OnboardingPage />);

    // Step 1 setup
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'janedoe' } });
    fireEvent.click(screen.getByText('Student / Learner').closest('button')!);
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1995-05-15' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    // Step 2 validation fails on empty interest
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Please select your primary area of interest')).toBeInTheDocument();
    });

    // Fill Step 2 fields
    fireEvent.change(screen.getByLabelText(/Primary Interest/i), { target: { value: 'web3' } });
    fireEvent.change(screen.getByLabelText(/Preferred Notification Channel/i), {
      target: { value: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/Interface Language/i), { target: { value: 'en' } });

    // Click Next
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    // Check we navigated to Step 3
    await waitFor(() => {
      expect(screen.getByText('Decentralized Web3 Connection')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });
  });

  it('simulates Starknet Argent X wallet connection in Step 3', async () => {
    render(<OnboardingPage />);

    // Fast-track to Step 3
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'janedoe' } });
    fireEvent.click(screen.getByText('Student / Learner').closest('button')!);
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1995-05-15' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    fireEvent.change(screen.getByLabelText(/Primary Interest/i), { target: { value: 'web3' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    // Click connect Argent X
    const argentButton = screen.getByRole('button', { name: /Argent X/i });
    fireEvent.click(argentButton);

    // Verify loading state
    expect(screen.getByText('Connecting')).toBeInTheDocument();

    // Fast-forward mock connect time (1.5s)
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Should display connected address and active state
    await waitFor(() => {
      expect(screen.getByText('Connected Wallet')).toBeInTheDocument();
      expect(screen.getByText(/0x04828f731a54/)).toBeInTheDocument();
      expect(mockSuccess).toHaveBeenCalledWith('Connected to Argent X successfully!');
    });
  });

  it('completes onboarding and triggers redirection to dashboard', async () => {
    render(<OnboardingPage />);

    // Fast-track to Step 3
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'janedoe' } });
    fireEvent.click(screen.getByText('Student / Learner').closest('button')!);
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1995-05-15' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    fireEvent.change(screen.getByLabelText(/Primary Interest/i), { target: { value: 'web3' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    });

    // Complete onboarding (wallet connection is optional, so we can skip connecting it)
    const completeButton = screen.getByRole('button', { name: /Complete/i });

    await act(async () => {
      fireEvent.click(completeButton);
    });

    // Check loading indicator shows up
    expect(mockLoading).toHaveBeenCalledWith('Finalizing your registration profile...');

    // Fast-forward mock registration API time (2.0s)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Should redirect to dashboard and display success toast
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalledWith('Onboarding complete! Welcome to TeachLink.');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(localStorage.getItem('teachlink_onboarded')).toBe('true');
      expect(localStorage.getItem('teachlink_user_role')).toBe('student');
    });
  });
});
