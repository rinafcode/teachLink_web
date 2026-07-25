export interface ThreadableItem {
  id: string;
  parentId?: string | null;
  createdAt: string;
}

export interface ThreadNode<T extends ThreadableItem> {
  item: T;
  depth: number;
  replies: Array<ThreadNode<T>>;
}

export interface ThreadBuildOptions {
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 4;

export function buildAccessibleThreadTree<T extends ThreadableItem>(
  items: T[],
  options: ThreadBuildOptions = {},
): Array<ThreadNode<T>> {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byId = new Map(sorted.map((item) => [item.id, item]));
  const childrenByParent = new Map<string, T[]>();
  const roots: T[] = [];

  for (const item of sorted) {
    const parentId = item.parentId ?? null;

    if (!parentId || !byId.has(parentId) || parentId === item.id) {
      roots.push(item);
      continue;
    }

    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(item);
    childrenByParent.set(parentId, siblings);
  }

  const buildNode = (item: T, depth: number, ancestors: Set<string>): ThreadNode<T> => {
    const childDepth = Math.min(depth + 1, maxDepth);
    const children = childrenByParent.get(item.id) ?? [];
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(item.id);

    return {
      item,
      depth,
      replies: children
        .filter((child) => !nextAncestors.has(child.id))
        .map((child) => buildNode(child, childDepth, nextAncestors)),
    };
  };

  return roots.map((item) => buildNode(item, 0, new Set()));
}

export function flattenThreadTree<T extends ThreadableItem>(
  nodes: Array<ThreadNode<T>>,
): Array<ThreadNode<T>> {
  return nodes.flatMap((node) => [node, ...flattenThreadTree(node.replies)]);
}

export function getThreadPositionLabel(depth: number, replyCount: number): string {
  if (depth === 0) {
    return replyCount === 1
      ? 'Thread starter with 1 reply'
      : `Thread starter with ${replyCount} replies`;
  }

  return replyCount === 1
    ? `Reply level ${depth} with 1 nested reply`
    : `Reply level ${depth} with ${replyCount} nested replies`;
}
