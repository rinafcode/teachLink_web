import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the RichTextEditor to avoid TipTap dependency in tests
vi.mock('@/app/components/ui/RichTextEditor', () => ({
  default: ({ content, onChange }: { content: string; onChange: (v: string) => void }) => (
    <textarea data-testid="rte" value={content} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import GroupDiscussionThread from '@/app/components/social/GroupDiscussionThread';

describe('GroupDiscussionThread', () => {
  it('posts content via onPost', () => {
    const onPost = vi.fn();
    render(
      <GroupDiscussionThread
        messages={[]}
        onPost={onPost}
      />
    );

    fireEvent.change(screen.getByTestId('rte'), { target: { value: '<p>Hello</p>' } });
    fireEvent.click(screen.getByText('Post'));

    expect(onPost).toHaveBeenCalledWith('<p>Hello</p>', undefined);
  });
});
