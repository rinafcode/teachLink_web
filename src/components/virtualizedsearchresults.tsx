import React, { useCallback, memo, useMemo } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export type SearchResultType = 'course' | 'user' | 'post' | 'file';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, string | number>;
}

const ITEM_HEIGHT_MAP: Record<SearchResultType, number> = {
  course: 96,
  user: 72,
  post: 110,
  file: 64,
};

interface SearchResultItemProps {
  result: SearchResult;
  style: React.CSSProperties;
  onSelect?: (result: SearchResult) => void;
}

const SearchResultItem = memo(({ result, style, onSelect }: SearchResultItemProps) => (
  <div
    style={style}
    className={`search-result-item search-result-item--${result.type}`}
    onClick={() => onSelect?.(result)}
    role="option"
    aria-selected="false"
  >
    <div className="search-result-icon">
      {result.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={result.icon} alt="" aria-hidden="true" />
      ) : (
        <span className="search-result-type-badge">{result.type[0].toUpperCase()}</span>
      )}
    </div>
    <div className="search-result-content">
      <span className="search-result-title">{result.title}</span>
      {result.subtitle && <span className="search-result-subtitle">{result.subtitle}</span>}
      {result.description && <p className="search-result-description">{result.description}</p>}
    </div>
    <span className="search-result-type-label">{result.type}</span>
  </div>
));

SearchResultItem.displayName = 'SearchResultItem';

interface VirtualizedSearchResultsProps {
  results: SearchResult[];
  onResultSelect?: (result: SearchResult) => void;
  isLoading?: boolean;
  query?: string;
  className?: string;
}

const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  results,
  onResultSelect,
  isLoading,
  query,
  className,
}) => {
  const getItemSize = useCallback(
    (index: number) => ITEM_HEIGHT_MAP[results[index]?.type] ?? 80,
    [results],
  );

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => (
      <SearchResultItem result={results[index]} style={style} onSelect={onResultSelect} />
    ),
    [results, onResultSelect],
  );

  // Compute total estimated height for small result sets (avoids AutoSizer overhead)
  const estimatedTotalHeight = useMemo(
    () => results.reduce((sum, r) => sum + (ITEM_HEIGHT_MAP[r.type] ?? 80), 0),
    [results],
  );

  if (isLoading) {
    return (
      <div className="search-results-loading" role="status" aria-live="polite">
        <div className="skeleton-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-item" />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="search-results-empty">
        <p>No results found for &ldquo;{query}&rdquo;</p>
      </div>
    );
  }

  return (
    <div
      className={`virtualized-search-results ${className ?? ''}`}
      role="listbox"
      aria-label="Search results"
    >
      <AutoSizer disableHeight={estimatedTotalHeight < 600}>
        {({ height, width }) => (
          <List
            height={Math.min(height ?? 600, estimatedTotalHeight)}
            itemCount={results.length}
            itemSize={getItemSize}
            width={width}
            overscanCount={8}
            estimatedItemSize={88}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualizedSearchResults;
