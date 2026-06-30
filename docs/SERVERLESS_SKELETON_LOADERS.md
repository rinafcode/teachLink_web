# Serverless Skeleton Loaders

TeachLink uses Next.js App Router `loading.tsx` files for route-level skeleton loaders. These files are rendered by the serverless route response while the page segment streams, so users receive immediate layout feedback without waiting for client JavaScript to hydrate.

## Architecture

- Shared skeleton markup lives in `src/components/ui/ServerlessSkeleton.tsx`.
- Low-level placeholders in `src/components/ui/Skeleton.tsx` and `src/components/ui/LoadingSkeleton.tsx` are server-component compatible and do not use hooks, browser APIs, timers, or client-only state.
- Route loading boundaries import `ServerlessPageSkeleton` and select a layout variant for the target route.
- Decorative placeholder blocks are `aria-hidden`, while the loading region exposes `role="status"` and `aria-busy="true"` for assistive technology.

## Adding A Route Skeleton

Create or update the route segment `loading.tsx` and use the closest matching variant:

```tsx
import { ServerlessPageSkeleton } from '@/components/ui/ServerlessSkeleton';

export default function Loading() {
  return <ServerlessPageSkeleton variant="courses" label="Loading courses" />;
}
```

Use the default variant for pages without a custom layout. Add a new variant only when the page needs a meaningfully different information architecture.

## Serverless Guidelines

- Keep route skeletons deterministic so they can render in a cold serverless invocation.
- Avoid `use client` unless the skeleton needs real browser interaction.
- Avoid fetching data from skeleton components; data belongs in the page or nested server components.
- Preserve approximate final layout dimensions to minimize cumulative layout shift.
- Keep labels specific to the page, for example `Loading dashboard` or `Loading search results`.

## Verification

Run focused tests after changing skeleton behavior:

```bash
pnpm vitest run src/components/ui/__tests__/ServerlessSkeleton.test.tsx
```
