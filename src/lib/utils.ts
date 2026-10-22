import { formatDistanceToNow } from "date-fns";


export function formatRedditDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

const TRACKING_PARAM = /^(utm_\w+|fbclid|gclid|gclsrc|dclid|gbraid|wbraid|msclkid|yclid|twclid|ttclid|igshid|mc_cid|mc_eid|_ga|_gl|_hsenc|_hsmi|mkt_tok|srsltid)$/i;

/**
 * Strips the fragment and tracking params (utm_*, fbclid, ...) from a URL,
 * keeping the rest of the query string as written.
 */
export function cleanUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const query = parsed.search
    .slice(1)
    .split('&')
    .filter((part) => {
      if (!part) return false;
      const key = part.split('=')[0];
      try {
        return !TRACKING_PARAM.test(decodeURIComponent(key));
      } catch {
        return true;
      }
    })
    .join('&');

  parsed.search = query ? `?${query}` : '';
  parsed.hash = '';
  return parsed.toString();
}

/**
 * URL of the current page as it should be looked up on Reddit:
 * <link rel="canonical">, then og:url, then location.href.
 */
export function getPageUrl(): string {
  const candidates = [
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href'),
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.getAttribute('content'),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const resolved = new URL(candidate, window.location.href);
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
        return cleanUrl(resolved.toString());
      }
    } catch {
      // ignore malformed values and try the next source
    }
  }

  return cleanUrl(window.location.href);
}

export function getRedditJson(url: string): string {
  // Convert regular Reddit URL to JSON URL
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  if (!url.endsWith('.json')) {
    url = `${url}.json`;
  }
  
  return url;
}
