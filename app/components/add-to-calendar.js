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

    icsUrl: computed('match.{date,time,team1,team2,group,venue,city}', function () {
        const m = this.get('match') || {};
        const params = new URLSearchParams({
            date: m.date || '',
            time: m.time || '',
            t1: m.team1 || '',
            t2: m.team2 || '',
            g: m.group || '',
            v: m.venue || '',
            c: m.city || ''
        });
        return `/ics?${params.toString()}`;
    }),

    actions: {
        toggle() {
            this.set('isOpen', !this.get('isOpen'));
        },
        close() {
            this.set('isOpen', false);
        }
    }
});
