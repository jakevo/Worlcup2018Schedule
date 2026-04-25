// Push subscription store. POST adds a (match, subscription) pair, DELETE
// removes it. Cron Worker reads keys by `match:<matchId>:` prefix to
// fan out 30-min-pre-kickoff pushes.

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

async function hashEndpoint(endpoint) {
    const data = new TextEncoder().encode(String(endpoint));
    const buf = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(buf);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex.slice(0, 24);
}

function isValidMatchId(value) {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

function isValidSubscription(s) {
    return s
        && typeof s === 'object'
        && typeof s.endpoint === 'string'
        && /^https:\/\//.test(s.endpoint)
        && s.endpoint.length < 2000
        && s.keys
        && typeof s.keys.p256dh === 'string'
        && typeof s.keys.auth === 'string';
}

export async function onRequestPost({ request, env }) {
    if (!env || !env.SUBSCRIPTIONS) {
        return jsonResponse({ error: 'storage_not_configured' }, 503);
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonResponse({ error: 'bad_json' }, 400);
    }

    const matchId = body && body.matchId;
    const subscription = body && body.subscription;
    const locale = (body && body.locale === 'vi') ? 'vi' : 'en';

    if (!isValidMatchId(matchId)) {
        return jsonResponse({ error: 'invalid_match_id' }, 400);
    }
    if (!isValidSubscription(subscription)) {
        return jsonResponse({ error: 'invalid_subscription' }, 400);
    }

    const endpointHash = await hashEndpoint(subscription.endpoint);
    const key = `match:${matchId}:${endpointHash}`;

    await env.SUBSCRIPTIONS.put(key, JSON.stringify({
        matchId,
        subscription,
        locale,
        createdAt: new Date().toISOString()
    }));

    return jsonResponse({ ok: true, status: 'subscribed' });
}

export async function onRequestDelete({ request, env }) {
    if (!env || !env.SUBSCRIPTIONS) {
        return jsonResponse({ error: 'storage_not_configured' }, 503);
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonResponse({ error: 'bad_json' }, 400);
    }

    const matchId = body && body.matchId;
    const endpoint = body && body.endpoint;

    if (!isValidMatchId(matchId) || typeof endpoint !== 'string') {
        return jsonResponse({ error: 'invalid_payload' }, 400);
    }

    const endpointHash = await hashEndpoint(endpoint);
    await env.SUBSCRIPTIONS.delete(`match:${matchId}:${endpointHash}`);

    return jsonResponse({ ok: true, status: 'unsubscribed' });
}
