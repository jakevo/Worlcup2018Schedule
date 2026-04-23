/*
 * Cloudflare Worker proxy for api-football / api-sports.io v3.
 *
 * Deploys in 2 minutes on the free Cloudflare Workers plan
 * (100,000 requests/day, zero cost). Keeps the api-sports key
 * server-side so the browser bundle never carries it.
 *
 * ───────────────────────────────────────────────────────────────
 * Setup
 * ───────────────────────────────────────────────────────────────
 * 1. Sign up / log in to Cloudflare, go to Workers & Pages → Create.
 * 2. Click "Create Worker", name it (e.g. "wc2026-proxy"), deploy
 *    the default, then click Edit Code and paste this whole file.
 * 3. Settings → Variables → Secrets → Add variable:
 *        Name:  API_SPORTS_KEY
 *        Value: <your api-football key>
 *    Save and redeploy.
 * 4. (Optional) Settings → Variables → Plain text, add:
 *        ALLOW_ORIGIN = https://your-site.example.com
 *    to restrict the CORS origin. Default "*" lets any origin call
 *    the proxy — fine for private personal use, tighten for public.
 * 5. Copy the worker URL (https://wc2026-proxy.<subdomain>.workers.dev)
 *    and set it as the dataProvider.proxyUrl in the Ember app.
 *
 * Optional: narrow the allow-list of paths the proxy will forward
 * by editing ALLOWED_PATHS below — prevents abuse where someone
 * points the worker at other api-sports endpoints against your key
 * quota.
 */

const UPSTREAM = 'https://v3.football.api-sports.io';
const ALLOWED_PATHS = [
    /^\/teams(\?|$)/,
    /^\/fixtures(\?|$)/,
    /^\/leagues(\?|$)/,
    /^\/players\/squads(\?|$)/,
    /^\/players(\?|$)/,
    /^\/fixtures\/lineups(\?|$)/,
    /^\/fixtures\/events(\?|$)/,
    /^\/fixtures\/statistics(\?|$)/
];

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const allowOrigin = env.ALLOW_ORIGIN || '*';

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(allowOrigin) });
        }
        if (request.method !== 'GET') {
            return json({ error: 'method not allowed' }, 405, allowOrigin);
        }
        if (!ALLOWED_PATHS.some(rx => rx.test(url.pathname + url.search))) {
            return json({ error: 'path not allowed' }, 403, allowOrigin);
        }
        if (!env.API_SPORTS_KEY) {
            return json({ error: 'proxy not configured: missing API_SPORTS_KEY secret' }, 500, allowOrigin);
        }

        const upstreamUrl = `${UPSTREAM}${url.pathname}${url.search}`;
        const upstreamRes = await fetch(upstreamUrl, {
            headers: { 'x-apisports-key': env.API_SPORTS_KEY },
            cf: { cacheTtl: 60, cacheEverything: true }
        });

        const body = await upstreamRes.text();
        return new Response(body, {
            status: upstreamRes.status,
            headers: Object.assign(
                { 'content-type': upstreamRes.headers.get('content-type') || 'application/json' },
                corsHeaders(allowOrigin)
            )
        });
    }
};

function corsHeaders(origin) {
    return {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400'
    };
}

function json(obj, status, allowOrigin) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: Object.assign({ 'content-type': 'application/json' }, corsHeaders(allowOrigin))
    });
}
