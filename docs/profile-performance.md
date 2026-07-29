# Profile Page Performance
<!-- 
The profile route keeps its static shell server-rendered and limits client JavaScript to the tab interaction layer. -->

## Implementation

## Overview

This project uses URL-based API versioning to protect clients from breaking changes.

- Stable API paths continue to be served at `/api/v1/*`
- Legacy paths under `/api/*` remain supported through a compatibility layer
- Older `/api/*` requests are rewritten to `/api/v1/*` and receive deprecation headers
- `src/app/profile/page.tsx` is a server component that renders the page shell and profile header.
- `src/app/profile/components/ProfileTabs.tsx` owns the small client-side tab state.
- The default profile panel renders first, while settings and achievements are split into lazy-loaded tab panels.
- Shared profile, preference, and achievement data lives in `src/app/profile/profile-data.ts` to avoid recreating arrays during render.
- Tab buttons, settings switches, and achievement cards are memoized so tab and switch updates touch fewer child components.
- Profile edit callbacks are stable, which keeps memoized children from rerendering only because handler identities changed.
- Avatar previews use temporary object URLs instead of base64 data URLs and revoke them when replaced or unmounted.
- Tabs and switches use semantic roles and accessible names so the optimization does not trade away usability.

## Validation

Run the focused regression suite with:

```bash
pnpm vitest run src/app/profile/__tests__/ProfileTabs.test.tsx src/components/shared/ImageUploader.test.tsx
```
