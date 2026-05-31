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

describe('GroupDiscussionThread', () => {
  it('posts content via onPost', () => {
    const onPost = vi.fn();
    render(<GroupDiscussionThread messages={[]} onPost={onPost} />);

    fireEvent.change(screen.getByTestId('rte'), { target: { value: '<p>Hello</p>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(onPost).toHaveBeenCalledWith('<p>Hello</p>', undefined);
  });

  it('labels the post form, editor, and message log for assistive tech', () => {
    render(<GroupDiscussionThread messages={[]} onPost={vi.fn()} />);

    expect(screen.getByRole('log', { name: 'Discussion messages' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Create discussion post' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Discussion post content' })).toHaveAccessibleDescription(
      'Press Cmd/Ctrl + Enter to post',
    );
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
