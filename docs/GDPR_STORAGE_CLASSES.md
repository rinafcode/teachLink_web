# GDPR Storage Classes

## Problem

The cookie consent store (`src/lib/consent/store.ts`) already tracks which
consent categories (`necessary`, `analytics`, `functional`, `marketing`) a
user has accepted. Nothing, however, tied that decision to the actual
browser storage (`localStorage`, `sessionStorage`, cookies) the app writes.
A feature could write an analytics identifier to `localStorage` regardless
of the user's choice, and revoking a previously granted category didn't
clear anything that had already been written — both of which are GDPR
gaps (Art. 7(3): withdrawing consent must be as easy, and as effective, as
giving it).

## Solution: Storage Classes

`src/lib/consent/storageClasses.ts` introduces a small enforcement layer on
top of the existing consent store:

- **Declare** which consent category a storage key belongs to via a
  `StorageClassDescriptor { key, category, area }`.
- **Gate** reads/writes: `setClassifiedItem`/`getClassifiedItem` only touch
  storage when the descriptor's category is currently consented to.
- **Purge**: `purgeDisallowedStorage()` removes any registered entry whose
  category is no longer allowed. `enforceStorageClasses()` runs a purge
  immediately and again on every consent change (via
  `useConsentStore.subscribe`).

### Usage

```ts
import { setClassifiedItem, getClassifiedItem } from '@/lib/consent/storageClasses';

// Only written if the user has consented to "analytics".
setClassifiedItem({ key: 'ga_client_id', category: 'analytics', area: 'localStorage' }, clientId);

// Returns null if the category isn't consented to, even if a stale value
// is still physically present.
const clientId = getClassifiedItem('ga_client_id');
```

Supported `area` values: `localStorage`, `sessionStorage`, `cookie`.

### Enforcement

`useStorageClassEnforcement()` is called once from
`src/components/consent/CookieConsentBanner.tsx`, which is always mounted
(see `RootProviders`). This means:

- On app load, any storage left over from a category the user has since
  revoked (e.g. across browser sessions) is purged immediately.
- Whenever the user changes their preferences in `CookiePreferencesModal`
  (accept all / reject all / save custom preferences), any storage tied to
  a category that's no longer allowed is purged automatically.

### Testing

- `src/lib/consent/__tests__/storageClasses.test.ts` — unit tests for
  registration, gating, purging, and the enforcement subscription across
  all three storage areas.
- `src/components/consent/__tests__/CookieConsentBanner.test.tsx` — verifies
  the banner purges disallowed storage on mount.

Run: `pnpm test src/lib/consent src/components/consent`
