# Redditify Proxy Worker

A Cloudflare Worker that proxies Reddit JSON API requests, solving CORS and rate limiting issues.

## Features

- ✅ CORS headers for browser requests
- ✅ Response caching (5 min TTL)
- ✅ Automatic retries with backoff
- ✅ Proper User-Agent headers
- ✅ URL validation (only reddit.com)

## Deployment

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Configure Reddit OAuth credentials (required)

Reddit blocks unauthenticated JSON API access from datacenter IPs (including
Cloudflare Workers), so the worker authenticates via Reddit's application-only
OAuth flow.

1. Go to https://www.reddit.com/prefs/apps and click "create another app..."
2. Choose type **script**, any name, and `http://localhost` as redirect URI
3. Note the client ID (under the app name) and the secret
4. Set them as worker secrets:

```bash
cd worker
wrangler secret put REDDIT_CLIENT_ID
wrangler secret put REDDIT_CLIENT_SECRET
```

The free OAuth tier allows 100 queries/minute per client — comfortable with
the worker's 5-minute response cache.

### 4. Deploy

```bash
cd worker
npm install
npm run deploy
```

Your worker will be available at: `https://redditify-proxy.<your-subdomain>.workers.dev`

## Usage

### Endpoint

```
GET /thread?url=<reddit_thread_url>
```

### Example

```bash
curl "https://redditify-proxy.example.workers.dev/thread?url=https://www.reddit.com/r/PHP/comments/abc123/example"
```

### Response

Returns the raw Reddit JSON data with CORS headers.

## Configuration

### Custom Domain

Edit `wrangler.toml` to add a custom domain:

```toml
routes = [
  { pattern = "reddit-proxy.yourdomain.com", custom_domain = true }
]
```

### Cache TTL

Edit `src/index.ts` and change `CACHE_TTL` (in seconds):

```typescript
const CACHE_TTL = 300; // 5 minutes
```

## Rate Limits

Cloudflare Workers free tier: 100,000 requests/day

With caching, this handles significant traffic. For higher volume, upgrade to Workers Paid ($5/mo for 10M requests).

## Using with Redditify

After deploying, update your Redditify usage:

```html
<script>
  window.REDDITIFY_PROXY_URL = 'https://your-worker.workers.dev';
</script>
<script src="https://unpkg.com/redditify/dist/redditify.min.js"></script>
```

Or set to `null` to disable proxy (direct fetch, may hit CORS):

```html
<script>
  window.REDDITIFY_PROXY_URL = null;
</script>
```
