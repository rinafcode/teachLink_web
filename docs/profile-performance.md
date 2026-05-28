# Profile Page Performance

The profile route keeps its static shell server-rendered and limits client JavaScript to the tab interaction layer.

## Implementation

- `src/app/profile/page.tsx` is a server component that renders the page shell and profile header.
- `src/app/profile/components/ProfileTabs.tsx` owns the small client-side tab state.
- The default profile panel renders first, while settings and achievements are split into lazy-loaded tab panels.
- Shared profile, preference, and achievement data lives in `src/app/profile/profile-data.ts` to avoid recreating arrays during render.
- Tabs and switches use semantic roles and accessible names so the optimization does not trade away usability.

## Validation

Run the focused regression suite with:

```bash
pnpm vitest run src/app/profile/__tests__/ProfileTabs.test.tsx
```
