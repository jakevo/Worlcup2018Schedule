function isValidEmail(value) {
    if (typeof value !== 'string' || value.length > 254) return false;
    const trimmed = value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    if (!env || !env.WAITLIST) {
        return jsonResponse({
            error: 'storage_not_configured',
            message: 'Waitlist storage is not bound. See README.'
        }, 503);
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonResponse({ error: 'bad_json' }, 400);
    }

    const email = (body && body.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
        return jsonResponse({ error: 'invalid_email' }, 400);
    }

    const locale = (body && body.locale === 'vi') ? 'vi' : 'en';
    const ip = request.headers.get('cf-connecting-ip') || '';
    const ua = (request.headers.get('user-agent') || '').slice(0, 200);
    const now = new Date().toISOString();

    const key = `email:${email}`;
    const existing = await env.WAITLIST.get(key);
    if (existing) {
        return jsonResponse({ ok: true, status: 'already_subscribed' });
    }

    await env.WAITLIST.put(key, JSON.stringify({
        email, locale, ip, ua, signedUpAt: now
    }));

    return jsonResponse({ ok: true, status: 'subscribed' });
}

// Admin-only GET: returns the full waitlist as JSON when a valid
// ADMIN_TOKEN is presented (?token= or Authorization: Bearer …).
// Without the token returns 405 so the route doesn't leak data.
export async function onRequestGet({ request, env }) {
    if (!env || !env.WAITLIST) {
        return jsonResponse({ error: 'storage_not_configured' }, 503);
    }
    const url = new URL(request.url);
    const provided = url.searchParams.get('token')
        || (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!env.ADMIN_TOKEN || provided !== env.ADMIN_TOKEN) {
        return jsonResponse({ error: 'method_not_allowed' }, 405);
    }

    const list = await env.WAITLIST.list({ prefix: 'email:' });
    const items = await Promise.all(list.keys.map(async k => {
        const raw = await env.WAITLIST.get(k.name);
        try {
            return raw ? JSON.parse(raw) : { email: k.name.slice(6) };
        } catch (e) {
            return { email: k.name.slice(6), parseError: true };
        }
    }));

    items.sort((a, b) => (a.signedUpAt || '').localeCompare(b.signedUpAt || ''));

    return jsonResponse({ ok: true, count: items.length, items });
}
