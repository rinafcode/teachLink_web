# CSS and Styling Governance Policy

## Purpose

This policy defines how CSS and styling are written, organized, reviewed, and
maintained in TeachLink Web. It keeps the stylesheet surface predictable and
reviewable: consistent naming, a clear separation between global and scoped
styles, and a standing rule for removing styles that are no longer used.

## Scope

All styling in TeachLink Web is covered by this policy: global stylesheets,
dedicated stylesheets under `src/styles/`, utility classes, and styling that
flows through the component library. It applies to every contributor and
reviewer of user-facing styles.

## Styling Approach

- Tailwind CSS is the primary styling approach for UI work. Prefer Tailwind
  utility classes in components for layout, spacing, typography, and color so
  that styles stay local to the markup that uses them. Dark mode uses the
  class strategy and its `dark:` variants.
- Design tokens (colors, fonts, animations) are CSS custom properties defined
  once in the `:root` block of `src/app/globals.css` and mapped into Tailwind
  through the configuration (for example `background: var(--background)`).
  New colors, sizes, or fonts must go through these tokens instead of
  hardcoded values scattered in components; no new raw hex values outside the
  token definitions.
- `src/app/globals.css` is the entry stylesheet: Tailwind's import, token
  definitions, base resets, and truly global rules only. Repeated composite
  patterns may use `@apply` there, but component-specific one-off rules do
  not belong in global styles.
- Cross-page concerns (animations, print) live in dedicated stylesheets under
  `src/styles/` (for example `animations.css`, `print.css`) and are imported
  once from `globals.css`. Component-specific styles do not go there.
- Do not introduce a new styling system, CSS-in-JS library, preprocessor, or
  CSS Modules. New dependencies in this area require a governance change to
  this policy.

## Naming Conventions

- Tailwind utility classes follow Tailwind's own naming; do not alias or
  re-export them behind custom class names.
- Custom helper classes in dedicated stylesheets use `kebab-case` with a
  descriptive purpose prefix matching their file's domain (the existing
  convention: `anim-` and `preset-` in `animations.css`, `no-print` in the
  print rules). One prefix family per stylesheet; do not invent a second
  prefix for the same concern.
- Custom properties (tokens) use `kebab-case` namespaced by their area (for
  example `--background`, `--font-sans`, `--a11y-font-scale`).
- Accessibility-related classes keep their established names (`a11y-*`);
  they are part of the contract used by providers and tests.

## Dead-Style Cleanup Rule

- Styles with no importer or no element using them are dead styles and must be
  removed in the same change that removes their last usage.
- When a component or page is removed, any classes that only served it must
  be removed in the same pull request.
- Global classes that no selector matches anymore must be deleted rather
  than kept "just in case"; version control is the archive.
- Dedicated stylesheets under `src/styles/` must not accumulate helpers for
  removed features: when the last consumer of a helper class or preset is
  deleted, the helper is deleted in the same pull request.
- Dead-style cleanup is part of the definition of done for styling changes.
  Reviewers should reject changes that orphan styles.
- Targeted cleanup PRs may remove accumulated dead styles, but must stay
  limited to styles (no application-logic changes) and follow the normal
  review process.

## States: Loading, Empty, Error, and Fallback

- Every user-facing styled surface must define its loading, empty, error, and
  fallback states as part of the same change that introduces it. An unstyled
  raw state is a styling bug, not a follow-up.
- Loading states use the shared skeleton components rather than one-off
  spinners where the surface shows structured content.
- Empty states must communicate what will appear here and the next action the
  user can take, styled with the same tokens as the rest of the surface.
- Error and fallback states must be readable without JavaScript and must not
  rely on color alone to convey meaning (see the accessibility section of the
  contribution docs).

## Accessibility and Tokens

- Color alone must never convey state; pair color with text or icons.
- Text contrast must meet WCAG 2.1 AA in both light and dark themes.
- Focus styles must remain visible; do not remove focus outlines without
  replacing them with an equally visible alternative.
- Respect `prefers-reduced-motion` for all animation and transitions.

## Ownership and Review

- The maintainers of the styling system own this policy and review it on a
  regular cadence.
- Changes to this policy, additions of styling systems, or exceptions to the
  dead-style cleanup rule are proposed in a pull request that touches only the
  `Governance/` folder and must be approved before adoption.

## Success

This policy succeeds when styling in TeachLink Web stays consistent and
predictable, naming is uniform across the codebase, no orphaned styles
accumulate, and every user-facing surface ships with complete loading, empty,
error, and fallback states.
