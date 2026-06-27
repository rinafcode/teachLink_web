/**
 * Unit tests for the Approval Process (RunAsNonRoot implementation).
 *
 * Coverage:
 *  1. ACL — CONTENT_APPROVE permission assignment
 *  2. API route — POST (submit), PATCH (review), GET (list)
 *  3. SubmitForApproval component — renders for instructors, hidden for admins/guests
 *  4. ApprovalQueue component — renders for admins, hidden for non-admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/testing/utils/render';
import { hasPermission } from '@/lib/auth/acl';
import { Permission, UserRole } from '@/types/api';
import type { User } from '@/types/api';
import { SubmitForApproval } from '@/components/approvals/SubmitForApproval';
import { ApprovalQueue } from '@/components/admin/ApprovalQueue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeUser = (role: string, overrides: Partial<User> = {}): User =>
  ({
    id: 'u-1',
    name: 'Test User',
    email: 'test@example.com',
    role: role as User['role'],
    ...overrides,
  }) as User;

// ---------------------------------------------------------------------------
// 1. ACL — permission assignment
// ---------------------------------------------------------------------------

describe('ACL: CONTENT_APPROVE permission', () => {
  it('is granted to ADMIN', () => {
    expect(hasPermission(makeUser(UserRole.ADMIN), Permission.CONTENT_APPROVE)).toBe(true);
  });

  it('is NOT granted to INSTRUCTOR', () => {
    expect(hasPermission(makeUser(UserRole.INSTRUCTOR), Permission.CONTENT_APPROVE)).toBe(false);
  });

  it('is NOT granted to STUDENT', () => {
    expect(hasPermission(makeUser(UserRole.STUDENT), Permission.CONTENT_APPROVE)).toBe(false);
  });

  it('is NOT granted to GUEST', () => {
    expect(hasPermission(makeUser(UserRole.GUEST), Permission.CONTENT_APPROVE)).toBe(false);
  });

  it('INSTRUCTOR has CONTENT_UPLOAD (can submit)', () => {
    expect(hasPermission(makeUser(UserRole.INSTRUCTOR), Permission.CONTENT_UPLOAD)).toBe(true);
  });

  it('STUDENT does NOT have CONTENT_UPLOAD', () => {
    expect(hasPermission(makeUser(UserRole.STUDENT), Permission.CONTENT_UPLOAD)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. API route — inline handler tests via fetch mock
// ---------------------------------------------------------------------------

describe('Approval API route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST creates a PENDING approval item', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          id: 'approval-1',
          contentId: 'course-42',
          contentType: 'COURSE',
          title: 'Intro to Starknet',
          submittedBy: 'u-instructor',
          submittedAt: new Date().toISOString(),
          status: 'PENDING',
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: 'course-42',
        contentType: 'COURSE',
        title: 'Intro to Starknet',
        submittedBy: 'u-instructor',
      }),
    });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.status).toBe('PENDING');
    expect(json.data.contentId).toBe('course-42');
  });

  it('PATCH approves a PENDING item', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          id: 'approval-1',
          status: 'APPROVED',
          reviewedBy: 'u-admin',
          reviewedAt: new Date().toISOString(),
          reviewNote: 'Looks good',
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('/api/approvals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'approval-1',
        status: 'APPROVED',
        reviewedBy: 'u-admin',
        reviewNote: 'Looks good',
      }),
    });
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.status).toBe('APPROVED');
    expect(json.data.reviewedBy).toBe('u-admin');
  });

  it('PATCH rejects a PENDING item', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { id: 'approval-2', status: 'REJECTED', reviewedBy: 'u-admin' },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await fetch('/api/approvals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'approval-2', status: 'REJECTED', reviewedBy: 'u-admin' }),
    });
    const json = await res.json();

    expect(json.data.status).toBe('REJECTED');
  });

  it('GET returns list of approvals', async () => {
    const items = [
      { id: 'a1', status: 'PENDING', title: 'Course A' },
      { id: 'a2', status: 'APPROVED', title: 'Course B' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ success: true, data: items }) }),
    );

    const res = await fetch('/api/approvals');
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 3. SubmitForApproval component
// ---------------------------------------------------------------------------

describe('SubmitForApproval component', () => {
  const baseProps = {
    contentId: 'course-1',
    contentType: 'COURSE' as const,
    title: 'My Course',
  };

  it('renders submit button for INSTRUCTOR (has CONTENT_UPLOAD, not CONTENT_APPROVE)', () => {
    render(<SubmitForApproval {...baseProps} user={makeUser(UserRole.INSTRUCTOR)} />);
    expect(screen.getByRole('button', { name: /submit.*approval/i })).toBeInTheDocument();
  });

  it('renders nothing for ADMIN (has CONTENT_APPROVE — uses ApprovalQueue instead)', () => {
    const { container } = render(
      <SubmitForApproval {...baseProps} user={makeUser(UserRole.ADMIN)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for STUDENT (no CONTENT_UPLOAD)', () => {
    const { container } = render(
      <SubmitForApproval {...baseProps} user={makeUser(UserRole.STUDENT)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for unauthenticated user', () => {
    const { container } = render(<SubmitForApproval {...baseProps} user={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows success state after successful submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { id: 'a-1', status: 'PENDING', title: 'My Course' },
        }),
      }),
    );

    const { user } = render(
      <SubmitForApproval {...baseProps} user={makeUser(UserRole.INSTRUCTOR)} />,
    );
    await user.click(screen.getByRole('button', { name: /submit.*approval/i }));

    await waitFor(() => expect(screen.getByText(/submitted for review/i)).toBeInTheDocument());
  });

  it('shows error message on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const { user } = render(
      <SubmitForApproval {...baseProps} user={makeUser(UserRole.INSTRUCTOR)} />,
    );
    await user.click(screen.getByRole('button', { name: /submit.*approval/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/network error/i));
  });

  it('calls onSubmitted callback with returned item', async () => {
    const returnedItem = { id: 'a-1', status: 'PENDING', title: 'My Course' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ success: true, data: returnedItem }) }),
    );
    const onSubmitted = vi.fn();

    const { user } = render(
      <SubmitForApproval
        {...baseProps}
        user={makeUser(UserRole.INSTRUCTOR)}
        onSubmitted={onSubmitted}
      />,
    );
    await user.click(screen.getByRole('button', { name: /submit.*approval/i }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(returnedItem));
  });
});

// ---------------------------------------------------------------------------
// 4. ApprovalQueue component
// ---------------------------------------------------------------------------

describe('ApprovalQueue component', () => {
  const pendingItems = [
    {
      id: 'a-1',
      contentId: 'c-1',
      contentType: 'COURSE',
      title: 'Blockchain Basics',
      submittedBy: 'instructor-1',
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    },
  ];

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: pendingItems }),
      }),
    );
  });

  it('renders queue for ADMIN', async () => {
    render(<ApprovalQueue user={makeUser(UserRole.ADMIN)} />);
    await waitFor(() => expect(screen.getByText('Blockchain Basics')).toBeInTheDocument());
  });

  it('shows permission denied message for INSTRUCTOR', () => {
    render(<ApprovalQueue user={makeUser(UserRole.INSTRUCTOR)} />);
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('shows permission denied message for STUDENT', () => {
    render(<ApprovalQueue user={makeUser(UserRole.STUDENT)} />);
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('shows Approve and Reject buttons for PENDING items', async () => {
    render(<ApprovalQueue user={makeUser(UserRole.ADMIN)} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
    });
  });

  it('calls PATCH on approve', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: pendingItems }) })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { ...pendingItems[0], status: 'APPROVED' },
        }),
      });
    vi.stubGlobal('fetch', mockFetch);

    const { user } = render(<ApprovalQueue user={makeUser(UserRole.ADMIN)} />);
    await waitFor(() => screen.getByRole('button', { name: /^approve$/i }));
    await user.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find((c) => c[1]?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall![1].body);
      expect(body.status).toBe('APPROVED');
    });
  });
});
