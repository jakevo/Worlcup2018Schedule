// Admin-only POST: flips the waitlist-open flag in KV. The /config
// endpoint reads it; the public /notifications page reads /config to
// decide whether to show the signup form. Edge cache on /config means
// flips take ~60s to propagate.

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function isAuthorized(request, env) {
    const url = new URL(request.url);
    const provided = url.searchParams.get('token')
        || (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    return env && env.ADMIN_TOKEN && provided === env.ADMIN_TOKEN;
}

export async function onRequestPost({ request, env }) {
    if (!env || !env.WAITLIST) {
        return jsonResponse({ error: 'storage_not_configured' }, 503);
    }
    if (!isAuthorized(request, env)) {
        return jsonResponse({ error: 'unauthorized' }, 401);
    }
    let body;
    try { body = await request.json(); } catch (e) {
        return jsonResponse({ error: 'bad_json' }, 400);
    }
    const open = body && body.open === true;
    await env.WAITLIST.put('_meta:open', open ? 'true' : 'false');
    return jsonResponse({ ok: true, waitlistOpen: open });
}

export async function onRequestGet({ request, env }) {
    if (!env || !env.WAITLIST) {
        return jsonResponse({ error: 'storage_not_configured' }, 503);
    }
    if (!isAuthorized(request, env)) {
        return jsonResponse({ error: 'unauthorized' }, 401);
    }
    const v = await env.WAITLIST.get('_meta:open');
    return jsonResponse({ waitlistOpen: v === 'true' });
}
