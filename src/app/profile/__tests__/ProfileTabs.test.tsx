import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/lib/theme-provider';
import ProfileTabs from '../components/ProfileTabs';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider defaultTheme="light">{ui}</ThemeProvider>);
}

describe('ProfileTabs', () => {
  it('renders the profile panel first to keep initial work minimal', () => {
    renderWithTheme(<ProfileTabs />);

    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
    expect(screen.queryByText('Dark Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('First Course')).not.toBeInTheDocument();
  });

  it('loads settings only when the settings tab is selected', async () => {
    const user = userEvent.setup();

    renderWithTheme(<ProfileTabs />);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));

    await waitFor(() =>
      expect(screen.getByRole('tabpanel', { name: 'Settings' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeChecked();

    await user.click(screen.getByRole('switch', { name: 'Notifications' }));
    expect(screen.getByRole('switch', { name: 'Notifications' })).not.toBeChecked();
  });

  it('loads achievements only when the achievements tab is selected', async () => {
    const user = userEvent.setup();

    renderWithTheme(<ProfileTabs />);
    await user.click(screen.getByRole('tab', { name: 'Achievements' }));

    await waitFor(() =>
      expect(screen.getByRole('tabpanel', { name: 'Achievements' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: 'Achievements' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Web3 Master')).toBeInTheDocument();
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
  });

  it('loads certificates only when the certificates tab is selected', async () => {
    const user = userEvent.setup();

    renderWithTheme(<ProfileTabs />);
    await user.click(screen.getByRole('tab', { name: 'Certification Program' }));

    await waitFor(() =>
      expect(screen.getByRole('tabpanel', { name: 'Certification Program' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: 'Certification Program' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Generate your Course Certificate')).toBeInTheDocument();
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
  });
});
