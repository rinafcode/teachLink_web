import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the RichTextEditor to avoid TipTap dependency in tests
vi.mock('@/app/components/ui/RichTextEditor', () => ({
  default: ({
    content,
    onChange,
    ariaLabel,
    describedBy,
  }: {
    content: string;
    onChange: (v: string) => void;
    ariaLabel?: string;
    describedBy?: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      data-testid="rte"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import GroupDiscussionThread from '@/app/components/social/GroupDiscussionThread';
import type { GroupMessage } from '@/app/hooks/useStudyGroups';

describe('GroupDiscussionThread', () => {
  it('posts content via onPost', () => {
    const onPost = vi.fn();
    render(<GroupDiscussionThread messages={[]} onPost={onPost} />);

    fireEvent.change(screen.getByTestId('rte'), { target: { value: '<p>Hello</p>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

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

  it('labels the post form, editor, and message log for assistive tech', () => {
    render(<GroupDiscussionThread messages={[]} onPost={vi.fn()} />);

    expect(screen.getByRole('log', { name: 'Discussion messages' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Create discussion post' })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Discussion post content' }),
    ).toHaveAccessibleDescription('Press Cmd/Ctrl + Enter to post');
    expect(screen.getByRole('status')).toHaveTextContent('No messages yet');
  });

  it('posts content with the documented keyboard shortcut', () => {
    const onPost = vi.fn();
    render(<GroupDiscussionThread messages={[]} onPost={onPost} />);

    const editor = screen.getByRole('textbox', { name: 'Discussion post content' });
    fireEvent.change(editor, { target: { value: '<p>Keyboard post</p>' } });
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });

    expect(onPost).toHaveBeenCalledWith('<p>Keyboard post</p>', undefined);
  });
});
