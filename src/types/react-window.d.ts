declare module 'react-window' {
  import type { ComponentType, CSSProperties, ReactElement, ReactNode } from 'react';

  export interface FixedSizeListProps {
    children: ComponentType<{ index: number; style: CSSProperties; data: unknown }>;
    height: number;
    itemCount: number;
    itemSize: number;
    width: number;
    overscanCount?: number;
    itemKey?: (index: number, data: unknown) => string | number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    ref?: React.Ref<unknown>;
    style?: CSSProperties;
    className?: string;
    layout?: 'vertical' | 'horizontal';
  }

  export interface FixedSizeList {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
  }

  export const FixedSizeList: ComponentType<FixedSizeListProps>;
}

declare module 'react-virtualized-auto-sizer' {
  import type { ComponentType, ReactNode } from 'react';

  interface AutoSizerProps {
    children: (size: { height: number; width: number }) => ReactNode;
    className?: string;
    style?: React.CSSProperties;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (size: { height: number; width: number }) => void;
  }

  const AutoSizer: ComponentType<AutoSizerProps>;
  export default AutoSizer;
}
