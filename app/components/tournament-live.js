import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { tournamentPhase } from '../utils/tournament-phase';

const TICK_MS = 1000;
const LIVE_WINDOW_MS = 115 * 60 * 1000;

export default Component.extend({
    clock: service('clock'),
    tagName: 'div',
    classNameBindings: [':wc-tlive', 'phaseClass'],

    matches: null,
    kickoffMs: 0,
    endMs: 0,

    _tick: 0,
    _timer: null,

    didInsertElement() {
        this._super(...arguments);
        this._timer = setInterval(() => {
            if (this.isDestroyed || this.isDestroying) return;
            this.incrementProperty('_tick');
        }, TICK_MS);
    },

    willDestroyElement() {
        this._super(...arguments);
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    },

    now: computed('_tick', 'clock._override', function () {
        return this.get('clock').now();
    }),

    phase: computed('now', 'matches.[]', 'kickoffMs', 'endMs', function () {
        return tournamentPhase(this.get('now'), {
            matches: this.get('matches') || [],
            kickoffMs: this.get('kickoffMs'),
            endMs: this.get('endMs')
        });
    }),

    phaseClass: computed('phase.kind', function () {
        return `is-${this.get('phase.kind')}`;
    }),

    isPre:    computed.equal('phase.kind', 'pre'),
    isLive:   computed.equal('phase.kind', 'live'),
    isToday:  computed.equal('phase.kind', 'today'),
    isMotd:   computed.equal('phase.kind', 'motd'),
    isEnded:  computed.equal('phase.kind', 'ended'),

    liveMatches: computed('phase', function () {
        const p = this.get('phase');
        if (p.kind !== 'live') return [];
        return p.matches.map(m => Object.assign({}, m, {
            minute: computeMinute(m.kickoff, this.get('now'))
        }));
    }),

    todayMatches: computed('phase', function () {
        const p = this.get('phase');
        return p.kind === 'today' ? p.matches : [];
    }),

    motdMatch: computed('phase', function () {
        const p = this.get('phase');
        return p.kind === 'motd' ? p.match : null;
    }),

    finalMatch: computed('phase', function () {
        const p = this.get('phase');
        return p.kind === 'ended' ? p.finalMatch : null;
    }),

    _diff: computed('now', 'kickoffMs', function () {
        return Math.max(0, (this.get('kickoffMs') || 0) - (this.get('now') || 0));
    }),
    preDays:  computed('_diff', function () { return Math.floor(this.get('_diff') / 86400000); }),
    preHours: computed('_diff', function () { return Math.floor((this.get('_diff') % 86400000) / 3600000); }),
    preMins:  computed('_diff', function () { return Math.floor((this.get('_diff') % 3600000) / 60000); }),
    preSecs:  computed('_diff', function () { return Math.floor((this.get('_diff') % 60000) / 1000); })
});

function computeMinute(kickoff, now) {
    const elapsed = now - kickoff;
    if (elapsed < 0) return null;
    if (elapsed > LIVE_WINDOW_MS) return null;
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 45) return `${minutes + 1}'`;
    if (minutes < 60) return `HT`;
    if (minutes < 105) return `${minutes - 15 + 1}'`;
    return `FT`;
}
