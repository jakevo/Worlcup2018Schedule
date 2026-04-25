// Admin-only POST: flips the signup-form visibility flag in KV. ON
// means /notifications shows the launch-ping signup. /config reads
// the same KV key. Edge cache on /config means flips take ~60s to
// propagate.

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
    if (!body || typeof body.open !== 'boolean') {
        return jsonResponse({ error: 'missing_open_boolean' }, 400);
    }
    const open = body.open;
    await env.WAITLIST.put('_meta:open', open ? 'true' : 'false');
    return jsonResponse({ ok: true, signupOpen: open });
}

export async function onRequestGet({ request, env }) {
    if (!env || !env.WAITLIST) {
        return jsonResponse({ error: 'storage_not_configured' }, 503);
    }
    if (!isAuthorized(request, env)) {
        return jsonResponse({ error: 'unauthorized' }, 401);
    }
    const v = await env.WAITLIST.get('_meta:open');
    return jsonResponse({ signupOpen: v === 'true' });
}
