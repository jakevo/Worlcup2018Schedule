import Component from '@ember/component';
import { computed } from '@ember/object';

const MATCH_DURATION_MS = 115 * 60 * 1000;

function pad2(n) { return String(n).padStart(2, '0'); }

function parseKickoff(match) {
    const date = match.date || '2026-06-11';
    const time = match.time || '12:00';
    return new Date(`${date}T${time}:00-04:00`);
}

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

export default Component.extend({
    tagName: 'span',
    classNames: ['wc-add-cal'],
    classNameBindings: ['isOpen:is-open'],
    match: null,
    isOpen: false,

    _outsideHandler: null,

    didInsertElement() {
        this._super(...arguments);
        this._outsideHandler = (evt) => {
            if (this.get('isOpen') && this.element && !this.element.contains(evt.target)) {
                this.set('isOpen', false);
            }
        };
        document.addEventListener('click', this._outsideHandler, true);
    },

    willDestroyElement() {
        this._super(...arguments);
        if (this._outsideHandler) {
            document.removeEventListener('click', this._outsideHandler, true);
            this._outsideHandler = null;
        }
    },

    title: computed('match.{team1,team2}', function () {
        const m = this.get('match') || {};
        return `${m.team1 || 'TBD'} vs ${m.team2 || 'TBD'} — FIFA World Cup 2026`;
    }),

    description: computed('match.{group,venue,city}', function () {
        const m = this.get('match') || {};
        const bits = ['FIFA World Cup 2026'];
        if (m.group) bits.push(`Group ${m.group}`);
        if (m.venue) bits.push(m.venue);
        if (m.city) bits.push(m.city);
        return bits.join(' — ');
    }),

    location: computed('match.{venue,city}', function () {
        const m = this.get('match') || {};
        return [m.venue, m.city].filter(Boolean).join(', ');
    }),

    _window: computed('match.{date,time}', function () {
        const start = parseKickoff(this.get('match') || {});
        const end = new Date(start.getTime() + MATCH_DURATION_MS);
        return { start, end };
    }),

    gcalUrl: computed('title', 'description', 'location', '_window', function () {
        const { start, end } = this.get('_window');
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: this.get('title'),
            dates: `${toZulu(start)}/${toZulu(end)}`,
            details: this.get('description'),
            location: this.get('location')
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }),

    outlookUrl: computed('title', 'description', 'location', '_window', function () {
        const { start, end } = this.get('_window');
        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: this.get('title'),
            startdt: start.toISOString(),
            enddt: end.toISOString(),
            body: this.get('description'),
            location: this.get('location')
        });
        return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    }),

    icsFilename: computed('match.{date,team1,team2}', function () {
        const m = this.get('match') || {};
        const slug = (s) => String(s || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
        return `wc2026-${m.date}-${slug(m.team1)}-vs-${slug(m.team2)}.ics`;
    }),

    _buildIcs() {
        const m = this.get('match') || {};
        const { start, end } = this.get('_window');
        const uid = `wc2026-${m.date}-${(m.team1 || '').replace(/\s+/g, '')}-${(m.team2 || '').replace(/\s+/g, '')}@worldcup2026`;
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
            foldIcsLine(`SUMMARY:${escapeIcs(this.get('title'))}`),
            foldIcsLine(`DESCRIPTION:${escapeIcs(this.get('description'))}`),
            foldIcsLine(`LOCATION:${escapeIcs(this.get('location'))}`),
            'END:VEVENT',
            'END:VCALENDAR'
        ];
        return lines.join('\r\n');
    },

    actions: {
        toggle() {
            this.set('isOpen', !this.get('isOpen'));
        },
        close() {
            this.set('isOpen', false);
        },
        downloadIcs() {
            const ics = this._buildIcs();
            const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.get('icsFilename');
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            this.set('isOpen', false);
        }
    }
});
