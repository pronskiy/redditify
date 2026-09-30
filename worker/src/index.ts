/**
 * Redditify Proxy Worker
 * 
 * A Cloudflare Worker that proxies Reddit JSON API requests.
 * Handles CORS, caching, rate limiting, and retries.
 */

export interface Env {
  // KV namespace for caching (optional, falls back to Cache API)
  REDDIT_CACHE?: KVNamespace;
  // Reddit OAuth app credentials (wrangler secret put REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET).
  // Required since Reddit blocks unauthenticated JSON API access from datacenter IPs.
  REDDIT_CLIENT_ID?: string;
  REDDIT_CLIENT_SECRET?: string;
}

const CACHE_TTL = 300; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const USER_AGENT = 'web:redditify-proxy:1.0 (by /u/pronskiy; +https://github.com/pronskiy/redditify)';

type Token = { token: string; expiresAt: number };

// Module-scope token cache; persists across requests within a worker isolate.
// Isolates are short-lived, so the token is also shared per colo via the Cache API:
// Reddit rate-limits token requests (429) when every new isolate asks for its own.
let tokenCache: Token | null = null;
let tokenRequest: Promise<string> | null = null;

async function getAccessToken(env: Env, origin: string): Promise<string | null> {
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET) {
    return null;
  }

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // Not reachable by clients: the handlers only match the cache against their own request URLs
  const cacheKey = `${origin}/__reddit-oauth-token`;
  const shared = await readSharedToken(cacheKey);
  if (shared) {
    tokenCache = shared;
    return shared.token;
  }

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // Concurrent requests in this isolate wait for the same token request
  tokenRequest ??= requestToken(env, cacheKey).finally(() => {
    tokenRequest = null;
  });
  return tokenRequest;
}

async function readSharedToken(cacheKey: string): Promise<Token | null> {
  try {
    const cached = await caches.default.match(cacheKey);
    if (!cached) {
      return null;
    }
    const token = await cached.json() as Token;
    return token.expiresAt > Date.now() ? token : null;
  } catch {
    return null;
  }
}

async function requestToken(env: Env, cacheKey: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    });

    if (response.ok) {
      const data = await response.json() as { access_token: string; expires_in: number };
      // Refresh 60s before actual expiry
      const ttl = data.expires_in - 60;
      tokenCache = { token: data.access_token, expiresAt: Date.now() + ttl * 1000 };
      console.log('Fetched a new Reddit OAuth token');

      try {
        await caches.default.put(cacheKey, new Response(JSON.stringify(tokenCache), {
          headers: { 'Cache-Control': `max-age=${ttl}` },
        }));
      } catch (error) {
        console.error('Could not share Reddit OAuth token:', error);
      }

      return data.access_token;
    }

    // Rate limited or Reddit hiccup - back off and try again
    if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
      console.warn(`Reddit token request got ${response.status}, retrying`);
      await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
      continue;
    }

    throw new Error(`Reddit token request failed: ${response.status}`);
  }

  throw new Error('Max retries exceeded');
}

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

async function fetchWithRetry(url: string, env: Env, origin: string, retries = MAX_RETRIES): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json',
  };

  // With OAuth credentials, use the authenticated API host — the public
  // www.reddit.com JSON endpoints return 403 for datacenter IPs.
  const token = await getAccessToken(env, origin);
  if (token) {
    url = url.replace('https://www.reddit.com/', 'https://oauth.reddit.com/');
    headers['Authorization'] = `Bearer ${token}`;
  }

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
        const redditResponse = await fetchWithRetry(parsedUrl, env, url.origin);
        
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
        return errorResponse(`Failed to fetch Reddit thread: ${String(error)}`, 502);
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
        const redditResponse = await fetchWithRetry(redditSearchUrl, env, url.origin);

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
        return errorResponse(`Failed to search Reddit: ${String(error)}`, 502);
      }
    }

    // 404 for unknown paths
    return errorResponse('Not found', 404);
  },
};
