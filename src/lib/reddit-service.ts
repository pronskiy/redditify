import { getRedditJson } from './utils';
import { RedditThreadResponse, RedditCommentsResponse, RedditSearchResponse, RedditPost } from './types';

// Default proxy URL - users should deploy their own worker and update this
// or set window.REDDITIFY_PROXY_URL before loading the script
const DEFAULT_PROXY_URL = 'https://redditify-proxy.pronskiy.workers.dev';

export interface FetchOptions {
  /** Custom proxy URL. Set to null to disable proxy and fetch directly from Reddit */
  proxyUrl?: string | null;
  /** Timeout in milliseconds */
  timeout?: number;
}

function getProxyUrl(): string | null {
  // Check for global override
  if (typeof window !== 'undefined' && (window as any).REDDITIFY_PROXY_URL !== undefined) {
    return (window as any).REDDITIFY_PROXY_URL;
  }
  return DEFAULT_PROXY_URL;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRedditThread(
  url: string, 
  options: FetchOptions = {}
): Promise<[RedditThreadResponse, RedditCommentsResponse]> {
  const { proxyUrl = getProxyUrl(), timeout = 10000 } = options;
  
  try {
    let fetchUrl: string;
    
    if (proxyUrl) {
      // Use proxy
      fetchUrl = `${proxyUrl}/thread?url=${encodeURIComponent(url)}`;
    } else {
      // Direct fetch (may fail due to CORS)
      fetchUrl = getRedditJson(url);
    }
    
    const response = await fetchWithTimeout(fetchUrl, timeout);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Failed to fetch Reddit thread: ${response.status} ${response.statusText}` +
        (errorText ? ` - ${errorText}` : '')
      );
    }
    
    const data = await response.json();
    
    // Handle proxy response format (data is directly the array)
    // vs direct Reddit response (also an array)
    const threadData = Array.isArray(data) ? data : null;
    
    if (!threadData || threadData.length < 2) {
      throw new Error('Invalid Reddit thread data format');
    }
    
    return [threadData[0] as RedditThreadResponse, threadData[1] as RedditCommentsResponse];
  } catch (error) {
    // If proxy fails and we haven't tried direct yet, attempt direct fetch as fallback
    if (proxyUrl && options.proxyUrl === undefined) {
      console.warn('Proxy fetch failed, attempting direct fetch:', error);
      try {
        return await fetchRedditThread(url, { ...options, proxyUrl: null });
      } catch (directError) {
        console.error('Direct fetch also failed:', directError);
        // Throw original proxy error as it's more informative
        throw error;
      }
    }
    
    console.error('Error fetching Reddit thread:', error);
    throw error;
  }
}

export async function searchSubredditForUrl(
  subreddit: string,
  searchUrl: string,
  options: FetchOptions = {}
): Promise<RedditPost | null> {
  const { proxyUrl = getProxyUrl(), timeout = 10000 } = options;

  try {
    let fetchUrl: string;

    if (proxyUrl) {
      fetchUrl = `${proxyUrl}/search?subreddit=${encodeURIComponent(subreddit)}&url=${encodeURIComponent(searchUrl)}&sort=top`;
    } else {
      fetchUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=url:${encodeURIComponent(searchUrl)}&restrict_sr=on&sort=top`;
    }

    const response = await fetchWithTimeout(fetchUrl, timeout);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    const data: RedditSearchResponse = await response.json();

    if (data.data.children.length === 0) {
      return null;
    }

    return data.data.children[0];
  } catch (error) {
    // If proxy fails, attempt direct fetch as fallback
    if (proxyUrl && options.proxyUrl === undefined) {
      console.warn('Proxy search failed, attempting direct fetch:', error);
      try {
        return await searchSubredditForUrl(subreddit, searchUrl, { ...options, proxyUrl: null });
      } catch (directError) {
        console.error('Direct search also failed:', directError);
        throw error;
      }
    }

    console.error('Error searching subreddit:', error);
    throw error;
  }
}

export function parseRedditHtml(html: string): string {
  if (!html) return '';
  
  // Decode HTML entities
  const decoded = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Remove unnecessary divs and spans
  return decoded
    .replace(/<div class="md">(.*?)<\/div>/g, '$1')
    .replace(/<p>(.*?)<\/p>/g, '<p>$1</p>\n')
    .replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');
}
