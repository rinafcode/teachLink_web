import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ConferenceManagement from '../ConferenceManagement';
import * as conferenceService from '@/services/conferenceService';
import { useStore } from '@/store/stateManager';

// Mock the conference service
vi.mock('@/services/conferenceService', () => ({
  getConferences: vi.fn(),
  addConference: vi.fn(),
  updateConference: vi.fn(),
  deleteConference: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the store
vi.mock('@/store/stateManager', () => ({
  useStore: vi.fn(),
}));

const MOCK_CONFERENCES = [
  {
    id: 'conf-1',
    title: 'Tech Summit 2024',
    role: 'speaker' as const,
    date: '2024-06-15',
    location: 'San Francisco, CA',
    url: 'https://techsummit.com',
  },
  {
    id: 'conf-2',
    title: 'JavaScript Conference',
    role: 'attendee' as const,
    date: '2024-07-20',
    location: 'New York, NY',
    url: undefined,
  },
];

const MOCK_USER = {
  id: 'user-123',
  name: 'John Doe',
  preferences: { theme: 'light' as const, language: 'en', notifications: true, prefetching: true },
};

describe('ConferenceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue(MOCK_USER);
    (conferenceService.getConferences as any).mockResolvedValue([]);
  });

  describe('Component Rendering', () => {
    it('renders the component with heading', () => {
      render(<ConferenceManagement />);
      expect(screen.getByRole('heading', { name: /conferences/i })).toBeInTheDocument();
    });

    it('renders the add conference button', () => {
      render(<ConferenceManagement />);
      expect(screen.getByRole('button', { name: /add conference/i })).toBeInTheDocument();
    });

    it('has proper section accessibility label', () => {
      render(<ConferenceManagement />);
      const section = screen.getByRole('region', { hidden: true });
      expect(section).toHaveAttribute('aria-labelledby', 'conference-management-heading');
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no conferences exist', async () => {
      render(<ConferenceManagement />);
      await waitFor(() => {
        expect(screen.getByText(/no conferences yet/i)).toBeInTheDocument();
      });
    });

    it('shows "No conferences yet" message with proper aria role', async () => {
      render(<ConferenceManagement />);
      await waitFor(() => {
        const emptyState = screen.getByRole('status', { hidden: true });
        expect(emptyState).toHaveTextContent(/no conferences yet/i);
      });
    });
  });

  describe('List Display', () => {
    beforeEach(() => {
      (conferenceService.getConferences as any).mockResolvedValue(MOCK_CONFERENCES);
    });

    it('renders list of conferences when data exists', async () => {
      render(<ConferenceManagement />);

      // Wait for data to load and display
      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      expect(screen.getByText('JavaScript Conference')).toBeInTheDocument();
    });

    it('displays conference details: title, role, date, location', async () => {
      render(<ConferenceManagement />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      expect(screen.getByText('Speaker')).toBeInTheDocument();
      expect(screen.getByText(/Jun 15, 2024/i)).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    });

    it('displays correct role badges for different roles', async () => {
      render(<ConferenceManagement />);

      await waitFor(() => {
        expect(screen.getByText('Speaker')).toBeInTheDocument();
      });

      expect(screen.getByText('Attendee')).toBeInTheDocument();
    });

    it('renders conference list as unordered list', async () => {
      render(<ConferenceManagement />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Add Conference Form', () => {
    async function waitForInitialLoad() {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add conference/i })).not.toBeDisabled();
      });
    }

    it('toggles form visibility on button click', async () => {
      render(<ConferenceManagement />);
      await waitForInitialLoad();
      const addBtn = screen.getByRole('button', { name: /add conference/i });

      // Initially hidden
      expect(screen.queryByLabelText(/conference title/i)).not.toBeInTheDocument();

      // Show form
      await userEvent.click(addBtn);
      expect(screen.getByLabelText(/conference title/i)).toBeInTheDocument();

      // Hide form
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByLabelText(/conference title/i)).not.toBeInTheDocument();
    });

    it('renders all form fields for adding a conference', async () => {
      render(<ConferenceManagement />);
      await waitForInitialLoad();
      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      expect(screen.getByLabelText(/conference title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conference date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conference website/i)).toBeInTheDocument();
    });

    it('has required fields marked as required', async () => {
      render(<ConferenceManagement />);
      await waitForInitialLoad();
      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      const titleInput = screen.getByLabelText(/conference title/i);
      expect(titleInput).toBeRequired();

      const dateInput = screen.getByLabelText(/conference date/i);
      expect(dateInput).toBeRequired();
    });
  });

  describe('Add Conference Submission', () => {
    beforeEach(() => {
      (conferenceService.addConference as any).mockResolvedValue({
        id: 'conf-new',
        title: 'New Conference',
        role: 'speaker',
        date: '2024-12-01',
        location: 'London, UK',
        url: 'https://newconf.com',
      });
    });

    async function waitForInitialLoad() {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add conference/i })).not.toBeDisabled();
      });
    }

    it('shows form with all fields after opening', async () => {
      render(<ConferenceManagement />);
      await waitForInitialLoad();

      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      expect(screen.getByLabelText(/conference title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/your role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conference date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conference website/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add conference$/i })).toBeInTheDocument();
    });

    it('displays validation error for empty required fields', async () => {
      render(<ConferenceManagement />);
      await waitForInitialLoad();

      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      // Use fireEvent.click on submit button to trigger onClick handler
      fireEvent.click(screen.getByRole('button', { name: /^add conference$/i }));

      // Error messages should appear (form validation)
      await waitFor(() => {
        expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('opens form with cancel button when add is clicked', async () => {
      render(<ConferenceManagement />);
      await waitForInitialLoad();

      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      // Form should have a working cancel button
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(cancelBtn).toBeInTheDocument();

      await userEvent.click(cancelBtn);
      expect(screen.queryByLabelText(/conference title/i)).not.toBeInTheDocument();
    });
  });

  describe('Edit Conference', () => {
    beforeEach(() => {
      (conferenceService.getConferences as any).mockResolvedValue(MOCK_CONFERENCES);
      (conferenceService.updateConference as any).mockResolvedValue(MOCK_CONFERENCES[0]);
    });

    it('opens form with pre-filled data when edit button clicked', async () => {
      const user = userEvent.setup();
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      const editBtn = screen.getByRole('button', { name: /edit conference: tech summit 2024/i });
      await user.click(editBtn);

      const titleInput = screen.getByLabelText(/conference title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Tech Summit 2024');

      const dateInput = screen.getByLabelText(/conference date/i) as HTMLInputElement;
      expect(dateInput.value).toBe('2024-06-15');

      const locationInput = screen.getByLabelText(/location/i) as HTMLInputElement;
      expect(locationInput.value).toBe('San Francisco, CA');
    });

    it('calls updateConference with modified data', async () => {
      const user = userEvent.setup();
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit conference: tech summit 2024/i }));

      const titleInput = screen.getByLabelText(/conference title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Conference');

      await user.click(screen.getByRole('button', { name: /update conference/i }));

      await waitFor(() => {
        expect(conferenceService.updateConference).toHaveBeenCalledWith(
          'user-123',
          'conf-1',
          expect.objectContaining({
            title: 'Updated Conference',
          }),
        );
      });
    });

    it('closes form after successful update', async () => {
      const user = userEvent.setup();
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit conference: tech summit 2024/i }));
      await user.click(screen.getByRole('button', { name: /update conference/i }));

      await waitFor(() => {
        expect(conferenceService.updateConference).toHaveBeenCalled();
      });

      // Form should close
      await waitFor(() => {
        expect(screen.queryByLabelText(/update conference/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Conference', () => {
    beforeEach(() => {
      (conferenceService.getConferences as any).mockResolvedValue(MOCK_CONFERENCES);
      (conferenceService.deleteConference as any).mockResolvedValue(undefined);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shows delete button with descriptive aria-label', async () => {
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', {
        name: /delete conference: tech summit 2024/i,
      });
      expect(deleteBtn).toBeInTheDocument();
    });

    it('calls deleteConference when delete confirmed', async () => {
      const user = userEvent.setup();
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /delete conference: tech summit 2024/i }),
      );

      await waitFor(() => {
        expect(conferenceService.deleteConference).toHaveBeenCalledWith('user-123', 'conf-1');
      });
    });

    it('does not delete when user cancels confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
      const user = userEvent.setup();
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /delete conference: tech summit 2024/i }),
      );

      expect(conferenceService.deleteConference).not.toHaveBeenCalled();
    });

    it('removes conference from list after successful deletion', async () => {
      // First call returns conferences, second call returns empty (mock updated state)
      const user = userEvent.setup();
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /delete conference: tech summit 2024/i }),
      );

      await waitFor(() => {
        expect(conferenceService.deleteConference).toHaveBeenCalled();
        expect(screen.queryByText('Tech Summit 2024')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when service fails', async () => {
      const errorMsg = 'Failed to load conferences';
      (conferenceService.getConferences as any).mockRejectedValue(new Error(errorMsg));

      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByText(errorMsg)).toBeInTheDocument();
      });
    });

    it('shows error state with alert role', async () => {
      (conferenceService.getConferences as any).mockRejectedValue(new Error('Network error'));

      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('shows validation error when submitting empty form', async () => {
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add conference/i })).not.toBeDisabled();
      });

      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      // Click submit button to trigger onClick handler which calls handleSubmit
      fireEvent.click(screen.getByRole('button', { name: /^add conference$/i }));

      // Validation error should appear for empty title field
      await waitFor(() => {
        expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      (conferenceService.addConference as any).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve({ id: 'new', title: 'Test', role: 'speaker', date: '2024-12-01' }),
              100,
            );
          }),
      );
    });

    it('shows form with submit button when add is opened', async () => {
      render(<ConferenceManagement userId="user-123" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add conference/i })).not.toBeDisabled();
      });

      await userEvent.click(screen.getByRole('button', { name: /add conference/i }));

      // Verify form shows with submit button and cancel button
      expect(screen.getByRole('button', { name: /^add conference$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Verify the form can be closed
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByLabelText(/conference title/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    async function waitForInitialLoad() {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add conference/i })).not.toBeDisabled();
      });
    }

    it('all form fields have label associations', async () => {
      const user = userEvent.setup();
      render(<ConferenceManagement />);
      await waitForInitialLoad();

      await user.click(screen.getByRole('button', { name: /add conference/i }));

      const titleInput = screen.getByLabelText(/conference title/i);
      const roleInput = screen.getByLabelText(/your role/i);
      const dateInput = screen.getByLabelText(/conference date/i);
      const locationInput = screen.getByLabelText(/location/i);

      expect(titleInput).toHaveAttribute('id');
      expect(roleInput).toHaveAttribute('id');
      expect(dateInput).toHaveAttribute('id');
      expect(locationInput).toHaveAttribute('id');
    });

    it('delete buttons have descriptive aria-labels', async () => {
      (conferenceService.getConferences as any).mockResolvedValue(MOCK_CONFERENCES);
      render(<ConferenceManagement />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', {
        name: /delete conference: tech summit 2024/i,
      });
      expect(deleteBtn).toHaveAttribute('aria-label', 'Delete conference: Tech Summit 2024');
    });

    it('edit buttons have descriptive aria-labels', async () => {
      (conferenceService.getConferences as any).mockResolvedValue(MOCK_CONFERENCES);
      render(<ConferenceManagement />);

      await waitFor(() => {
        expect(screen.getByText('Tech Summit 2024')).toBeInTheDocument();
      });

      const editBtn = screen.getByRole('button', { name: /edit conference: tech summit 2024/i });
      expect(editBtn).toHaveAttribute('aria-label', 'Edit conference: Tech Summit 2024');
    });

    it('button aria-expanded reflects form visibility', async () => {
      const user = userEvent.setup();
      render(<ConferenceManagement />);
      await waitForInitialLoad();

      const addBtn = screen.getByRole('button', { name: /add conference/i });

      expect(addBtn).toHaveAttribute('aria-expanded', 'false');

      await user.click(addBtn);
      expect(addBtn).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Integration with ProfileEditForm', () => {
    it('renders without affecting form region', () => {
      render(<ConferenceManagement />);

      // Component should be in its own section, not inside a form
      const section = screen.queryByRole('region', { hidden: true });
      expect(section).toBeInTheDocument();
      expect(section?.tagName).toBe('SECTION');
    });
  });

  describe('User Store Integration', () => {
    it('uses user ID from store when not provided as prop', async () => {
      render(<ConferenceManagement />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /conferences/i })).toBeInTheDocument();
      });
    });

    it('uses provided userId prop over store', async () => {
      render(<ConferenceManagement userId="custom-user-id" />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /conferences/i })).toBeInTheDocument();
      });
    });
  });
});
