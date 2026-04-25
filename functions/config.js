// Public read-only config flags. Cached 60s at the edge so toggles
// from the admin UI take a minute to propagate.
//
// `signupOpen=true` means the launch-ping signup form is visible on
// /notifications. Direct semantic — admin toggle ON shows the form.

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
    let signupOpen = false;
    if (env && env.WAITLIST) {
        const v = await env.WAITLIST.get('_meta:open');
        signupOpen = v === 'true';
    }
    return jsonResponse({ signupOpen });
}
