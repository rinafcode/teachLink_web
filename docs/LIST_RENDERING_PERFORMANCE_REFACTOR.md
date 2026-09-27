# List Rendering Performance Refactor

This document details a performance refactor of the highest-traffic list-rendering surfaces in the TeachLink web app.

## Problem

Several components rendered an entire in-memory collection on every render with no windowing or pagination, and rebuilt per-row/per-item callbacks (and, in one case, non-memoized row components) on every render. Together this meant every keystroke, selection toggle, or unrelated state change re-rendered the *entire* list, with cost growing linearly (or worse) with list size.

## Changes per file

| File | Pagination | Row/item memoization | Callback stabilization |
| :--- | :--- | :--- | :--- |
| `src/components/ui/Table.tsx` | Prev/Next footer, default `pageSize=25` (overridable via prop) | `TableRow` wrapped in `React.memo` (`MemoizedTableRow`) | `toggleSelectRow` now reads the latest selection from a ref instead of depending on `selectedRowKeys`, so its identity — and therefore every row's `onSelect` prop — stays stable across selection changes |
| `src/components/notificationcenter.tsx` | "Load more" (accumulates), page size 20 | `NotificationItem` wrapped in `React.memo` | `markAsRead`/`clearNotification` were already `useCallback`'d in `Notificationprovider.tsx` |
| `src/components/admin/ApprovalQueue.tsx` | Prev/Next footer, page size 10 | New `ApprovalItemRow` (`React.memo`) extracted from inline JSX | `review` is `useCallback`'d on `[user]` only; the per-item review note moved from a `Record<string, string>` on the parent into **local state inside each row**, so typing in one row's textarea no longer busts every other row's props |
| `src/components/cms/MediaManager.tsx` | "Load more" (accumulates), page size 10 | New `MediaQueueItem` (`React.memo`) extracted from inline JSX | No per-item callbacks exist on this component; memoization alone stops unrelated queue items re-rendering on another item's progress tick (the store already returns stable object references for untouched items) |
| `src/components/social/FollowingSystem.tsx` | Prev/Next footer, page size 15, resets to page 1 on tab switch or search | `UserRow` wrapped in `React.memo` | N/A — each row owns its follow state via `useFollowUser` |
| `src/components/social/SocialProfile.tsx` | N/A (no list) | Whole component wrapped in `React.memo` for consistency | N/A |
| `src/components/BulkActions.tsx` | N/A (renders a small static action bar, not a data-driven list) | N/A | Already fully `useCallback`'d (`handleBulkOperation`, `handleUndo`, `handleRedo`, `handleCancel`) — no changes needed |
| `src/components/dashboard/AdvancedDashboard.tsx` / `DashboardPanelCard.tsx` | N/A (≈4 panels, already `useMemo`'d) | `DashboardPanelCard` wrapped in `React.memo` (was the one un-memoized piece; everything else — `sortedPanels`, all handlers, `SortablePanel` — was already memoized) | Already `useCallback`'d in `useDashboardData.tsx` |

Pagination uses a new shared hook, `src/hooks/usePagination.ts` (plain array slicing over an already-loaded in-memory array, clamps the current page when the underlying list shrinks). `src/components/InfiniteList.tsx` (react-window + `AutoSizer`) was deliberately **not** reused here: `AutoSizer` measures real DOM layout, which is 0×0 in jsdom, so it renders zero rows under Testing Library and would have broken every existing test for these components. None of the 8 files have a server-paginated "hasNextPage" shape today, so client-side pagination is the natural fit; `InfiniteList` remains available for a future server-paginated feed.

## Pre-existing bugs fixed as drive-bys

Found while reading these files for the refactor, fixed in the same diff since both files were already being touched:

- **`notificationcenter.tsx`**: the no-avatar fallback branch was `{avatarUrl ? <Image ... /> : ({TYPE_ICON[type]})}` — the extra `{}` around `TYPE_ICON[type]` inside the ternary's expression slot is invalid. Fixed to `TYPE_ICON[type]`. There was no test exercising this branch before, so it was unguarded; a regression test now covers it (`src/components/__tests__/notificationcenter.test.tsx`).
- **`admin/ApprovalQueue.tsx`**: the Approve button's visible text was "Approve It", but `src/app/api/approvals/__tests__/approvals.test.tsx` asserted `getByRole('button', { name: /^approve$/i })` (exact match). This was failing on `main` independent of this refactor. Fixed the button text to "Approve" (consistent with the single-word "Reject" label next to it).

Also removed an unused `X` icon import from `MediaManager.tsx` while touching its import list.

**Not fixed** (found but out of scope — unrelated to list rendering, both flaky/pre-existing on `main`): `MediaManager.test.tsx` has two tests (`should clear all intervals when component unmounts during ongoing uploads`, `should prevent default drag behavior`) that fail intermittently due to a `DragEvent`/spy interaction quirk in jsdom + a `Math.random()`-timed upload-progress simulation; reproduced identically on `main` before this refactor.

## Before / after numbers

Captured via `React.Profiler` in the new `*.bench.test.tsx` files (no browser profiling dependency — runs in CI under Vitest/jsdom). Each measures the render cost of a single unrelated-item update against a realistic list size:

```
[bench:Table] select 1/300 rows -> before: 50.609ms (unmemoized) | after: 0.000ms (memoized rows, stable onSelect)
[bench:NotificationCenter] update after 1/50 changed -> 1 commit(s), 0.806ms total actualDuration
[bench:FollowingSystem] 1 row follow-toggle / 50 rows -> 1 commit(s), 0.326ms total actualDuration
[bench:DashboardPanelCard] unchanged-props re-render -> 1 commit(s), 0.027ms actualDuration (memoized bailout)
```

The `Table` benchmark is the clearest before/after comparison: it reconstructs the pre-refactor shape (unmemoized row, fresh inline `onSelect` closure per row, no pagination) side by side with the current implementation, both rendering 300 rows and reacting to a single checkbox toggle. The unmemoized version re-renders all 300 rows (~50.6ms of render work); the memoized, paginated version does effectively none. The other benchmarks assert an absolute bound (well under what an unmemoized equivalent would cost) rather than a literal side-by-side reconstruction, to keep the test files focused.

Re-run any of these locally with, e.g.:

```
pnpm vitest run src/components/ui/__tests__/Table.bench.test.tsx
```

## Testing

- `src/components/ui/__tests__/Table.test.tsx` — added `pagination` and `memoization` describe blocks; existing gesture/resize/selection tests unchanged and still passing.
- `src/components/ui/__tests__/Table.bench.test.tsx` — new, before/after benchmark.
- `src/components/__tests__/notificationcenter.test.tsx` — new (none existed before): fallback-icon regression, "Load more" pagination, benchmark.
- `src/components/cms/MediaManager.test.tsx` — added a `Pagination` describe block; existing declaration-order/interval-cleanup/integration tests unchanged.
- `src/app/api/approvals/__tests__/approvals.test.tsx` — added `pagination` describe block plus a review-note-isolation test; the two previously-failing `/^approve$/i` assertions now pass.
- `src/components/social/__tests__/FollowingSystem.test.tsx` — new (none existed before): pagination, tab-switch page reset, benchmark.
- `src/components/dashboard/__tests__/DashboardPanelCard.bench.test.tsx` — new, memoized-bailout benchmark. Existing `AdvancedDashboard.test.tsx` assertions unchanged.

## Explicitly out of scope

- **`SocialProfile.tsx`**: has no real follower/activity list today (placeholder text per tab) — product decision was to skip virtualization here rather than build out new list UI as part of a performance ticket.
- **`ActivityFeed.tsx` / `TopicFeed.tsx` / `useActivityFeed.ts` / `useTopicFeed.ts`**: not among the 8 files named in the ticket; left untouched to avoid scope creep. Candidate for a follow-up ticket if "the feeds" was meant to include them.
- **`BulkActions.tsx`**: already fully `useCallback`'d and renders a small static button bar, not a data-driven list — no functional change made.
