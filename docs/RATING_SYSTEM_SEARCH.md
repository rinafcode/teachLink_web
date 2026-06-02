# Rating System — Review Search Engine

The Rating System (`CourseReviews`) ships with a lightweight, dependency-free
search engine that lets students search, filter and sort course reviews. The
engine lives in [`src/utils/reviewSearch.ts`](../src/utils/reviewSearch.ts) and
is consumed by [`src/components/courses/CourseReviews.tsx`](../src/components/courses/CourseReviews.tsx).

## Why

Previously reviews were rendered as a static list. As the number of reviews
grows this becomes hard to navigate. The search engine lets users:

- **Search** review text and reviewer names with relevance ranking.
- **Filter** by minimum star rating.
- **Sort** by relevance, recency, rating (high/low) or helpfulness.

## API

```ts
import { searchReviews, type ReviewSearchOptions } from '@/utils/reviewSearch';

const results = searchReviews(reviews, {
  query: 'practical examples',
  minRating: 4,
  sortBy: 'mostHelpful',
});
// results: ScoredReview<T>[]  →  [{ review, relevanceScore }, ...]
```

### `searchReviews(reviews, options)`

| Option      | Type                                                                          | Default       | Description                                               |
| ----------- | ----------------------------------------------------------------------------- | ------------- | --------------------------------------------------------- |
| `query`     | `string`                                                                      | `''`          | Free-text query matched against the comment and name.     |
| `minRating` | `number`                                                                      | _none_        | Drops reviews below this rating. `0`/negative is ignored. |
| `sortBy`    | `'relevance' \| 'newest' \| 'highestRated' \| 'lowestRated' \| 'mostHelpful'` | `'relevance'` | Sort order for the matching reviews.                      |

The function is **pure** — it never mutates the input array, so it is safe to
call inside `useMemo`. When a query is present, reviews that match none of the
terms are excluded.

### Relevance scoring

`scoreReview(review, terms)` ranks matches as follows:

- A match in the **reviewer name** is worth `3` points; a match in the
  **comment** is worth `1` point per occurrence.
- A review that matches **every** search term receives a bonus of
  `terms.length * 2`, so full-coverage matches rank above partial ones.
- Ties in relevance are broken by recency (newest first).

### Helpers

- `relativeDateToDays(date)` — converts a relative date string such as
  `"2 days ago"` or `"1 week ago"` into an approximate number of days, used for
  recency sorting. Unknown formats sort last.
- `highlightTerms(text, query)` — splits text into `{ text, match }` segments so
  the UI can highlight matched terms while preserving the original casing.

## Accessibility

The search controls in `CourseReviews` are fully labelled:

- The search input, rating filter and sort `<select>` each have an associated
  `sr-only` `<label>`.
- The results count uses `aria-live="polite"` so screen readers announce how
  many reviews match after each change.
- Decorative SVG icons are marked `aria-hidden`.

## Tests

Unit tests live in
[`src/utils/__tests__/reviewSearch.test.ts`](../src/utils/__tests__/reviewSearch.test.ts)
and cover date parsing, relevance scoring, filtering, every sort key,
combined query + filter, immutability and highlighting.

```bash
pnpm test src/utils/__tests__/reviewSearch.test.ts
```

## Performance

The engine runs in `O(n · m)` where `n` is the number of reviews and `m` the
number of search terms — negligible for realistic review counts. The component
wraps the call in `useMemo`, so it only re-runs when the reviews, query, filter,
sort key or live "helpful" counts change.
