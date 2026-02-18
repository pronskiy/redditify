/**
 * Redditify Proxy Worker
 * 
 * A Cloudflare Worker that proxies Reddit JSON API requests.
 * Handles CORS, caching, rate limiting, and retries.
 */

export interface Env {
  // KV namespace for caching (optional, falls back to Cache API)
  REDDIT_CACHE?: KVNamespace;
}

const CACHE_TTL = 300; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function errorResponse(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Redditify/1.0; +https://github.com/pronskiy/redditify)',
    'Accept': 'application/json',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on 4xx client errors (except 429 rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // Rate limited - wait longer
      if (response.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 2)));
        continue;
      }
      
      // Server error - retry with backoff
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

function parseRedditUrl(urlParam: string): string | null {
  try {
    // Handle both full URLs and paths
    let url: URL;
    
    if (urlParam.startsWith('http')) {
      url = new URL(urlParam);
    } else {
      url = new URL(urlParam, 'https://www.reddit.com');
    }
    
    // Validate it's a reddit.com URL
    if (!url.hostname.endsWith('reddit.com')) {
      return null;
    }
    
    // Extract the path and ensure it ends with .json
    let path = url.pathname;
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    if (!path.endsWith('.json')) {
      path = `${path}.json`;
    }
    
    return `https://www.reddit.com${path}`;
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    // Only allow GET requests
    if (request.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }
    
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }
    
    // Main proxy endpoint: /thread?url=<reddit_url>
    if (url.pathname === '/thread') {
      const redditUrl = url.searchParams.get('url');
      
      if (!redditUrl) {
        return errorResponse('Missing "url" parameter', 400);
      }
      
      const parsedUrl = parseRedditUrl(redditUrl);
      if (!parsedUrl) {
        return errorResponse('Invalid Reddit URL', 400);
      }
      
      // Check cache first
      const cacheKey = `reddit:${parsedUrl}`;
      const cache = caches.default;
      
      let cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Add cache hit header
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Cache', 'HIT');
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          headers,
        });
      }
      
      // Fetch from Reddit
      try {
        const redditResponse = await fetchWithRetry(parsedUrl);
        
        if (!redditResponse.ok) {
          return errorResponse(
            `Reddit API error: ${redditResponse.status} ${redditResponse.statusText}`,
            redditResponse.status >= 500 ? 502 : redditResponse.status
          );
        }
        
        const data = await redditResponse.json();
        
        // Create response with cache headers
        const response = jsonResponse(data, 200, {
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
        });
        
        // Store in cache (non-blocking)
        ctx.waitUntil(cache.put(request, response.clone()));
        
        return response;
      } catch (error) {
        console.error('Proxy error:', error);
        return errorResponse('Failed to fetch Reddit thread', 502);
      }
    }
    
    // Search endpoint: /search?subreddit=<name>&url=<encoded_url>&sort=<sort>
    if (url.pathname === '/search') {
      const subreddit = url.searchParams.get('subreddit');
      const searchUrl = url.searchParams.get('url');
      const sort = url.searchParams.get('sort') || 'top';

      if (!subreddit) {
        return errorResponse('Missing "subreddit" parameter', 400);
      }

      if (!searchUrl) {
        return errorResponse('Missing "url" parameter', 400);
      }

      if (!/^[a-zA-Z0-9_]{1,21}$/.test(subreddit)) {
        return errorResponse('Invalid subreddit name', 400);
      }

      const validSorts = ['relevance', 'top', 'new', 'comments'];
      if (!validSorts.includes(sort)) {
        return errorResponse('Invalid sort parameter. Allowed: relevance, top, new, comments', 400);
      }

      // Check cache first
      const cache = caches.default;
      let cachedResponse = await cache.match(request);
      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Cache', 'HIT');
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          headers,
        });
      }

      // Build Reddit search URL
      const redditSearchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=url:${encodeURIComponent(searchUrl)}&restrict_sr=on&sort=${sort}`;

      try {
        const redditResponse = await fetchWithRetry(redditSearchUrl);

        if (!redditResponse.ok) {
          return errorResponse(
            `Reddit API error: ${redditResponse.status} ${redditResponse.statusText}`,
            redditResponse.status >= 500 ? 502 : redditResponse.status
          );
        }

        const data = await redditResponse.json();

        const response = jsonResponse(data, 200, {
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
        });

        ctx.waitUntil(cache.put(request, response.clone()));

        return response;
      } catch (error) {
        console.error('Search proxy error:', error);
        return errorResponse('Failed to search Reddit', 502);
      }
    }

    // 404 for unknown paths
    return errorResponse('Not found', 404);
  },
};
