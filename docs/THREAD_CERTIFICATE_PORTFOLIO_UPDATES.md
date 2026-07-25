# Thread, Certificate, and Portfolio Updates

## Accessibility Thread Support

- Discussion messages now support `parentId` so replies render as nested thread items.
- Thread rendering uses `role="list"` / `role="listitem"` and concise ARIA labels such as "Thread starter with 1 reply".
- Malformed thread data is handled defensively: missing parents and self-parented messages render as root messages.
- Visual nesting is capped to avoid runaway indentation and keep long conversations readable.

## Discussion Forum Certificate Management

- Study groups include a Certificates tab for issuing and revoking forum certificates.
- Certificate fingerprints are normalized and must be valid 64-character SHA-256 hex strings.
- Active duplicate fingerprints are rejected to prevent ambiguous trust state.
- Certificate state is derived as `active`, `expired`, or `revoked` and persists with the existing local study-group storage.

## Review Portfolio Management

- Course reviews can attach portfolio evidence such as projects, repositories, case studies, and certificates.
- Portfolio URLs are filtered to `http` and `https` protocols before rendering.
- Duplicate portfolio links are removed and review cards expose an accessible portfolio summary.

## Verification

- Unit coverage was added for thread tree construction, certificate lifecycle behavior, and portfolio validation.
- Existing study-group discussion tests were expanded to cover reply posting.
