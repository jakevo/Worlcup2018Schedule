import { sendPush } from './webpush.js';

const PROXY_URL = 'https://wc2026-proxy.javoucsd.workers.dev';
const LEAGUE_ID = 1;
const SEASON = 2026;

// "T-30 ± 5" — the 5-min cron leaves a 5-min window where a kickoff is
// either 25 or 35 min away. We send once and dedupe via `sent:<id>`.
const WINDOW_BEFORE_MS = 35 * 60 * 1000;
const WINDOW_OPENS_MS = 25 * 60 * 1000;

async function fetchFixtures(env) {
    const path = `/fixtures?league=${LEAGUE_ID}&season=${SEASON}`;
    // Service binding to wc2026-proxy. Use a Request object with a
    // host that resolves so the bound Worker sees Origin/Host the way
    // it expects. Path is what actually matters for routing.
    let res;
    if (env.PROXY) {
        const req = new Request(`https://wc2026-proxy.javoucsd.workers.dev${path}`, {
            headers: {
                'Accept': 'application/json',
                'Origin': 'https://worldcuphub2026.com'
            }
        });
        res = await env.PROXY.fetch(req);
    } else {
        res = await fetch(`${PROXY_URL}${path}`);
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`fixtures fetch ${res.status}: ${text.slice(0, 200)}`);
    }
    const doc = await res.json();
    return (doc && doc.response) || [];
}

function normalizeFixture(f) {
    const fixture = f.fixture || {};
    const apiTeams = f.teams || {};
    const venue = fixture.venue || {};
    return {
        id: String(fixture.id),
        kickoffMs: fixture.date ? new Date(fixture.date).getTime() : NaN,
        team1: (apiTeams.home && apiTeams.home.name) || '',
        team2: (apiTeams.away && apiTeams.away.name) || '',
        venue: venue.name || '',
        city: venue.city || '',
        round: (f.league && f.league.round) || ''
    };
}

function notificationFor(match, locale, opts = {}) {
    const isVi = locale === 'vi';
    const prefix = opts.testMode ? (isVi ? '[Thử] ' : '[Test] ') : '';
    const title = `${prefix}${match.team1} ${isVi ? 'đối' : 'vs'} ${match.team2}`.trim();
    const body = opts.testMode
        ? (isVi ? 'Push test — thông báo đến đúng cách rồi.' : 'Test push — alerts are wired up correctly.')
        : (isVi
            ? `30 phút nữa bóng lăn · ${match.venue} · ${match.city}`
            : `Kicks off in 30 min · ${match.venue} · ${match.city}`);
    return {
        title,
        body,
        url: `/match/${match.id}`,
        tag: `wc2026-${match.id}${opts.testMode ? '-test' : ''}`,
        matchId: match.id,
        icon: '/apple-touch-icon.svg',
        badge: '/favicon.svg'
    };
}

async function fanOut(env, match, opts = {}) {
    const list = await env.SUBSCRIPTIONS.list({ prefix: `match:${match.id}:` });
    if (!list.keys.length) return { matchId: match.id, total: 0, sent: 0, failed: 0, dropped: 0 };

    let sent = 0, failed = 0, dropped = 0;

    await Promise.all(list.keys.map(async (k) => {
        const raw = await env.SUBSCRIPTIONS.get(k.name);
        if (!raw) return;
        let entry;
        try { entry = JSON.parse(raw); } catch (e) { return; }
        const subscription = entry.subscription;
        const locale = entry.locale === 'vi' ? 'vi' : 'en';
        if (!subscription || !subscription.endpoint) return;

        try {
            const result = await sendPush({
                subscription,
                payload: notificationFor(match, locale, opts),
                vapidPublicKey: env.VAPID_PUBLIC_KEY,
                vapidPrivateKey: env.VAPID_PRIVATE_KEY,
                vapidSubject: env.VAPID_SUBJECT
            });
            if (result.status === 410 || result.status === 404) {
                await env.SUBSCRIPTIONS.delete(k.name);
                dropped++;
            } else if (result.ok) {
                sent++;
            } else {
                failed++;
                console.error('push http', result.status, result.statusText, k.name);
            }
        } catch (e) {
            failed++;
            console.error('push throw', String(e), k.name);
        }
    }));

    return { matchId: match.id, total: list.keys.length, sent, failed, dropped };
}

async function runCron(env) {
    if (!env.SUBSCRIPTIONS) throw new Error('SUBSCRIPTIONS KV not bound');
    if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) {
        throw new Error('VAPID env vars missing');
    }

    const fixtures = (await fetchFixtures(env)).map(normalizeFixture);
    const now = Date.now();

    const upcoming = fixtures.filter(m => {
        if (!m.kickoffMs || isNaN(m.kickoffMs)) return false;
        const delta = m.kickoffMs - now;
        return delta > WINDOW_OPENS_MS && delta <= WINDOW_BEFORE_MS;
    });

    const results = [];
    for (const m of upcoming) {
        const sentKey = `sent:${m.id}`;
        if (await env.SUBSCRIPTIONS.get(sentKey)) {
            results.push({ matchId: m.id, skipped: 'already_sent' });
            continue;
        }
        const r = await fanOut(env, m);
        await env.SUBSCRIPTIONS.put(sentKey, '1', { expirationTtl: 60 * 60 * 12 });
        results.push(r);
    }
    return { ranAt: new Date().toISOString(), totalUpcoming: upcoming.length, results };
}

async function runTestPush(env, matchId) {
    if (!env.SUBSCRIPTIONS) throw new Error('SUBSCRIPTIONS KV not bound');
    if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) {
        throw new Error('VAPID env vars missing');
    }
    const fixtures = (await fetchFixtures(env)).map(normalizeFixture);
    const match = fixtures.find(m => m.id === String(matchId));
    if (!match) {
        return { error: 'match_not_found', matchId, totalFixtures: fixtures.length };
    }
    return await fanOut(env, match, { testMode: true });
}

function withCors(res) {
    const h = new Headers(res.headers);
    h.set('Access-Control-Allow-Origin', '*');
    return new Response(res.body, { status: res.status, headers: h });
}

export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil(
            runCron(env).catch((e) => console.error('[push] cron failed:', e))
        );
    },

    async fetch(request, env) {
        const url = new URL(request.url);

        // Both debug endpoints require the same trigger key.
        const key = request.headers.get('x-trigger-key') || url.searchParams.get('key');
        if (url.pathname === '/run' || url.pathname === '/test-push') {
            if (!env.TRIGGER_KEY || key !== env.TRIGGER_KEY) {
                return withCors(new Response('forbidden', { status: 403 }));
            }
        }

        if (url.pathname === '/run') {
            try {
                const result = await runCron(env);
                return withCors(new Response(JSON.stringify(result, null, 2), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            } catch (e) {
                return withCors(new Response(JSON.stringify({ error: String(e) }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        }

        if (url.pathname === '/test-push') {
            const matchId = url.searchParams.get('matchId');
            if (!matchId) {
                return withCors(new Response(JSON.stringify({ error: 'missing matchId' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            try {
                const result = await runTestPush(env, matchId);
                return withCors(new Response(JSON.stringify(result, null, 2), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            } catch (e) {
                return withCors(new Response(JSON.stringify({ error: String(e) }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        }

        return new Response('wc2026 push sender', { status: 200 });
    }
};
