import { sendPush } from './webpush.js';

const SCHEDULE_URL = 'https://worldcuphub2026.com/schedule.json';
const TEAMS_URL = 'https://worldcuphub2026.com/data.json';

// "T-30 ± 5" — the 5-min cron leaves a 5-min window where a kickoff is
// either 25 or 35 min away. We send once and dedupe via `sent:<id>`.
const WINDOW_BEFORE_KICKOFF_MS = 35 * 60 * 1000;
const WINDOW_AFTER_KICKOFF_OPENS_MS = 25 * 60 * 1000;

function slug(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) || 'TBD';
}

function deriveMatchId(m, codeByName) {
    if (m.id != null) return String(m.id);
    const t1 = codeByName.get(m.team1) || slug(m.team1);
    const t2 = codeByName.get(m.team2) || slug(m.team2);
    return `${m.date}-${t1}-${t2}`;
}

function kickoffMs(m) {
    return new Date(`${m.date}T${m.time || '00:00'}:00-04:00`).getTime();
}

function notificationFor(m, matchId, locale) {
    const isVi = locale === 'vi';
    const title = `${m.team1} ${isVi ? 'đối' : 'vs'} ${m.team2} — ${isVi ? 'Bảng' : 'Group'} ${m.group || ''}`.trim();
    const body = isVi
        ? `30 phút nữa bóng lăn · ${m.venue || ''} · ${m.city || ''}`
        : `Kicks off in 30 min · ${m.venue || ''} · ${m.city || ''}`;
    return {
        title,
        body,
        url: `/match/${matchId}`,
        tag: `wc2026-${matchId}`,
        matchId,
        icon: '/apple-touch-icon.svg',
        badge: '/favicon.svg'
    };
}

async function fetchJson(url) {
    const res = await fetch(url, { cf: { cacheTtl: 300 } });
    if (!res.ok) throw new Error(`fetch ${url} ${res.status}`);
    return res.json();
}

async function processMatch(env, match, codeByName) {
    const matchId = deriveMatchId(match, codeByName);

    // Idempotency: skip if we've already fanned out for this match.
    const sentKey = `sent:${matchId}`;
    if (await env.SUBSCRIPTIONS.get(sentKey)) return { matchId, skipped: 'already_sent' };

    const list = await env.SUBSCRIPTIONS.list({ prefix: `match:${matchId}:` });
    if (!list.keys.length) {
        // Nothing to send, but still mark sent so we don't list again
        // every 5 min for the next hour.
        await env.SUBSCRIPTIONS.put(sentKey, '1', { expirationTtl: 60 * 60 * 12 });
        return { matchId, skipped: 'no_subscribers' };
    }

    let sent = 0, failed = 0, dropped = 0;
    const byLocale = (locale) => notificationFor(match, matchId, locale);

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
                payload: byLocale(locale),
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
            }
        } catch (e) {
            failed++;
        }
    }));

    await env.SUBSCRIPTIONS.put(sentKey, '1', { expirationTtl: 60 * 60 * 12 });
    return { matchId, sent, failed, dropped, total: list.keys.length };
}

async function handle(env) {
    if (!env.SUBSCRIPTIONS) throw new Error('SUBSCRIPTIONS KV not bound');
    if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) {
        throw new Error('VAPID env vars missing');
    }

    const [schedule, teamsBlob] = await Promise.all([
        fetchJson(SCHEDULE_URL),
        fetchJson(TEAMS_URL).catch(() => ({ teams: [] }))
    ]);

    const teams = teamsBlob.teams || [];
    const codeByName = new Map(teams.map(t => [t.name, t.fifaCode]));

    const now = Date.now();
    const upcoming = (schedule.matches || [])
        .map(m => ({ m, k: kickoffMs(m) }))
        .filter(({ k }) => k - now > WINDOW_AFTER_KICKOFF_OPENS_MS && k - now <= WINDOW_BEFORE_KICKOFF_MS)
        .map(({ m }) => m);

    const results = [];
    for (const m of upcoming) {
        results.push(await processMatch(env, m, codeByName));
    }
    return { ranAt: new Date().toISOString(), windowMin: 25, windowMax: 35, count: upcoming.length, results };
}

export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil(handle(env).catch((e) => console.error('[push] cron failed:', e)));
    },

    // GET /run with x-trigger-key header lets you fire the cron logic
    // manually for testing without waiting for the next 5-min tick.
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/run') {
            const key = request.headers.get('x-trigger-key');
            if (!env.TRIGGER_KEY || key !== env.TRIGGER_KEY) {
                return new Response('forbidden', { status: 403 });
            }
            try {
                const result = await handle(env);
                return new Response(JSON.stringify(result, null, 2), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: String(e) }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        return new Response('wc2026 push sender', { status: 200 });
    }
};
