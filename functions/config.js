// Public read-only config flags. Right now just the waitlist toggle —
// add more here as needed. Cached 60s at the edge so the bell that
// flips the flag in the admin UI takes a minute to propagate.

function jsonResponse(payload, status = 200, cacheSeconds = 60) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': `public, max-age=${cacheSeconds}`
        }
    });
}

export async function onRequestGet({ env }) {
    let waitlistOpen = false;
    if (env && env.WAITLIST) {
        const v = await env.WAITLIST.get('_meta:open');
        waitlistOpen = v === 'true';
    }
    return jsonResponse({ waitlistOpen });
}
