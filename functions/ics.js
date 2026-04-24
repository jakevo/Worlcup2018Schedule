const MATCH_DURATION_MS = 115 * 60 * 1000;

function pad2(n) { return String(n).padStart(2, '0'); }

function toZulu(d) {
    return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}

function escapeIcs(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\')
        .replace(/([;,])/g, '\\$1')
        .replace(/\r?\n/g, '\\n');
}

function foldIcsLine(line) {
    if (line.length <= 75) return line;
    const parts = [];
    let i = 0;
    while (i < line.length) {
        parts.push((i === 0 ? '' : ' ') + line.slice(i, i + 73));
        i += 73;
    }
    return parts.join('\r\n');
}

function slug(s) {
    return String(s || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'team';
}

export async function onRequestGet({ request }) {
    const q = new URL(request.url).searchParams;
    const date = q.get('date') || '2026-06-11';
    const time = q.get('time') || '12:00';
    const team1 = q.get('t1') || 'TBD';
    const team2 = q.get('t2') || 'TBD';
    const group = q.get('g') || '';
    const venue = q.get('v') || '';
    const city = q.get('c') || '';

    const start = new Date(`${date}T${time}:00-04:00`);
    if (isNaN(start.getTime())) {
        return new Response('Invalid date/time', { status: 400 });
    }
    const end = new Date(start.getTime() + MATCH_DURATION_MS);

    const title = `${team1} vs ${team2} — FIFA World Cup 2026`;
    const descBits = ['FIFA World Cup 2026'];
    if (group) descBits.push(`Group ${group}`);
    if (venue) descBits.push(venue);
    if (city) descBits.push(city);
    const description = descBits.join(' — ');
    const location = [venue, city].filter(Boolean).join(', ');
    const uid = `wc2026-${date}-${team1.replace(/\s+/g, '')}-${team2.replace(/\s+/g, '')}@worldcup2026`;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//World Cup 2026//Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${toZulu(new Date())}`,
        `DTSTART:${toZulu(start)}`,
        `DTEND:${toZulu(end)}`,
        foldIcsLine(`SUMMARY:${escapeIcs(title)}`),
        foldIcsLine(`DESCRIPTION:${escapeIcs(description)}`),
        foldIcsLine(`LOCATION:${escapeIcs(location)}`),
        'END:VEVENT',
        'END:VCALENDAR'
    ];
    const body = lines.join('\r\n');
    const filename = `wc2026-${date}-${slug(team1)}-vs-${slug(team2)}.ics`;

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'public, max-age=300'
        }
    });
}
