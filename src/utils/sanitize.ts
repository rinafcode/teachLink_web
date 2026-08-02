import DOMPurify from 'dompurify';
import { ALLOWED_LINK_DOMAINS } from '@/constants/app.constants';

const SAFE_URL_SCHEMES = ['http:', 'https:'];

/**
 * Returns true when the hostname belongs to (or is a subdomain of) an allowlisted domain.
 * e.g. "www.youtube.com" matches "youtube.com".
 */
const isAllowedDomain = (hostname: string): boolean =>
  ALLOWED_LINK_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

// Register the DOMPurify hook once at module load time.
// It strips `href` attributes whose absolute URLs don't pass domain validation.
// Relative URLs (e.g. "/about", "#section") are left untouched — they resolve to the same origin.
let _hookRegistered = false;
if (typeof window !== 'undefined' && !_hookRegistered) {
  _hookRegistered = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const href = node.getAttribute('href');
    if (href === null) return;
    try {
      const parsed = new URL(href);
      if (!SAFE_URL_SCHEMES.includes(parsed.protocol) || !isAllowedDomain(parsed.hostname)) {
        node.removeAttribute('href');
      }
    } catch {
      // new URL() throws for relative URLs — allow them (they stay on the same origin)
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src');
      if (src === null) return;
      let allowed = false;
      try {
        const parsed = new URL(src);
        // Only allow YouTube nocookie domain
        if (
          SAFE_URL_SCHEMES.includes(parsed.protocol) &&
          parsed.hostname.endsWith('youtube-nocookie.com')
        ) {
          allowed = true;
        }
      } catch {
        // Invalid URL – not allowed
      }
      if (!allowed) {
        node.removeAttribute('src');
        node.removeAttribute('allowfullscreen');
        return;
      }
      // Preserve allowfullscreen if present on allowed iframe
      if (node.hasAttribute('allowfullscreen')) {
        node.setAttribute('allowfullscreen', '');
      }
    }
  });
}

export const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['frameborder', 'src', 'allowfullscreen'],
  });
};

export const sanitizeUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!SAFE_URL_SCHEMES.includes(parsed.protocol)) return null;
    if (!isAllowedDomain(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};
