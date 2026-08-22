# useApiResource Hook

Centralized React hook for API request lifecycle management. Replaces manual `useState`/`useEffect` fetching patterns with a reusable, strongly-typed abstraction.

## Canonical API Response Envelope

Defined in `src/types/api.ts`:

```ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

`useApiResource` automatically unwraps this envelope. The hook's `data` property exposes the generic type `T` directly, not the outer wrapper.

For example, if an endpoint returns:

```ts
ApiResponse<{ items: Recommendation[] }>
```

Then `useApiResource<{ items: Recommendation[] }>(...)` exposes `data` as `{ items: Recommendation[] }`.

## Usage

```ts
import { useApiResource } from '@/hooks/useApiResource';

// Automatic fetch on mount
const { data, loading, error, refetch } = useApiResource<ProgressData>('/api/ai/progress');

// Manual fetch (e.g., on form submit)
const { data, loading, error, refetch } = useApiResource<SearchResult[]>('/api/ai/search', {
  method: 'POST',
  manual: true,
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE'` | `'GET'` | HTTP method |
| `body` | `unknown` | `undefined` | Request body for non-GET methods |
| `manual` | `boolean` | `false` | If `true`, skip automatic fetch on mount |
| `signal` | `AbortSignal` | `undefined` | Caller-provided cancellation signal |
| `timeout` | `number` | `API_TIMEOUT_DEFAULT` | Request timeout in ms |
| `useCache` | `boolean` | `false` | Enable GET response caching |
| `ttl` | `number` | `API_CACHE_TTL_DEFAULT` | Cache TTL in ms |

### Return Value

```ts
{
  data: T | null;
  setData: (value: T | null) => void;
  loading: boolean;
  error: Error | null;
  refetch: (overrideOptions?: Partial<UseApiResourceOptions<T>>) => Promise<T | undefined>;
}
```

## Request Cancellation

`useApiResource` composes two cancellation sources:

1. **Caller-provided `AbortSignal`** — forwarded through `RequestConfig` to `apiClient`, which composes it with the internal timeout signal using `AbortSignal.any` (or a manual fallback for older environments).
2. **Internal timeout** — `apiClient` creates its own `AbortController` and aborts after `config.timeout` ms.

Both sources must trigger cancellation independently. `apiClient` does not replace the caller's signal with the timeout signal; it listens to both.

### Cancellation Behavior

- **Unmount**: `useAbortController` aborts the current signal on component unmount. The hook ignores `AbortError` and does not update React state.
- **Dependency change / refetch**: Each call to `getSignal()` aborts the previous signal before creating a new one. Obsolete in-flight requests are cancelled before newer requests start.
- **Stale request protection**: If Request A finishes after Request B, A's closure checks its own (now-aborted) signal and skips the state update. B's result is preserved.

## Loading and Error Handling

- **Loading**: `loading` is `true` while a request is in flight. It resets to `false` on success, API error, or cancellation.
- **Errors**: Real API/network errors are exposed through `error`. Expected cancellations (`AbortError`) are not surfaced as user-facing errors.
- **State safety**: The hook checks `signal.aborted` before calling `setData`/`setError`, preventing updates after unmount.

## refetch()

`refetch()` starts a new request with the current options (or overrides). It:

- Sets `loading` to `true`
- Clears previous `error`
- Aborts any in-flight request via a fresh `AbortSignal`
- Returns the unwrapped payload on success

```ts
const { refetch } = useApiResource<SearchResult[]>('/api/ai/search', { method: 'POST', manual: true });

const search = async (query: string) => {
  const results = await refetch({ body: { query } });
  // results is SearchResult[]
};
```

## Endpoint-Specific Payload Typing

Do not flatten endpoint-specific shapes into the hook's generic. Preserve the real API contract:

```ts
// Endpoint returns: ApiResponse<{ items: Recommendation[] }>
useApiResource<{ items: Recommendation[] }>('/api/ai/recommendations');
// data.items is Recommendation[]

// Endpoint returns: ApiResponse<{ results: SearchResult[] }>
useApiResource<{ results: SearchResult[] }>('/api/ai/search', { method: 'POST', manual: true });
// data.results is SearchResult[]

// Endpoint returns: ApiResponse<ProgressData>
useApiResource<ProgressData>('/api/ai/progress');
// data is ProgressData
```

## Migration Notes

Components previously implemented their own fetching with:

- `apiClient` inside `useEffect`
- Manual `loading`/`error` state
- Manual `AbortController` or `cancelled` flags
- Inconsistent response unwrapping (`res.data`, `r.items`, `r.results`, `r.reply`, direct payload)

All affected components now use `useApiResource`:

| Component | Endpoint | Payload |
|-----------|----------|---------|
| `SmartNotifications` | `GET /api/ai/reminders` | `Reminder[]` |
| `PersonalizedRecommendations` | `GET /api/ai/recommendations` | `{ items: Recommendation[] }` |
| `NaturalLanguageQuery` | `POST /api/ai/search` | `{ results: SearchResult[] }` |
| `LearningAssistant` | `POST /api/ai/chat` | `{ reply: string }` |
| `IntelligentProgress` | `GET /api/ai/progress` | `ProgressData` |
| `FollowingSystem` | `GET /api/social/{tab}/{userId}` | `SocialUser[]` |
| `ExportButton` | `POST /api/exports/execute` | `{ result: ExportButtonResult }` |

## Performance / Lifecycle Evidence

Measured via `src/hooks/__tests__/useApiResource.test.tsx`:

- **Zero pending requests after unmount**: The `request lifecycle benchmark` test verifies that after `unmount()`, the pending request set size returns to `0`.
- **Stale request cancellation**: The `stale request does not overwrite newer result` test confirms Request A's result is ignored when Request B completes first.
- **Unmount safety**: The `does not update state after unmount` test confirms `data` and `error` remain `null` when a request resolves after the component has unmounted.

These tests provide reproducible evidence that:
- Requests are actively cancelled on unmount (not left pending)
- Obsolete requests cannot overwrite newer results
- No state updates occur after unmount

## Implementation Details

- Built on `useAbortController` (`src/hooks/useAbortController.ts`) for signal lifecycle.
- `apiClient` (`src/lib/api.ts`) forwards caller signals via `AbortSignal.any` with a manual fallback.
- `ApiResponse<T>` (`src/types/api.ts`) is generic and unwrapped automatically by the hook.
