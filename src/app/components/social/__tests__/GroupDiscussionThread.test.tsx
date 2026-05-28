import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the RichTextEditor to avoid TipTap dependency in tests
vi.mock('@/app/components/ui/RichTextEditor', () => ({
  default: ({ content, onChange }: { content: string; onChange: (v: string) => void }) => (
    <textarea data-testid="rte" value={content} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import GroupDiscussionThread from '@/app/components/social/GroupDiscussionThread';
import type { GroupMessage } from '@/app/hooks/useStudyGroups';

describe('GroupDiscussionThread', () => {
  it('posts content via onPost', () => {
    const onPost = vi.fn();
    render(<GroupDiscussionThread messages={[]} onPost={onPost} />);

    fireEvent.change(screen.getByTestId('rte'), { target: { value: '<p>Hello</p>' } });
    fireEvent.click(screen.getByText('Post'));

    expect(onPost).toHaveBeenCalledWith('<p>Hello</p>', undefined, null);
  });

  it('supports accessible threaded replies', () => {
    const onPost = vi.fn();
    const messages: GroupMessage[] = [
      {
        id: 'root',
        groupId: 'group-1',
        senderId: 'u1',
        senderName: 'Alice',
        contentHtml: '<p>Root message</p>',
        createdAt: '2026-05-28T10:00:00.000Z',
      },
      {
        id: 'reply',
        groupId: 'group-1',
        parentId: 'root',
        senderId: 'u2',
        senderName: 'Bob',
        contentHtml: '<p>Reply message</p>',
        createdAt: '2026-05-28T10:01:00.000Z',
      },
    ];

    render(<GroupDiscussionThread messages={messages} onPost={onPost} />);

    expect(screen.getByLabelText('Thread starter with 1 reply by Alice')).toBeInTheDocument();
    expect(screen.getByLabelText('Reply level 1 with 0 nested replies by Bob')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reply to Alice' }));
    fireEvent.change(screen.getByTestId('rte'), { target: { value: '<p>Following up</p>' } });
    fireEvent.click(screen.getByText('Post'));

    expect(onPost).toHaveBeenCalledWith('<p>Following up</p>', undefined, 'root');
  });
});
