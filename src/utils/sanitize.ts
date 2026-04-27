import DOMPurify from 'dompurify';

const SAFE_URL_SCHEMES = ['http:', 'https:'];

export const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'data-youtube-video'],
  });
};

export const sanitizeUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return SAFE_URL_SCHEMES.includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};
