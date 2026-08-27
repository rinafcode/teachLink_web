import DOMPurify from 'dompurify';
import { ALLOWED_LINK_DOMAINS } from '@/constants/app.constants';

const SAFE_URL_SCHEMES = new Set(['http:', 'https:']);

const isAllowedDomain = (hostname: string): boolean =>
  ALLOWED_LINK_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

const isSafeUrl = (value: string): boolean => {
  const scheme = value.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme && !SAFE_URL_SCHEMES.has(`${scheme}:`)) return false;

  try {
    const parsed = new URL(value);
    return SAFE_URL_SCHEMES.has(parsed.protocol) && isAllowedDomain(parsed.hostname);
  } catch {
    return true;
  }
};

let hookRegistered = false;
if (typeof window !== 'undefined' && !hookRegistered) {
  hookRegistered = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const href = node.getAttribute('href');
    if (href !== null && !isSafeUrl(href)) node.removeAttribute('href');

    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src');
      let allowed = false;
      try {
        const parsed = new URL(src ?? '');
        allowed = SAFE_URL_SCHEMES.has(parsed.protocol) && parsed.hostname.endsWith('youtube-nocookie.com');
      } catch {
        // Invalid iframe source.
      }
      if (!allowed) node.remove();
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
  if (!trimmed || !isSafeUrl(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    return SAFE_URL_SCHEMES.has(parsed.protocol) && isAllowedDomain(parsed.hostname)
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
};
