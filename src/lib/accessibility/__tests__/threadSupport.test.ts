import { describe, expect, it } from 'vitest';
import {
  buildAccessibleThreadTree,
  flattenThreadTree,
  getThreadPositionLabel,
  type ThreadableItem,
} from '../threadSupport';

const item = (id: string, parentId: string | null, minute: number): ThreadableItem => ({
  id,
  parentId,
  createdAt: `2026-05-28T10:${String(minute).padStart(2, '0')}:00.000Z`,
});

describe('threadSupport', () => {
  it('builds ordered nested threads from parent ids', () => {
    const tree = buildAccessibleThreadTree([
      item('reply-2', 'root', 3),
      item('root', null, 1),
      item('reply-1', 'root', 2),
      item('nested', 'reply-1', 4),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].item.id).toBe('root');
    expect(tree[0].replies.map((node) => node.item.id)).toEqual(['reply-1', 'reply-2']);
    expect(tree[0].replies[0].replies[0].depth).toBe(2);
  });

  it('promotes orphaned and self-parented messages to roots', () => {
    const tree = buildAccessibleThreadTree([item('orphan', 'missing', 1), item('self', 'self', 2)]);

    expect(tree.map((node) => node.item.id)).toEqual(['orphan', 'self']);
  });

  it('flattens threads in screen-reader reading order', () => {
    const tree = buildAccessibleThreadTree([
      item('root', null, 1),
      item('reply', 'root', 2),
      item('second-root', null, 3),
    ]);

    expect(flattenThreadTree(tree).map((node) => node.item.id)).toEqual([
      'root',
      'reply',
      'second-root',
    ]);
  });

  it('creates concise position labels for accessible thread summaries', () => {
    expect(getThreadPositionLabel(0, 1)).toBe('Thread starter with 1 reply');
    expect(getThreadPositionLabel(2, 0)).toBe('Reply level 2 with 0 nested replies');
  });
});
