# Web Brand Asset Governance Policy

## Purpose

This policy defines which brand assets TeachLink Web uses, where they live, how
they may be used, and how a contributor requests a new or changed asset. It
keeps the visual identity consistent and reviewable: a small, versioned asset
set, explicit usage rules, and a recorded decision for every change.

## Scope

This policy covers the TeachLink brand identity as it appears in the web client:
the TeachLink wordmark, the application (favicon) icon, the PWA identity in the
web app manifest, the brand colour, and the surfaces that render them —
notifications, the offline page, and install prompts. It applies to every
contributor and reviewer of user-facing brand assets and to any file shipped
from `public/` or `src/app/` that presents the product's identity.

Styling mechanics for CSS, tokens, and component classes are governed separately
by `Governance/domains/CSS_GOVERNANCE.md`; this policy governs what the brand
assets are and where they may appear.

The `StellarSplit` lockup with the `V3` badge rendered by
`src/components/layout/HeaderComponent.tsx` on the grant/escrow surface is a
separate product identity and is outside the approved TeachLink set defined here.
Bringing it into the TeachLink identity follows the request process below.

## Approved Asset Set

The table below is the complete approved inventory. The files are the source of
truth; no asset outside this inventory is approved for brand use.

| Asset | Path | Format | Allowed contexts |
| --- | --- | --- | --- |
| TeachLink wordmark | `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/mobile/AdaptiveNavigation.tsx` (`brandName`, default `TeachLink`) | Styled text — there is no image logo file | Site header, footer, mobile navigation, auth screens, and the product name in body copy |
| TeachLink app icon | `src/app/favicon.ico` | ICO | Browser tab, bookmarks, and the notification icon and badge served by `public/sw.js` |
| PWA identity | `public/manifest.json` (`name`, `short_name`) | JSON | Install prompt, add-to-home-screen, and installed-app surfaces |
| Brand blue | `#2563eb`, declared as `theme_color` in `public/manifest.json` and rendered as `text-blue-600` | CSS colour | Wordmark, primary links and actions, and the offline page call to action |
| Brand blue, dark theme | `#60a5fa`, rendered as `text-blue-400` | CSS colour | Wordmark and links on dark surfaces |
| Brand white | `#ffffff`, declared as `background_color` in `public/manifest.json` | CSS colour | PWA splash background and light-surface text on brand blue |
| Offline brand surface | `public/offline.html` | HTML | Offline fallback page served by `public/sw.js` |

The wordmark is text, not an image. It must be rendered from the string
`TeachLink` in the components above so that it stays translatable, selectable,
and accessible; it must not be replaced by a raster or vector logo file.

### PWA icon set (required, not yet committed)

`public/manifest.json` declares PNG icons at `/icons/icon-192x192.png`
(`any maskable`), `/icons/icon-384x384.png`, and `/icons/icon-512x512.png`, and
`src/components/pwa/NativeIntegrationLayer.tsx` uses `/icons/icon-192x192.png`
as the notification icon. Those files are not currently present in the
repository. They are required assets under this policy and must be added at the
declared paths, sizes, and formats before the PWA install surface is complete.
Until they are added, no code may introduce a different icon path or a competing
icon name.

## Usage Rules

### Clear space and minimum size

- The wordmark must keep clear space of at least its cap height on every side.
  In the header it must not be crowded against the search or navigation
  controls; the existing `gap-4` spacing between the wordmark and adjacent
  controls is the minimum and must not be reduced.
- The wordmark is text: the minimum rendered size is `text-xl` (20px), the value
  used in the header, mobile navigation, and auth screens. Do not render it
  smaller, in all capitals, or with custom letter spacing.
- The app icon must ship the sizes the platform requests: 16x16, 32x32, and
  48x48 in the `.ico`, and the 192, 384, and 512 PNGs in the PWA icon set. Do
  not scale one raster up to fill a larger slot.
- Brand assets must stay legible at 200% browser zoom and must not be clipped or
  overlapped by surrounding UI at that zoom.

### Colour and background

- As an identity mark (header, footer, mobile navigation), the wordmark uses the
  brand blue: `text-blue-600` (`#2563eb`) on light surfaces and `text-blue-400`
  (`#60a5fa`) on dark surfaces, including the existing hover variants.
- Where the product name appears inside a heading or sentence — the auth
  screens, which use `text-gray-900`, and the home hero, which uses
  `text-blue-400` — it may use the surrounding heading colour or the brand blue.
  No other colour is approved.
- Browser and installed-app chrome use `theme_color` `#2563eb`; the PWA splash
  background uses `background_color` `#ffffff`. Change these values only through
  the request process below.
- Do not place the wordmark on a photographic or patterned background, or on any
  surface where the measured contrast falls below the thresholds in the
  accessibility section.
- Brand colour used as a large fill (the offline page button) must pair with
  white text; never pair the brand blue with dark text.

### Accessibility

- Every brand asset must meet WCAG 2.1 Level AA contrast: at least 4.5:1 for
  normal text, and 3:1 for large text (24px, or 18.66px bold) and for non-text UI
  components.
- The pairings already in use in this project have been measured as: `#2563eb`
  on `#ffffff` at 5.17:1, `#60a5fa` on the dark background `#030712` at 7.92:1,
  and white on `#2563eb` at 5.17:1. Every new foreground/background pairing must
  be measured and recorded in its request before it is adopted.
- The wordmark must never convey meaning through colour alone; it is always an
  accessible link or heading with readable text.
- The app icon and PWA icons are non-text assets. Their foreground must stay
  legible on both light and dark home-screen backgrounds, which is why the
  192x192 icon is declared `any maskable`; keep the maskable safe zone clear of
  essential detail.

### Do nots

- Do not redraw, recolour, rotate, skew, stretch, outline, or add shadows,
  gradients, or other effects to the wordmark.
- Do not add a second logo, an icon font, or a third-party logo anywhere under
  `public/` or `src/`.
- Do not ship the Next.js starter SVGs in `src/public/` (`next.svg`,
  `vercel.svg`, `globe.svg`, `window.svg`, `file.svg`) as product brand assets;
  they are framework templates and are not part of the brand set.
- Do not point the favicon, manifest icon, or notification icon fields at any
  path other than the approved paths above.
- Do not bake the wordmark into a raster image, a screenshot, or a canvas.

## Request Process

Anyone may request a new or changed brand asset. The process follows the
project's normal issue and pull request flow.

1. **Request.** Open an issue labelled `governance` describing the need: which
   asset, which surface, why the current inventory is insufficient, and how the
   change serves users. A structural change — a new logo, a new brand colour, or
   a change to the wordmark — requires an RFC under
   `Governance/processes/RFC_PROCESS.md` before implementation.
2. **Supply the artefacts.** Attach or link the following in the issue:
   - The master source (SVG or editable original), not only an export.
   - Raster exports at 1x and 2x for each size the surface needs.
   - A replacement `favicon.ico` when the app icon changes.
   - The exact manifest and metadata fields the change updates.
   - The measured contrast ratio for every new foreground/background pairing.
   - The provenance and licence of any third-party asset.
3. **Review.** Maintainers review the request against this policy, the project's
   values, and the accessibility thresholds.
4. **Implement.** An approved change ships in a pull request that touches only
   the affected asset paths plus this document, references the issue with a
   closing keyword, and passes the project's quality gates (`type-check`,
   `lint`, `build`, `test`).
5. **Record.** The decision and its reasoning are recorded in the issue or pull
   request thread, and the accepted asset is added to the approved set above in
   the same pull request. Version control is the archive; superseded assets are
   removed rather than kept.

### Who approves

- **Maintainers** own this policy and approve every new or changed brand asset,
  consistent with the decision authority in `Governance/CHARTER.md`.
- **Contributors** may propose assets, prepare the artefacts, and implement an
  approved change.
- **The community** provides feedback through the issue thread.

### Review SLA

- A brand asset request with complete artefacts is acknowledged within **3
  business days** and receives a decision within **10 business days**. If
  artefacts are incomplete, the review clock restarts when they are supplied.
- A request that needs an RFC follows the RFC lifecycle; the 10-business-day
  target then applies to the implementation pull request, not to the RFC.
- When a security, accessibility, or availability problem requires an urgent
  brand fix, the hotfix process in `Governance/processes/HOTFIX.md` applies and
  the decision is documented after the fact.

## Ownership and Review

- Maintainers own this policy and review the approved asset set on a regular
  cadence, and whenever the wordmark, app icon, brand colour, or PWA identity
  changes.
- Changes to this policy, and any exception to the usage rules, are proposed in
  a pull request that touches only the `Governance/` folder and must be approved
  before adoption.

## Success

This policy succeeds when the brand identity of TeachLink Web is rendered from a
single versioned asset set, contributors can request a brand change without
guessing, and every shipped brand asset meets the accessibility thresholds
above.
