export const API_ROOT = '/api';
export const DEFAULT_API_VERSION = 'v1';
export const VERSIONED_API_ROOT = `${API_ROOT}/${DEFAULT_API_VERSION}`;
export const API_VERSION_HEADER = 'X-Api-Version';
export const API_DEPRECATION_HEADER = 'X-Api-Deprecated';
export const API_DEPRECATION_INFO_HEADER = 'X-Api-Deprecation-Info';

function isVersionedApiPath(path: string): boolean {
  return path.startsWith(`${API_ROOT}/v`);
}

export function getVersionedApiPath(url: string): string {
  try {
    const base = new URL(url, 'http://localhost');
    if (isVersionedApiPath(base.pathname)) {
      return url;
    }

    if (base.pathname.startsWith(API_ROOT)) {
      base.pathname = `${VERSIONED_API_ROOT}${base.pathname.slice(API_ROOT.length)}`;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return base.toString();
      }
      return base.pathname + base.search;
    }
  } catch {
    // Fall through for malformed or non-URL strings.
  }

  if (url.startsWith(API_ROOT) && !isVersionedApiPath(url)) {
    return `${VERSIONED_API_ROOT}${url.slice(API_ROOT.length)}`;
  }

  return url;
}
