import React, { memo, useCallback, type ReactNode } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface InfiniteListProps<T> {
  /** The complete data set rendered so far (grows as pages are appended). */
  items: T[];
  /** Height in pixels for each row. */
  itemHeight: number;
  /** Called when the bottom sentinel comes into view. */
  onLoadMore: () => Promise<void> | void;
  /** Whether more data exists beyond what is already loaded. */
  hasNextPage: boolean;
  /**
   * Render a single row. Receive the item and an explicit `style` object that
   * **must** be forwarded to the outermost element for react-window to size
   * rows correctly.
   */
  renderRow: (item: T, style: React.CSSProperties, index: number) => ReactNode;
  /** Optional fixed height for the list container (defaults to "fill parent"). */
  height?: number;
  /** Optional class applied to the outermost wrapper. */
  className?: string;
  /** Override the number of items rendered outside the visible window. */
  overscanCount?: number;
}

export function InfiniteList<T>({
  items,
  itemHeight,
  onLoadMore,
  hasNextPage,
  renderRow,
  height: fixedHeight,
  className,
  overscanCount = 5,
}: InfiniteListProps<T>) {
  const { sentinelRef, loading, error, loadMore } = useInfiniteScroll({
    onLoadMore,
    hasNextPage,
  });

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) =>
      renderRow(items[index]!, style, index) as React.ReactElement,
    [items, renderRow],
  );

  const listContent = (h: number, w: number) => (
    <List
      height={h}
      width={w}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  );

  return (
    <div
      className={`infinite-list ${className ?? ''}`}
      style={fixedHeight ? { height: fixedHeight } : undefined}
    >
      {fixedHeight ? (
        listContent(fixedHeight, 0)
      ) : (
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) =>
            listContent(height, width) as React.ReactElement
          }
        </AutoSizer>
      )}

      {/* Intersection sentinel for automatic loading */}
      <div ref={sentinelRef} className="infinite-list__sentinel" aria-hidden="true" />

      {loading && (
        <div className="infinite-list__loading" role="status" aria-live="polite">
          <span className="sr-only">Loading more items…</span>
          <div className="infinite-list__spinner" />
        </div>
      )}

      {!loading && hasNextPage && (
        <div className="infinite-list__load-more">
          <button
            type="button"
            onClick={loadMore}
            className="infinite-list__load-more-btn"
            aria-label="Load more items"
          >
            Load more
          </button>
        </div>
      )}

      {error && (
        <div className="infinite-list__error" role="alert">
          <p>Failed to load more items.</p>
          <button type="button" onClick={loadMore}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(InfiniteList) as typeof InfiniteList;
