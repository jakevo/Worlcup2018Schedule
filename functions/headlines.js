// GET /headlines[?locale=en|vi] — fetches a soccer/football RSS feed
// (or feeds, for vi) and returns parsed items as JSON. Edge-cached
// 15 min so we don't hammer upstreams. Empty items[] on any failure
// so the ticker degrades to its hardcoded placeholder.
//
// Sources:
//   en: ESPN soccer general feed.
//   vi: thethao247.vn — World Cup 2026, World Cup general, and
//       international football. Items are merged, deduped by title,
//       and sorted newest-first.

const CACHE_SECONDS = 900;

const FEEDS = {
    en: ['https://www.espn.com/espn/rss/soccer/news'],
    vi: [
        'https://thethao247.vn/world-cup-2026-c35.rss',
        'https://thethao247.vn/world-cup.rss',
        'https://thethao247.vn/bong-da-quoc-te-c2.rss'
    ]
};

function jsonResponse(payload, status = 200, cacheSeconds = CACHE_SECONDS) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': `public, max-age=${cacheSeconds}`
        }
    });
}

async function fetchXml(url) {
    try {
        const r = await fetch(url, {
            cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
            headers: { 'User-Agent': 'wc2026-headlines/1.0' }
        });
        return r.ok ? await r.text() : null;
    } catch (e) {
        return null;
    }
}

export async function onRequestGet({ request }) {
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') === 'vi' ? 'vi' : 'en';
    const urls = FEEDS[locale] || FEEDS.en;

    try {
        const xmls = await Promise.all(urls.map(fetchXml));
        const all = [];
        for (const xml of xmls) {
            if (xml) all.push(...parseRssItems(xml));
        }
        const seen = new Set();
        const deduped = all.filter(it => {
            if (!it.title || seen.has(it.title)) return false;
            seen.add(it.title);
            return true;
        });
        deduped.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));
        return jsonResponse({ items: deduped.slice(0, 10), locale });
    } catch (err) {
        return jsonResponse({ items: [], error: 'fetch_failed', locale }, 200, 60);
    }
}

function parseRssItems(xml) {
    const items = [];
    const itemRe = /<item[\s\S]*?>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml))) {
        const block = m[1];
        const title = stripCdata(extractTag(block, 'title'));
        const link = stripCdata(extractTag(block, 'link'));
        const pubDate = stripCdata(extractTag(block, 'pubDate'));
        if (title) items.push({ title, link, pubDate });
    }
    return items;
}

function extractTag(block, tag) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = block.match(re);
    return m ? m[1].trim() : '';
}

function stripCdata(s) {
    if (!s) return '';
    const m = s.match(/^<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
    return (m ? m[1] : s).trim();
}
