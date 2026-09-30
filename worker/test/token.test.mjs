// Reddit OAuth token handling. Run with `npm test` (Node runs the TypeScript source directly).
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Each import with a new query string is a fresh module, like a fresh Worker isolate
let isolates = 0;
const freshIsolate = async () => (await import(`../src/index.ts?isolate=${++isolates}`)).default;

const env = { REDDIT_CLIENT_ID: 'id', REDDIT_CLIENT_SECRET: 'secret' };
const ctx = { waitUntil() {} };
const get = (worker, path) => worker.fetch(new Request(`https://proxy.test${path}`), env, ctx);

// Fakes for the per-colo Cache API and for Reddit. `tokenStatuses` are served in order, then 200s.
function setup(tokenStatuses = []) {
  const store = new Map();
  const key = (k) => (typeof k === 'string' ? k : k.url);
  globalThis.caches = {
    default: {
      match: async (k) => store.get(key(k))?.clone(),
      put: async (k, res) => { store.set(key(k), res.clone()); },
    },
  };

  const calls = { token: 0 };
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes('/api/v1/access_token')) {
      calls.token++;
      const status = tokenStatuses.shift() ?? 200;
      return status === 200
        ? Response.json({ access_token: `token-${calls.token}`, expires_in: 86400 })
        : new Response('Too Many Requests', { status });
    }
    return Response.json(url.includes('/search') ? { kind: 'Listing', data: { children: [] } } : [{}, {}]);
  };
  return calls;
}

test('isolates in the same colo share one token', async () => {
  const calls = setup();
  const a = await freshIsolate();
  const b = await freshIsolate();

  assert.equal((await get(a, '/thread?url=/r/PHP/comments/a1/one')).status, 200);
  assert.equal((await get(b, '/thread?url=/r/PHP/comments/b2/two')).status, 200);
  assert.equal(calls.token, 1);
});

test('concurrent requests in a fresh isolate fetch one token', async () => {
  const calls = setup();
  const worker = await freshIsolate();

  const responses = await Promise.all(
    ['c1', 'c2', 'c3'].map((id) => get(worker, `/thread?url=/r/PHP/comments/${id}/x`)),
  );
  assert.deepEqual(responses.map((r) => r.status), [200, 200, 200]);
  assert.equal(calls.token, 1);
});

test('a 429 from the token endpoint is retried', async () => {
  const calls = setup([429]);
  const worker = await freshIsolate();

  assert.equal((await get(worker, '/search?subreddit=PHP&url=https://example.com/post')).status, 200);
  assert.equal(calls.token, 2);
});

test('persistent token failures still return 502 with the reason', async () => {
  const calls = setup([429, 429, 429]);
  const worker = await freshIsolate();

  const res = await get(worker, '/thread?url=/r/PHP/comments/d4/x');
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /token request failed: 429/);
  assert.equal(calls.token, 3);
});

test('the shared token is not reachable over HTTP', async () => {
  setup();
  const worker = await freshIsolate();
  await get(worker, '/thread?url=/r/PHP/comments/e5/x');

  const res = await get(worker, '/__reddit-oauth-token');
  assert.equal(res.status, 404);
  assert.doesNotMatch(await res.text(), /token-1/);
});
